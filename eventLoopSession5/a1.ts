



let sink=0;
for(let i=0;i<5000000;i++){

    const o={x:i,s:"some strig"+i};
    sink+=o.s.length;

}
console.log(sink);




