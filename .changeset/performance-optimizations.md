---
'@sylphx/zen': minor
---

Performance optimizations for massive fanout and deep chains

OPTIMIZATIONS:
- Fast path for single observer (skip batching overhead)
- Batch processing in _notifyObservers for >100 observers
- Optimized removeSourceObservers with linear search for small arrays
- Guard track() calls with currentObserver check
- Improved cache locality in flushEffects
- Indexed assignment instead of array push in scheduler

BENCHMARK TARGETS:
- Massive Fanout (1→1000): Improve from 33K ops/sec
- Very Deep Chain (100 layers): Improve from 212K ops/sec
- Wide Fanout (1→100): Improve from 326K ops/sec
- Memory Management: Improve subscriber creation/cleanup performance

These micro-optimizations reduce overhead in hot paths and improve performance for large dependency graphs while maintaining correctness.
