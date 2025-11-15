# Zen Performance Optimization Summary

## Investigation Complete ✅

### User Question
"solidjs有沒有autobatching?" (Does SolidJS have auto-batching?)

### Answer
**YES! SolidJS auto-batches every signal change.**

---

## Key Findings

### 1. Performance Baseline (Current Implementation)

```
Diamond pattern: 991x slower than SolidJS
Triangle pattern: 1030x slower
Massive fanout: 851x slower
```

Source: `baseline-results.txt`

### 2. Root Cause Analysis

**Problem:** Auto-batching overhead on every signal change

#### Zen v3.1.1 (Fast but Incorrect)
- ✅ No auto-batching overhead
- ❌ Diamond pattern glitches (2x redundant calculations)
- Performance: Only ~2-3x slower than SolidJS

#### Zen Current (Slow but Correct)
- ✅ Auto-batching prevents glitches
- ✅ Zero redundant calculations
- ❌ 991x slower due to overhead

#### SolidJS (Fast AND Correct)
- ✅ Auto-batching on every signal change
- ✅ Zero redundant calculations
- ✅ Baseline performance

### 3. Why SolidJS is Fast

Every `writeSignal()` automatically batches via `runUpdates()`:

```typescript
// SolidJS implementation
export function writeSignal(node, value) {
  if (node.observers && node.observers.length) {
    runUpdates(() => {  // ← Auto-batch every change!
      for (const o of node.observers) {
        if (o.pure) Updates!.push(o);  // Queue computed
        else Effects!.push(o);         // Queue effect
        o.state = STALE;               // Mark dirty, DON'T recalculate
      }
    }, false);
  }
}

function runUpdates(fn, init) {
  if (Updates) return fn();  // ← Already batching, just run
  // ... create queue, flush after fn() ...
}
```

**Key optimizations:**
1. **Array queue** instead of Map (cheaper operations)
2. **STALE state** prevents eager recalculation
3. **Defer recalculation** until flush
4. **Owner chain traversal** during flush for correct ordering
5. **State checks** (CLEAN/STALE/PENDING) prevent redundant work

### 4. Why Zen Current is Slow

```typescript
// Zen current implementation
set value(this: ZenCore<any> & { value: any }, newValue: any) {
  if (Object.is(newValue, this._value)) return;
  const oldValue = this._value;
  this._value = newValue;

  // AUTO-BATCH - creates overhead on EVERY change
  const wasTopLevel = batchDepth === 0;
  if (wasTopLevel) batchDepth++;  // ← Overhead

  try {
    if (batchDepth > 0) {
      // Queue to Map
      if (!pendingNotifications.has(this)) {
        pendingNotifications.set(this, oldValue);  // ← Map overhead
      }
      // Mark STALE and queue for later...
      return;
    }
    // Direct notify...
  } finally {
    if (wasTopLevel) {
      // Flush batch - iterate, deduplicate, notify
      batchDepth--;  // ← Overhead
    }
  }
}
```

**Problems:**
1. Uses Map with oldValue tracking (more overhead than array)
2. Computed listeners trigger EAGER recalculation
3. No state checks to prevent redundant work
4. Every change increments/decrements batchDepth

### 5. Failed Optimization Attempts

#### Attempt 1: Topological Ordering
- **Goal:** Sort computeds by dependency level
- **Result:** 1538x slower (WORSE than baseline 991x)
- **Why:** Sorting added overhead without fixing fundamental problem
- **Learning:** The issue isn't ordering, it's eager recalculation

Source: `topological-results.txt`

#### Attempt 2: Lazy Pull
- **Goal:** Defer recalculation until value accessed
- **Result:** 1058x slower (slight improvement) but broke 9 tests
- **Why:** Listeners expected immediate fresh values, got stale values
- **Learning:** Can't just mark STALE, need to update values during flush

---

## The Solution

### Keep auto-batching, defer recalculation (like SolidJS)

**Current flow:**
```
signal.value = x
  → auto-batch starts
  → mark computed dirty
  → listener fires
  → computed.updateComputed() ← EAGER RECALCULATION
  → auto-batch ends
```

**Proposed flow (like SolidJS):**
```
signal.value = x
  → auto-batch starts
  → mark computed STALE
  → queue computed (don't recalculate yet)
  → auto-batch ends
  → flush queue
    → recalculate STALE computeds ONCE
    → notify listeners with fresh values
```

### Implementation Changes Needed

1. **Replace Map with Array** for pending queue
   - `pendingNotifications Map → pendingComputeds Array`
   - Cheaper push operations

2. **Don't eagerly recalculate in listeners**
   - Current: `listener → updateComputed()`
   - New: `listener → markStale(), queue computed`

3. **Add state checks**
   - Track CLEAN (0), STALE (1), PENDING (2) states
   - Skip already-processed computeds

4. **Flush queue with smart ordering**
   - Option A: Owner chain traversal (like SolidJS runTop)
   - Option B: Simple queue processing with state checks

5. **Recalculate during flush, not during listener**
   - Ensures each computed runs ONCE
   - Listeners receive fresh values

### Expected Result

- ✅ Correctness maintained (no diamond glitches)
- ✅ Performance improved (minimal overhead per change)
- ✅ Auto-batching kept (good DX)

---

## Documents Created

1. **PERF_REGRESSION_ANALYSIS.md** - v3.1.1 vs current comparison
2. **OPTIMIZATION_FINDINGS.md** - Failed optimization attempts
3. **SOLIDJS_BATCHING_ANALYSIS.md** - How SolidJS achieves fast + correct
4. **ANSWER.md** - Concise answer in Chinese
5. **test-v3.1.1-diamond.js** - Proves v3.1.1 has redundant calculations
6. **test-diamond.js** - Proves current has zero redundant calculations

---

## Next Steps

Implement SolidJS-inspired batching:
- Keep auto-batching ✅
- Replace Map with Array ✅
- Defer recalculation ✅
- Smart flush ordering ✅

This should close the 991x performance gap while maintaining correctness.
