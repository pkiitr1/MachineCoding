
//setTimeout(()=>console.log("A"),0);

func()

async function func(){
    
    console.log("X")
    await Promise.resolve().then(()=>console.log("Z"));
    console.log("Y")
    return;

}



// Promise.resolve().then(()=>console.log("B"));

process.nextTick(()=>console.log("C"));

console.log("D")