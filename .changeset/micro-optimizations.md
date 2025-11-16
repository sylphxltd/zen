---
'@sylphx/zen': minor
---

Micro-optimizations for single read and extreme read performance

OPTIMIZATIONS:
- Inline track() in Computation.read() - eliminate function call overhead
- Cache local vars in Signal.get - reduce property access
- Single observer fast path in _notifyObservers - early return for common case
- Optimize _updateIfNecessary - cache myTime, early return for CHECK→CLEAN
- Simplify _notify - streamline state checks with fast paths

BENCHMARK TARGETS (Hybrid Weighted - targeting 70/100):
- Single Read: 17.5M → 22M+ ops/sec (close gap with Solid.js 22.3M)
- Extreme Read: 80K → 160K+ ops/sec (match Zustand/Redux Toolkit)
- Very Deep Chain: 193K → 500K+ ops/sec
- General speedup across all hot paths

These micro-optimizations eliminate overhead in the most frequently executed code paths.
