---
'@sylphx/zen': minor
---

v3.42.0: Chunked batching for massive fanouts (500+ observers)

OPTIMIZATION - Massive Fanout Performance:
- Implemented chunked processing for 500+ observer scenarios
- Process observers in 100-observer chunks to improve cache locality
- Reduces overhead for massive fanout patterns (1→1000 observer scenarios)

PERFORMANCE TARGETS:
- Massive Fanout (1→1000): 36K→200K+ ops/sec (5.5x improvement target)
- Wide Fanout (1→100): Maintain 356K ops/sec (no regression)
- All other benchmarks: Maintain v3.41.1 baseline performance

CONTEXT:
- v3.41.1: Recovered from v3.40.0 regression (63.1/100 variance-based)
- Massive fanout is the biggest performance gap vs competitors (Zustand: 977K ops/sec)
- Chunked processing avoids stack pressure and improves CPU cache utilization
