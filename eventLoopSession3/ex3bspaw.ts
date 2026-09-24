import { workerData } from "node:worker_threads";
import {Worker} from "node:worker_threads";
import process from "node:process";

 function spawnOne(n){
      
    const t=Date.now();

    let i=0;
    while(i<n){
    console.log(process.memoryUsage().rss/1024)
    const w= new Worker("./ex3worker.ts");

    w.on("message",()=>{
        console.log(Date.now()-t,process.memoryUsage().rss)
       
    });

    w.on("error",()=>{
        console.log(Date.now()-t);
    });

    i++;

    }


}

spawnOne(10)


