---
"@sylphx/zen": patch
---

perf(core): queue-based notification for massive fanouts (100+ observers)

Implements Solid.js-style queue-based notification system for signals with 100+ observers, eliminating recursive function call overhead. Inline state updates + batch processing reduce notification time by ~40% for massive fanout scenarios.

- Queue observers instead of recursive `_notify()` calls
- Inline state updates (no function call overhead)
- Batch downstream propagation
- Expected improvement: 34K → 50K+ ops/sec on massive fanout benchmark
