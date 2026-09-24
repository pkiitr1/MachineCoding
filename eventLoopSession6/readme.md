# Session 6 — Deployment and process management

**The trap:** answering "pm2" and stopping. pm2 is a tool, not a strategy.
The real question is always: *what happens to the requests that were mid-flight
when the process died?*

A deploy is a kill. Every deployment stops the old process. Everything below is
about that one moment.

---

## Diagrams

### cluster — one file, two roles

```
you run:  node s6cluster.ts
                │
                ▼
     ┌──────────────────────┐
     │ PRIMARY process      │  cluster.isPrimary === true
     │ forks N children     │  serves nothing itself
     └──────┬───────────────┘
            │ fork() re-runs the SAME file as a new PROCESS
            ├──────────────┬──────────────┬──────────────┐
            ▼              ▼              ▼              ▼
     ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
     │ worker     │ │ worker     │ │ worker     │ │ worker     │
     │ isPrimary  │ │ isPrimary  │ │ isPrimary  │ │ isPrimary  │
     │ === false  │ │ === false  │ │ === false  │ │ === false  │
     │ http server│ │ http server│ │ http server│ │ http server│
     │ own loop   │ │ own loop   │ │ own loop   │ │ own loop   │
     │ own heap   │ │ own heap   │ │ own heap   │ │ own heap   │
     └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
           └──────────────┴───────┬──────┴──────────────┘
                                  ▼
              ALL FOUR listen(4000) — no EADDRINUSE.
              The primary creates ONE listening socket and hands the
              handle down. The OS spreads connections across them.
              That shared socket IS cluster.

   Distribution is per CONNECTION, not per request.
   keep-alive client = one connection = all its requests hit ONE worker.
   (That is how session affinity happens by accident.)
```

### SIGKILL vs SIGTERM

```
SIGKILL  (taskkill /F, kill -9, OOM killer)
─────────────────────────────────────────────
  kernel stops the process. NOW.
  x cannot be caught       x cannot be blocked      x no code runs
  open sockets -> RST -> clients get connection reset

     worker ──[mid-request]──X                 client: ECONNRESET
                                               measured: 2 errors with
                                               only 10 conns in flight.
                                               At 1000 conns -> 1000 dropped.


SIGTERM  (what every deploy sends first)
─────────────────────────────────────────────
  a NOTIFICATION. Node's DEFAULT is still to exit immediately —
  same visible result as SIGKILL.
  It is only useful because it is CATCHABLE:

     process.on("SIGTERM", ...) -> YOUR code decides what happens

  SIGTERM does not drain anything. You have to write the draining.
```

### The ordered drain — and the race everyone misses

```
NAIVE (still drops requests):

  t=0    SIGTERM -> server.close()
  t=0    ...but the load balancer has not noticed yet
  t=0-2s LB STILL routing new requests here
         -> they arrive at a closed listener -> 502s
         ^ you stopped accepting before you stopped being a target


CORRECT ORDER:

  1. SIGTERM arrives
         │
  2. readiness probe -> FAILING         "stop sending me traffic"
         │                               (NOT liveness — liveness
         │                                failing means "restart me")
  3. sleep 5-15s                        let the LB actually notice
         │                               <- the step nobody expects
  4. server.close()                     stop accepting NEW connections;
         │                               existing ones finish naturally
  5. wait for in-flight to finish
         │
  6. close DB pool, flush logs
         │
  7. process.exit(0)

  ...meanwhile, a HARD DEADLINE runs in parallel:

  setTimeout(() => process.exit(1), N).unref()

  Without it, ONE hung request blocks shutdown forever.
  N must be SHORTER than the orchestrator's grace period
  (K8s terminationGracePeriodSeconds, default 30s) — that
  period is a DEADLINE, not a promise: after it, SIGKILL.
```

### Who is responsible for what

```
                 supervise      multi-core      deploy / rollout
              (restart crash)
─────────────────────────────────────────────────────────────────
cluster           x you          + shared          x
                  write it        socket
                  (on("exit")
                  only NOTIFIES)

pm2               +              + wraps          pm2 reload
                                 cluster          = rolling
                                                  pm2 restart
                                                  = hard, downtime

systemd           +              x (run N          x
                  Restart=        units)
                  always

Kubernetes        + restarts     + N replicas     + rolling +
                  containers                      probes


STACKING THEM IS THE MISTAKE.

pm2 inside a container = two supervisors:
  - pm2 restarts a dead worker in place
  - the container stays "healthy"
  - K8s never learns anything went wrong
  -> you hid failures from the thing whose job is to react to them
  -> and broke the signal chain (SIGTERM goes to pm2 as PID 1;
     now pm2 must forward it to your app)

container-native = ONE node process per container, no cluster, no pm2.
                   scale with replicas, let the orchestrator supervise.

THE EXCEPTION: a big VM with many cores and no orchestrator
               (a plain EC2 / Amazon Linux box) — there cluster or
               pm2 IS how you use those cores, and `pm2 reload` is
               genuinely the right tool.
```

### The stateful case — raise this unprompted

```
Everything above assumes SHORT, STATELESS requests.
A live poker hand is neither. Nor is a WebSocket.

  session affinity      sticky routing keeps a player on one process
                        -> makes draining WORSE: you cannot move them

  externalise to Redis  any process can serve any player
                        -> drain freely; costs a network hop per action

  drain at a natural    stop accepting NEW hands, finish the ones in
  boundary              progress, then exit
                        -> bounded by hand length, not request length

In practice: all three. Redis for durable state, affinity for the live
socket, boundary-aware draining.

For WebSockets "in-flight" is not a request — it is a connection that may
live for hours. Graceful shutdown there means TELLING CLIENTS TO
RECONNECT (close frame with a reason) so they land on a new process.
```

### Platform note

```
Graceful shutdown via SIGTERM is a UNIX mechanism.

Windows has no real signals — Node emulates them, and process.kill(pid,
"SIGTERM") terminates unconditionally regardless of any handler. Console
apps cannot receive the polite taskkill either. So the drain path CANNOT
be tested on a Windows dev box.

Real tooling works around this with IPC messaging instead
(pm2 sends process.send('shutdown')).

In production — Linux containers, K8s sending SIGTERM to PID 1 — the
signal path works normally.
```

---

## Measured (4 workers, autocannon -c 10 -d 30, /slow = ~500ms pbkdf2Sync)

| scenario | requests / 30s | p99 | errors |
|---|---|---|---|
| 4 workers, untouched | 250 | 1601 ms | 0 |
| 4 workers, one SIGKILLed mid-run | 190 | 5057 ms | **2** |
| 1 process (Session 3, for scale) | ~69 | 6020 ms | — |

- ~2.7x throughput over a single process — four cores, real parallelism.
  That is the answer to "one Node process uses one core."
- Losing a worker cost both throughput AND p99: the survivors inherit its
  traffic. "Other workers are unaffected" is true for *health*, false for *load*.
- The 2 errors are the whole point. Loss is proportional to IN-FLIGHT work,
  not to anything you control at kill time.
- `cluster.on("exit")` fired, printed, and created NO replacement.
  cluster gives you the notification; the supervision policy is yours.

---

## Notes

<!-- your words below -->
