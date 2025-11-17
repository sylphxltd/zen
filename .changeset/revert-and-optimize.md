---
'@sylphx/zen': minor
---

Revert v3.40.0 regression + optimize untracked read path

REVERT v3.40.0 CHANGES:
- Loop unrolling caused 22% regression in Computed Value Access
- Batch threshold lowering (100→10) hurt medium fanouts
- Dual state extraction added overhead to hot path

NEW OPTIMIZATION - Untracked Read Fast Path:
- Avoid tracking logic when currentObserver is null
- Target: Extreme Read benchmark (10000x untracked reads)
- Baseline v3.38.0: 80K ops/sec
- Expected: 150K+ ops/sec (closer to Solid.js 317K)

RESULTS:
- Hybrid Weighted: 50.0/100 → ? (reverting regression to 57.6/100 baseline)
- Extreme Read: 64K → ? (targeting 150K+)
- Single Read: Should recover to 21.5M (from v3.38.0)
- Computed Value Access: Should recover to 17.2M

Strategy: Fix regressions first, then targeted optimizations for specific bottlenecks
