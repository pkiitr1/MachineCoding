







import {parentPort, workerData} from "node:worker_threads";
import crypto from "node:crypto";

const { iterations = 1_000_000 } = workerData ?? {};
const key =
     crypto.pbkdf2Sync("pass","salt",iterations,64,"sha512")


if (parentPort) parentPort.postMessage(key.toString("hex"));
else console.log("ran standalone:", key.toString("hex").slice(0, 16));