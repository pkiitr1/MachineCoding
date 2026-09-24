two completely different machines serve your async calls : a small pool of real threads (files, dns.lookup, crypto, zlib) vs. the kernel's readiness notifier (every socket).

JavaScript is single threaded but node uses the thread pool via libuv to outsource the blocking I/O operations.

in ex1 8 crypto parallel req needed thread to be blocked libuv donated the 4/8 threads based upon our configuration. and let the tasks run in the parallel.

Libuv's thread pool donates a worker when the OS has a no non-blocking form of the call, epoll notifes the the loop about ready sockets and doesnt consumes any threads.

JS thread offloads all the concurent requests to the libuv which donates the threads but the catch is it parallely processes the threshold amount of thread to the blocking req for processing this leads to the delay of req which are still in the queue for thread assignment like in exp1 second batch of 4 req were delayed by 300 ms at p99 this could become a more visible issue.**shared global resource, no backpressure signal, latency that stair-steps with load**

Network I/O runs using kernel notifier which runs it over the network card  for each connection a new entry gets added in the kernel table, it can scale vertically, since 10k connections would be 10k entries in the table, this makes the scaling it in nodejs easily.

lookup vs resolve4:  first uses the thread pool since OS uses the getaddrinfo() func to resolve ip which is blocking hence a thread gets assigned to process this while resolve4 is libuv's own DNS client it writes a DNS query packet and sends it over a UDP socket.


single threaded benefits: no data races on app state, no locks, no per-connection stack/context-switch a connection is a closure, not a thread.
one slow CPU-bound function stalls every request in the process. Node's waiting request keeps only the **closure** your callback captured — a small heap object holding `res`, `i`, whatever you referenced


Node gives enourmous concurrency on one thread and gives parallelism only via the worker threads.

**in prod for dns based connections: keep-alive agents** (`new http.Agent({ keepAlive: true })`) so you resolve once per *connection* instead of per request, a **DNS cache** in-process (`cacheable-lookup`), or raising `UV_THREADPOOL_SIZE`



*Move 1, the rule you already derived:* **does the OS offer a non-blocking version of this syscall?** Sockets: yes (that's what epoll/kqueue/IOCP are  *for* ) → notifier. Files, `getaddrinfo`, and pure computation: no → a thread must park in it → pool. Anything that's really **CPU work wearing an async costume** (`crypto`, `zlib`, `bcrypt`) is pool by definition — there's no syscall to wait on, someone has to actually compute.

*Move 2, and this is the one that makes you never guess again — measure it.* You built the instrument today: **clog the pool with `UV_THREADPOOL_SIZE=1` plus a long `pbkdf2`, then fire the mystery function and see if its completion is pinned to the hash's.** That's a 10-line test you can run against any library — including native addons and third-party packages, where no documentation will tell you (a native module can submit work to the same pool via `uv_queue_work`, and that's invisible from the JS API). Keep `ex3.ts` around as a reusable probe; that's a genuinely uncommon skill.
