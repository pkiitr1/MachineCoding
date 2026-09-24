

import {parentPort} from "node:worker_threads";




if (parentPort) parentPort.postMessage("ready");
else console.log("ran standalone:","not ready");
 