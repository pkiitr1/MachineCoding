    let offer=[{}]

    function x(){

       for(let i=0;i<5000000;i++){

            offer.push(  { x: i, s: "some string " + i })
        }

    };


    x()