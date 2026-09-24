// Experiment 1: setTimeout(0) vs setImmediate at TOP LEVEL of the script.
// We run this whole file 20 times (20 fresh processes) and record which fires first.

setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
