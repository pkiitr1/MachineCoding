in first ex1

we have seen pbkdf2Sync runs on the js thread and blocks until it processes completely, reason its just a C function which executes directly rather js api sending it to thread pool.

there is no JS API which can submit the work to the pool 


in ex2


for slow req we have assigned a worker to handle it, the worker cold starts for the every call takes ~160ms and then processes the req and responds while js thread remains free to process any fast req meanwhile, now one thing is for any subsequent slow req it processes the http req and then only task gets submitted to the worker

each req build and destroys an entire V8 isolate.


in ex3b 

we have seen every worker gets its own heap memory for each worker which results in bloated memory usage

in ex3c 

clone memeory which happens by default and passing pointer to the data difference has been discussed, passing pointer is the optimization but it in prod there are caveats around it, like if main thread and worker writes to the same reference of data then we will see atomic race condition bugs which was the whole point of js to solve by being single threaded, and another thing is objects cant be passed for ref only data like images and any other whole datasets can be passed efficient way ofusing it would be only if js doesnt performs any operations on it, although there are other easier methods to consder as well like queues.


one more point is workers have cold start time in this machine ~160ms, so if CPU_cost processing on main thread would be higher then this + passing the data (~1-2ms on curr machine) then only worker can be considered, there is another of passing the data to the worker to optimize the memory cost that is transferList which is a zero copy ownership handoff, the buf becomes unusable on the sending side thus race cant occur. 


for loop: JS loops through the req without waiting for the response from worker while worker is still in start phase thus all the req reach concurrently 

*Note:

*workers are not a general scaling answer; for I/O-bound work they're strictly worse than doing nothing* — is the thing the session is named for. Add the thread budget too: `processes × (1 + workers) ≈ cores`

worker threads: separate V8 isolate, same process, shared mem only via SharedArrayBuffer


---

## Appendix — measured numbers (this machine)

`/fast` = handler that only does `res.end("fast")`. `/slow` = pbkdf2Sync, 1,000,000 iterations (~500ms).
Load generated with `autocannon -c 10`.

| `/fast` | p50 | p99 | req/sec |
|---|---|---|---|
| idle server | 0 ms | 0 ms | 43,850 |
| while `/slow` runs on the main thread | 7728 ms | 7728 ms | ~2 |
| while `/slow` runs in a worker | 0 ms | 1 ms | 24,338 |

| `/slow` | p50 | p99 | throughput |
|---|---|---|---|
| on the main thread | 5599 ms | 6020 ms | 46 reqs / 20s |
| one worker spawned per request | 1102 ms | 1354 ms | 190 reqs / 20s |

Worker costs:

| | cost |
|---|---|
| spawn a do-nothing worker (under tsx) | ~160 ms |
| round-trip floor (message with nothing to copy) | 0–2 ms |
| postMessage 50MB Buffer (structured clone) | 31–42 ms |
| postMessage 50MB SharedArrayBuffer | 0–2 ms |

Clone vs shared ratio: ~35:1. The clone cost is paid **synchronously on the main thread**, so
`postMessage` of a large payload blocks the loop exactly like any other sync work.
