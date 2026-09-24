/*
 * Session 1 notes — Event loop phases and the two microtask queues
 * Experiments live in eventloop-session1/ — re-run any of them with:
 *   npx tsx eventloop-session1/<file>.ts
 *
 * PHASE ORDER (one loop iteration):
 *   timers -> pending callbacks -> idle/prepare -> poll -> check -> close
 *   - timers: run setTimeout/setInterval callbacks whose time has elapsed
 *   - poll:   pull completed I/O events from the OS, run their callbacks.
 *             This phase can BLOCK (sleep in epoll/kqueue/IOCP) waiting on
 *             I/O readiness, with a timeout = time until the nearest due
 *             timer (0 if immediates are queued). That's why an idle server
 *             burns no CPU: it's parked here, waiting on the OS.
 *   - check:  run setImmediate callbacks
 *
 * MICROTASKS (belong to NO phase):
 *   After every callback, when the JS stack empties, Node drains:
 *     1. the process.nextTick queue, to exhaustion
 *     2. the promise (V8 microtask) queue, to exhaustion
 *   ...looping between them until both are empty. Only then does the loop
 *   advance. The queues don't interleave per-callback: a promise scheduled
 *   inside a nextTick waits behind promises that were already queued (ex3:
 *   F, D, B, E, C, A in CommonJS).
 *   ESM twist: a module's top-level code IS a V8 microtask (top-level await
 *   machinery), so at ESM top level, already-queued promises run before the
 *   first nextTick drain (ex3 via tsx: F, B, D, C, E, A).
 *
 * TIMEOUT vs IMMEDIATE (ex1, ex2):
 *   - Top level: nondeterministic race (18/20 immediate-first here).
 *     setTimeout(0) is clamped to 1ms; whether the timer is "due" when the
 *     loop first enters the timers phase depends on process startup time.
 *   - Inside an I/O callback: setImmediate wins 20/20, deterministically.
 *     You're in the poll phase; check is next in this same iteration, while
 *     timers must wait for the loop to wrap around.
 *
 * STARVATION (ex4):
 *   - Recursive process.nextTick refills its queue mid-drain, and the drain
 *     runs to exhaustion -> it never exhausts -> control never returns to
 *     the loop -> the poll phase never runs -> sockets are never read.
 *     The kernel still ACCEPTS connections (listen backlog), so clients
 *     connect and then hang. Mechanically identical to while(true).
 *   - Recursive setImmediate does NOT starve: an immediate scheduled from
 *     within the check phase runs on the NEXT iteration, so every spin
 *     passes through poll. Server answered in 0.04s mid-spin (~500k
 *     iterations/sec happening underneath).
 */
