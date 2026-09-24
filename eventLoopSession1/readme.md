Exp1:

by default the timer/immediate race is non deterministic in a sense that when cold start(elapsed time>1ms) timeout will print else setimmediate wins and if any external factor eats the cpu in the middle than the time elapses again and settimeout prints first.

when sync coded it elapses the time for some ms and settimeout prints everytime first this is deterministic.

Exp2:

an outer timeout isnt global for the thread whenevr it encounters an inner timer it re-initiates from the 0.  from inside any callback, setImmediate wins deterministically because check is ahead in the current lap it, and fresh timer will run in the next lap.

Exp3.ts:

the module's top level code by default runs as a job in the promise queue so, when the file ends, the microtask queue is in the mid drain thus promise callbacks overrides the nexttick in the position

Exp3.cjs

Above behaviour doesnt occur in the commonJS.  after every callback drain the nexttick queue than microtask queue and loop over until both drain completely then only loop advances to a phase.

Exp3b.js

when a async function encouters the await part and the rest of the function becomes a promise and sits inert in the promise queue until the awaited promise and then runs on the  main thread.

exp4:

when serving an endpoint after an elapsed time (which successfully triggers the timers) a settimeout/setimmediate kicks the spin function which refills the nexttick/promise queue during the mid drain recursively thus not letting it exhaust blocks the endpoint getting served cause sockets never read, though the kernel still accepts connections. the setImmediate spin survives (closed per-lap batch → one spin per lap → poll runs every lap).



queues always get served first nexttick then promise then phases:  timers ->pending callback->idle/prepare -> poll -> check (immediate)-> close





1. Truly idle (no requests, no I/O in flight): the four thread-pool workers are asleep on a condition variable — descheduled, zero cycles. And here's the part you're overestimating: an established TCP connection with no traffic requires no sustaining work at all. It's just an entry in a kernel table — bytes in RAM. No code runs to "keep it alive." (TCP keep-alive probes exist but fire on the order of minutes, if enabled.) Idle really is 0%.
2. readFile in flight: now yes — a worker thread is on the CPU… briefly. Look at what "reading a file" is for that thread: it makes a blocking read() syscall, and then it goes to sleep too — because the actual byte-moving is done by the disk controller via DMA, hardware pushing data into RAM without the CPU's involvement, and the controller fires an interrupt when done. The worker's CPU cost is the short bursts around the wait: syscall entry, copying bytes from kernel buffer to your Buffer, waking up. So even the "working" thread is mostly waiting-asleep, punctuated by copies. The refined principle for your notes: CPU is spent in proportion to bytes moved and computed — never on waiting, at any layer. Every layer of this stack — JS thread in poll, worker in read(), kernel with a quiet socket — sleeps until an event wakes it.
3. The part that matters for the event loop: whatever CPU the worker does burn happens on a different core, in parallel — it never borrows time from the JS thread's lap. That's the whole point of pushing file I/O to the pool: the poll phase sleeps cheaply while someone else sweats.

*poll's sleep = 0 if immediates are queued, else time to nearest timer, else indefinite.*
