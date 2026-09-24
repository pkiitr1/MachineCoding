
import crypto from "node:crypto";

const start=Date.now()


for(let i=0;i<8;i++){

     crypto.pbkdf2("pass", "salt", 500_000, 64, "sha512", (err, key)=>    console.log("index : ",i+1,Date.now()-start));

}


// wave count = ceil(jobs / pool size)

// nproc tells how many logical processors i have doesnt tell how many full speed lanes

// 12: few fast + efficiency cores + || hyperthread pairs sharing physical hardware

// parallilism buys you throughput but not the ideal T time.

// the wave shape is deterministic signal, the milliseconds are weather. 

// widening the pool helps the CPU-bound jobs only up to the machine's real core budget, 

// the pool is true purpose is parking threads that block on I/O: so, when some tasks comes along in JS which needs a thread to be actively blocked it handoff the task at epoll now libuv donates a worker thread from the thread pool this will sit on the job behalf of the JS so that main JS thread doesnt have to sit, now when the disk delivers worker awakes hands over the result and parks again for the next job. 

// pool has two diff customers :

// waiting jobs (fs, dns.lookup): threads mostly sleeps while disk does the job, 8 threads can wait simultaneauly and consume almost no CPU.

// computing jobs(pbkdf2,zlib): thread runs flat out and now real cores are the limit.