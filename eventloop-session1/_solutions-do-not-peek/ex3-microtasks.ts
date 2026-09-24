// Experiment 3: process.nextTick vs Promise.then vs setTimeout vs sync code.
// The macro-task (setTimeout) belongs to a loop phase. The two microtask
// queues (nextTick queue, promise queue) do not belong to any phase.

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
