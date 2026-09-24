
import * as http from "node:http";

const server= http.createServer((req:any,res:any)=>{
    
    const {url,method}= req

    if("/starve"===url && method==='GET'){

        res.end("in the starve get");
        
       const spin=()=>{
           Promise.resolve().then(spin);
        };
        setImmediate(()=>spin());

        return;

    }
        


});

server.listen(3000, ()=>console.log("listening o 3000"));


