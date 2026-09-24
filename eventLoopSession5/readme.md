# Session 5 — GC and memory leaks

## Diagrams

### A1 vs A2 — the same loop, one reference apart

```
A1 — objects die young                    A2 — objects retained
════════════════════════                  ════════════════════════

NEW SPACE (small)                         NEW SPACE
┌─────────────────────┐                   ┌─────────────────────┐
│ ████ all garbage    │                   │ ████ all LIVE       │
└──────────┬──────────┘                   └──────────┬──────────┘
           │ scavenge                                │ scavenge
           │ copies ~nothing                         │ must COPY EVERYTHING
           ▼                                         ▼
      0.6 ms pause                            survives 2x → PROMOTED
      heap: 23 ─▶ 7.5 MB                                │
      (drops every time)                                ▼
                                           OLD SPACE (grows unbounded)
OLD SPACE                                  ┌─────────────────────┐
┌─────────────────────┐                    │ ████████████████████│ 567 MB
│ (stays empty)       │                    │ all reachable from  │ and climbing
└─────────────────────┘                    │ module-level array  │
                                           └──────────┬──────────┘
   Mark-Compact never runs                            │ Mark-Compact
                                                      ▼
                                                 188 ms PAUSE
                                                 frees ~nothing
```

### Pause durations, same scale

```
A1  ▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏   each ▏ = 0.6ms, forever flat

A2  ▏  ▎  ▌  █  ███  ████████████████████████████████
    0.8 3.5 7.4 12   35ms           188ms
    └─ scavenges ─┘  └ interleaved ┘ └ Mark-Compact ┘
```

### The leak signature — heap AFTER collection

```
healthy   7.5 ─ 7.5 ─ 7.5 ─ 7.5 ─ 7.5 ─ 7.5      flat floor
                (GC frees everything)

leak      118 ─ 188 ─ 266 ─ 405 ─ 567 ─ ...      rising floor
                (GC frees nothing)

TRAP: rising RSS alone proves nothing. A rising floor AFTER GC does.
```

### What the event loop feels

```
healthy:  ─JS─▏─JS──▏──JS─▏─JS──▏──JS──      0.6ms gaps, invisible
                                             mu = 1.000

leaking:  ─JS─█████████████████████─JS─      188ms gap
               ↑                             mu = 0.545
               every in-flight request        (half the CPU is GC)
               stalls here
```

### Retainer chain — read bottom-up

```
        {url, data}  @139827          ← the leaked object
             ▲   in (internal array)[]
             │
        table in Map @117237           ← the Map's hash table   (retained 143 MB, 92%)
             ▲
             │
        cache in system / Context      ← the module-level const  ← FIX GOES HERE
             ▲
             │
          GC root

"this object is in a Map's table; that Map is bound to `cache`;
 `cache` lives in module scope, which is a GC root — so it can never be collected."

Fix at the RETAINER, not at the leaked object.
```

### Two leak shapes

```
cache leak                          listener leak
──────────                          ─────────────
grows with KEY CARDINALITY          grows with REQUEST COUNT
same key twice = no growth          every call adds one, forever
can plateau                         straight line, never bends
242k entries → 161 MB heap          242k listeners → ~28 MB heap
10 KB payload each                  ~100 B function each (~6x slower)
```

---

## Notes


* **V8 is generational** — young gen collected often and cheaply (your A1: 0.6ms, flat), old gen rarely and expensively (your A2: 188ms). Most objects die young, which is why the bet pays off.
* **A GC pause blocks the event loop exactly like sync CPU work** — your own evidence: a 4014ms max latency on a handler that does one Map insert.
* **A leak means objects are reachable** — V8 ran a full mark-compact twice and freed nothing, because `cache` is a GC root.
* **Three archetypes** — unbounded caches (161MB), un-removed listeners (28MB, linear in request count), closures capturing too much.
* **The debugging sequence** — ratchet in metrics → snapshot diff → sort by size delta → retainer chain → fix at the retainer.
* **The trap** — rising RSS proves nothing; a rising floor *after* GC does. Your control run (`heapUsed 11` flat at 33k req/sec) versus the leak run is the proof.

<!-- your words below -->
