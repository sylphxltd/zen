---
'@sylphx/zen': minor
---

Deep chain and fanout optimizations targeting 70/100

OPTIMIZATIONS:
- Unroll _updateIfNecessary loop for 1-2 sources (common case)
- Lower batch threshold from 100 to 10 (better massive fanout)
- Restructure Computation.read() - delay state check until needed
- Inline update() call in _updateIfNecessary (avoid extra state check)

BENCHMARK TARGETS (Hybrid Weighted - targeting 70/100):
- Very Deep Chain: 244K → 400K+ ops/sec (unrolled loops help deep chains)
- Massive Fanout: 35K → 80K+ ops/sec (lower batch threshold)
- Deep Chain: 2.1M → maintain or improve
- Moderate Read: 8.6M → maintain

Current: 57.6/100, Target: 70/100 (+12.4 points needed)
