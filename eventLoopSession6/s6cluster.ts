

import cluster from "node:cluster";

import http from "node:http";
import crypto from "node:crypto"



if (cluster.isPrimary) {
  cluster.schedulingPolicy = cluster.SCHED_RR;   // before the fork loop

  for (let i = 0; i < 4; i++) cluster.fork();
  // in the isPrimary branch, after the fork loop:
setTimeout(() => {
  const w = Object.values(cluster.workers!)[0];
  console.log("sending SIGTERM to", w?.process.pid);
  w?.process.kill("SIGTERM");
}, 10_000);

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died (${signal || code})`);
    // respawn? your choice — that's part of the experiment
  });

} else {

  const server = http.createServer((req,res)=>{
  
     const {url,method}=req;
  
     if(url=="/fast"){
      res.end("fast" + process.pid)
     }
  
     else if(url=="/slow"){
      
      crypto.pbkdf2Sync("pass","salt",1_000_000,64,"sha512")

      res.end("slow" + process.pid)
     }
  
  })
  server.listen(4000)

  process.on("SIGTERM", () => {
  console.log(process.pid, "SIGTERM: draining");
  server.close(() => {            // stop accepting NEW connections
    console.log(process.pid, "drained, exiting");
    process.exit(0);              // in-flight requests have finished
  });
  setTimeout(() => {
    console.log(process.pid, "forced exit");
    process.exit(1);
  }, 10_000).unref();


});
  // your http server here; log process.pid on each request
  console.log("worker", process.pid, "up");
}
