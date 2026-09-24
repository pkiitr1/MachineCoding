
// import fs from "node:fs"

setTimeout(()=>{

    setTimeout(()=>console.log("A"),0);
    setImmediate(()=>console.log("B"));
},0);