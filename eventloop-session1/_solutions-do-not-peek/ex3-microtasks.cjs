// Identical code to ex3-microtasks.ts, but forced to run as CommonJS (.cjs).

setTimeout(() => console.log("A: timeout"), 0);

Promise.resolve().then(() => {
  console.log("B: promise");
  process.nextTick(() => console.log("C: nextTick scheduled inside promise"));
});

process.nextTick(() => {
  console.log("D: nextTick");
  Promise.resolve().then(() => console.log("E: promise scheduled inside nextTick"));
});

console.log("F: sync");
