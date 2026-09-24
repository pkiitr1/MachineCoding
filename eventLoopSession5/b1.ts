




import * as http from "node:http";
import v8 from "node:v8";
import { EventEmitter } from "node:events";

    let counter=0;

    const cache= new Map<string,any>();
const bus = new EventEmitter();            // module level, lives forever
bus.setMaxListeners(0);                    // silence the warning so it leaks quietly


const server= http.createServer((req,res)=>{


  const {url,method}=req;

   if(url==="/" && method==="GET"){



   // const key= req.url + (counter++);
    bus.on("tick", () => { void req.url });

    // cache.set(key,{url:key,data:"x".repeat(10_000),at:Date.now()});
    
    res.end("ok");

   }

   if (url === "/snap") {
  const f = v8.writeHeapSnapshot();
  res.end("wrote " + f + "\n");
  return;
}


})


setInterval(() => {
  const m = process.memoryUsage();
  console.log("rss", (m.rss/1048576).toFixed(0), "heapUsed", (m.heapUsed/1048576).toFixed(0), "cache", cache.size," busCount: ", bus.listenerCount("tick"));

}, 1000);

server.listen(3000,()=>console.log("listening at 3k"))




