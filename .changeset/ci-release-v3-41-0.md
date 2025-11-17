---
'@sylphx/zen': patch
---

v3.41.0: Revert v3.40.0 regression + optimize untracked read path

REVERTED v3.40.0 CHANGES (caused regressions):
- Loop unrolling in _updateIfNecessary() (22% regression in Computed Value Access)
- Batch threshold lowering 100→10 (hurt medium fanouts 11-100 observers)
- Dual state extraction (added overhead to hot path)

NEW OPTIMIZATION - Untracked Read Fast Path:
- Optimized Computation.read() for reads outside reactive context (no currentObserver)
- Move state check before tracking logic in untracked path
- Avoid tracking overhead when currentObserver is null

PERFORMANCE TARGETS:
- Hybrid Weighted: 50.0→57.6/100 (recover from v3.40.0 regression)
- Single Read: Recover to 21.5M ops/sec (from v3.38.0)
- Computed Value Access: Recover to 17.2M ops/sec (from v3.38.0)
- Extreme Read: 64K→150K+ ops/sec (new optimization target)
