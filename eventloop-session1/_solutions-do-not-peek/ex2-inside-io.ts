// Experiment 2: the SAME two calls, but scheduled from inside an I/O callback.
// Also run 20 times in fresh processes.

import fs from "node:fs";

fs.readFile(process.argv[1], () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
