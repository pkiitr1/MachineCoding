// Experiment 4: recursive process.nextTick vs a live HTTP server.
//
// GET /        -> responds with how many spin iterations have run
// GET /starve  -> responds, then 100ms later starts a recursive nextTick loop
//
// Set SPIN=immediate to use recursive setImmediate instead of nextTick.

import http from "node:http";

const mode = process.env.SPIN === "immediate" ? "setImmediate" : "nextTick";
let ticks = 0;

const server = http.createServer((req, res) => {
  if (req.url === "/starve") {
    res.end(`ok, starting recursive ${mode} in 100ms\n`);
    setTimeout(() => {
      console.log(`spinning with recursive ${mode}...`);
      const spin = () => {
        ticks++;
        if (mode === "nextTick") process.nextTick(spin);
        else setImmediate(spin);
      };
      spin();
    }, 100);
  } else {
    res.end(`alive. spin iterations so far: ${ticks}\n`);
  }
});

server.listen(3005, () => console.log(`listening on 3005 (mode: ${mode})`));
