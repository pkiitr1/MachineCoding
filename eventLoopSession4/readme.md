
the whole excerise proved that chunking is incidental but consumer sets the pace, since its speed is lower than the producer which can sends chunks at RAM speed(not all cases depends on the file). Limiting reagent.

without backpressure memory scales with input size(1GB file gave 1100 MB in buffer), with it memory scales with highWaterMark (~71MB,  regardless of the file size)


in ex1

we were reading the chunks at RAM speed but consumer was slow bounded by 64 KB chunks per 50ms, so drain rate is ~1.2MB/sec now the problem was read stream filled the buffer but write was processing the chunks at bounded rate, 

in reality the rate could be much higher since 50ms was deliberate.

a disk at 500MB/s, a socket at 10MB/s, a database insert at whatever it manages. The mechanism is identical regardless; only the number changes.


now when the writable buffer was overgorwing since it wasnt being processed at the same rate of filling it kept returning false but didnt thorws an error since eventually there is a process to consume it, but the false was the signal which nobody listened.

ex2

the fix, we added the rs.pause on "false return" and on drain event resumption of filling,

this was clear cut pause untill it drains successfully

result was process.memory started giving output of 65MB+ 128KB + 13 MB heap buffer (garbage to be collected)

ex3
highMarker actually tells at what stage read/write returns false this is the amount if the buffer size exceeds then return false

pipeline oer pipe cause, pipeline traverses the error in both destination and source end prompting to stop the memory leaks at the source end if consumer errored, and if producer errored consumer shouldnt run anymore, but in case of pipe  rs.destroyed remains false, thus even if consumer has err but producer kept filling the buffer so if node has handled the error buffer will keep increasing.

this can cause the memory leak on prod and server's mem can spike significantly

.pipe()      = backpressure
pipeline()   = backpressure + error propagation + destroy every stream in the chain + one callback


---

## Diagram — where the data piles up

```
LEAKY VERSION (ignoring write()'s return value)

 rs (fast, ~800MB/s)                    slow (~1.2 MB/s)
        │                                     │
        │  chunk ──┐                          │
        │  chunk ──┤                          │
        │  chunk ──┤   ┌──────────────────┐   │
        └─ chunk ──┴──▶│ writable buffer  │──▶│ one 64KB chunk
                       │  (UNBOUNDED)     │   │  per 50ms
                       │  grew to 1100MB  │   │
                       └──────────────────┘   │
                              ▲
                     highWaterMark = 64KB
                     ────────────────────
                     crossed here → write() returns false
                     ...but nobody listened, so it kept filling


FIXED VERSION (pause/resume — and what pipeline does internally)

 rs                                     slow
  │                                      │
  │  chunk ──▶ ┌───────────┐ ──▶ one chunk per 50ms
  │            │  buffer   │
  │            │ ~64KB max │
  │            └───────────┘
  │                  │
  │   write() returns false when buffer > 64KB
  │◀─────────── rs.pause()
  │                  │
  │            buffer drains
  │                  │
  │◀─────────── "drain" event → rs.resume()
  │
  └─ repeat  →  memory stays flat regardless of file size
```

RSS breakdown of the fixed run (~71MB total):

```
 ├── ~65 MB   Node baseline: V8 heap, tsx compiler, loaded modules
 ├── ~128 KB  the actual stream buffers (64KB writable + 64KB readable)
 └── ~ 6 MB   V8 heap garbage from chunk objects, not yet collected
```

The number that matters is the ~128KB of buffer — versus ~1030MB of buffer in the leaky run.
