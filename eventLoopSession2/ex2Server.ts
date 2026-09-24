
import http from "node:http";



const server= http.createServer((req,res)=>{

    const {url,method}= req;

    if(url==='/test' && method==="GET"){

        setTimeout(()=>res.end("hi"),200);
        return;
    }

    res.end("server works");
    return;

});

server.listen(4000,()=>console.log("listening on 4k"));

// a socket waiting for its response is just an entry in a kernel table + a buffer.
// network I/O consumes zero pool threads
// Put your two experiments side by side, because together they're the whole session:

// 8 pbkdf2, pool=4	100 sockets, pool=1
// shape	hard waves of exactly 4	one smear, no waves
// governed by	UV_THREADPOOL_SIZE	kernel notifier (IOCP on your Windows)
// 