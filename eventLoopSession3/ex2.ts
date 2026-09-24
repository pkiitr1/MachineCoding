import { workerData } from "node:worker_threads";
import {Worker} from "node:worker_threads";

import http from "node:http";



const server = http.createServer((req,res)=>{

   const {url,method}=req;

   if(url=="/fast"){
    res.end("fast")
   }

   else if(url=="/slow"){
      

    const w= new Worker("./hashWorker.ts",{workerData:{iterations:1_000_000}});
    w.on("message",()=>{res.end("slow")});

    w.on("error",()=>{res.end("slow failed")});

   }

})

server.listen(4000,()=>console.log("here wo go 4k"))




