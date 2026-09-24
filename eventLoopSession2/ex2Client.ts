
import http from "node:http";

const start=Date.now();



for(let i=0;i<100;i++){

http.get("http://127.0.0.1:4000/test", (res) => {
  res.resume();                                  // drain the body
  res.on("end", () => console.log(i+1, Date.now() - start));
});

}