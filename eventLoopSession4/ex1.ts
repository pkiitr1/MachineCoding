


import {Writable} from "node:stream";
import * as fs from "node:fs";
import  {setTimeout}  from "node:timers";
import { pipeline } from "node:stream";


const slow = new Writable({

    highWaterMark: 64 * 1024,
    write(chunk,enc, cb){
        setTimeout(cb,50);
    }
});

 const rs= fs.createReadStream("big.bin");

rs.on("data",(chunk)=>{

    if(!slow.write(chunk))
    rs.pause();

});

slow.on("drain",()=>rs.resume())
// session 2
// pipeline(rs, slow, (err) => { console.log("done", err); });
// session 3
// rs.pipe(slow);
// slow.on("error", (e) => console.log("slow errored:", e.message));
// rs.on("error",   (e) => console.log("rs errored:", e.message));
// setInterval(() => console.log("rs.destroyed =", rs.destroyed), 1000);


setTimeout(() => { console.log("destroying slow"); slow.destroy(new Error("boom")); }, 3000);

setInterval(()=>console.log((process.memoryUsage().rss/1024/1024).toFixed(0),"MB"),500)