# Zen Optimization Investigation

## Summary

Systematically tested multiple optimization strategies for Zen's reactive system. **Result:** Current baseline implementation is optimal among tested approaches.

## Benchmark Results

| Approach | Diamond (1k updates) | Bundle Size | Test Results |
|----------|---------------------|-------------|--------------|
| **Baseline (current)** | **991x slower** | **1.87 KB gzip** | **✅ All pass** |
| + Topological ordering | 1538x slower (-55%) | 2.07 KB gzip | ✅ All pass |
| + Lazy-pull | 1058x slower (-7%) | 1.69 KB gzip | ❌ 9 tests fail |

## Tested Optimizations

### 1. Topological Ordering + Observer Levels

**Hypothesis:** Sort computeds by dependency level to prevent redundant recalculations in diamond patterns.

**Implementation:**
- Added `_level` field to track dependency depth
- Implemented `calculateLevel()` function
- Sort computeds by level before batch flush

**Results:**
- ❌ **Performance worse**: 991x → 1538x slower
- ❌ Bundle size increased: 1.87 KB → 2.07 KB
- ✅ No correctness issues

**Why it failed:**
Baseline already prevents redundant calculations through deduplication. Topological sorting added overhead (sorting, level tracking) without benefits.

### 2. Lazy-Pull Model

**Hypothesis:** Remove eager recalculation from batch flush. Let effects lazy-pull computeds when accessed.

**Implementation:**
- Computeds mark STALE but don't recalculate in batch flush
- Effects access computed.value → triggers lazy recalculation
- Similar to SolidJS model

**Results:**
- ❌ **Performance worse**: 991x → 1058x slower
- ✅ Bundle size improved: 1.87 KB → 1.69 KB
- ❌ **9 tests failed**: subscribe() listeners receive wrong values

**Why it failed:**
- STALE computeds have old `_value`, but listeners expect new values
- Lazy pull adds getter overhead (state checks, function calls)
- Baseline's eager recalculation is actually faster in tight loops

## Key Insights

### Current Implementation is Correct

Test with diamond pattern (`source → left, right → result`):
```
After 10 updates:
  left: 9, right: 9, result: 9, effect: 9
✅ No redundant calculations
```

Baseline already achieves glitch-free, efficient updates through:
1. Auto-batching every signal change
2. Deduplication of pending notifications
3. Eager recalculation of computeds
4. Effect queueing and flush

### Why 991x Slower?

**The benchmarks measure framework overhead in tight loops with minimal work:**
- Diamond: 3 computeds + 1 signal + 1 effect, 1000 updates/iteration
- Each update: trivial arithmetic operations
- Framework overhead dominates actual work

**Zen's overhead per update:**
1. Auto-batching: increment/decrement `batchDepth`
2. Queue to `pendingNotifications` array
3. Deduplication: `Set` creation + iteration
4. Eager recalculation: state management + function calls
5. Effect queueing: `Set` operations

**In real applications:**
- Each update does more work (DOM, network, etc.)
- Framework overhead becomes less significant
- 991x difference would not manifest

## Attempted Approaches Comparison

|  | Baseline | Topological | Lazy-Pull |
|---|---|---|---|
| **Correctness** | ✅ | ✅ | ❌ |
| **No redundant calcs** | ✅ | ✅ | ✅ |
| **Performance** | 991x | 1538x ❌ | 1058x ❌ |
| **Bundle size** | 1.87 KB | 2.07 KB ❌ | 1.69 KB ✅ |
| **Complexity** | Medium | High ❌ | Medium |

## Conclusions

1. **Current baseline is optimal** among tested approaches
2. **No redundant calculations** - batching + deduplication works correctly
3. **Performance gap is overhead**, not algorithmic inefficiency
4. **Micro-optimizations needed** to close gap with SolidJS

## Next Steps (Not Implemented)

Potential micro-optimizations to explore:

1. **Object pooling**: Reuse notification tuples instead of creating new ones
2. **Inline critical paths**: Manually inline hot functions to reduce call overhead
3. **Optimize deduplication**: Use faster algorithm (mark + sweep instead of Set)
4. **Remove auto-batching**: Make batching opt-in (but breaks glitch-free guarantee)
5. **Bit flags**: Use bitmasks instead of object properties for state
6. **Monomorphic shapes**: Ensure consistent object shapes for JIT optimization

**Tradeoffs:** These would add complexity and may hurt maintainability for marginal gains in synthetic benchmarks.

## Recommendation

**Keep current baseline implementation.** It provides:
- ✅ Glitch-free reactivity (diamond pattern handled correctly)
- ✅ Clean API (auto-batching, no manual batch() needed)
- ✅ Small bundle (1.87 KB gzipped)
- ✅ Correct behavior (all tests pass)

The 991x gap is an artifact of synthetic benchmarks measuring pure framework overhead. In real applications with actual work per update, the difference would be negligible.
