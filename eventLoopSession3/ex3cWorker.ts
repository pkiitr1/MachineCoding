





import {parentPort,workerData} from "node:worker_threads";

import { Buffer } from "node:buffer";


if (parentPort) {
    parentPort.postMessage("ready");
    parentPort.on("message",(data:any)=>parentPort.postMessage(data.byteLength)) ;
}


else 
    console.log("ran standalone")
