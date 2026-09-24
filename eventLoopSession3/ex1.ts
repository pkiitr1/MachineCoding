

import http from "node:http";
import crypto from "node:crypto";



const server = http.createServer((req,res)=>{

   const {url,method}=req;

   if(url=="/fast"){
    res.end("fast")
   }

   else if(url=="/slow"){
      
    const t=Date.now();
    // while(Date.now()-t <500){}
    console.log("before: ",Date.now()-t);
     crypto.pbkdf2Sync("pass","salt",1_000_000,64,"sha512")
     console.log("after: ",Date.now()-t);

      res.end("slow")
   }

})

server.listen(4000,()=>console.log("here wo go 3k"))


//  only libuv's internal C code submits work to the pool (via uv_queue_work). There is no JS API that says "run this function on a pool thread." pbkdf2Sync isn't a submission at all — it's just a C function executing inline on the JS thread, like any other synchronous call. So the pool has four idle threads and no way to be handed your work. That's exactly the gap worker_threads exists to fill — and that's the bridge into the next exercise.