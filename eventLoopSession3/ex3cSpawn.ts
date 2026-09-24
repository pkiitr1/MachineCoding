

import {Worker} from "node:worker_threads";


function spawnOne1(){

    const data = Buffer.alloc(50 * 1024 * 1024);   // 50MB of zeros

    const sab = new SharedArrayBuffer(50 * 1024 * 1024);
    //const view = new Uint8Array(sab);             // to read/write the bytes

    const w=
    new Worker("./ex3cWorker.ts");
    
    let t=0;
    let stage=0;


    w.on("message",(msg)=>{
        stage++;
       
        if(stage==1 && msg==="ready"){
            t=Date.now();
            w.postMessage(data);

        } else if(stage===2){
            const cloneDuration=Date.now()-t;
            console.log(`cloned buffer transfer: ${cloneDuration}ms (bytes:${msg})`)

            t=Date.now();
            w.postMessage(sab);

        } else if(stage===3){
           
            const sharedDuration=Date.now()-t;
            console.log(`SharedArrayBuffer transfer: ${sharedDuration}ms (bytes: ${msg})`);

            w.terminate();

        }

    });

    w.on("error",(err)=>{

        console.log("failed",err)
    });
}

spawnOne1()