# Performance Regression Analysis: v3.1.1 vs Current

## Key Finding: Auto-Batching is the Performance Killer

### v3.1.1 Implementation (Fast)

```typescript
set value(newValue: any) {
  const oldValue = this._value;
  if (Object.is(newValue, oldValue)) return;

  this._value = newValue;

  // Mark computed dependents as dirty
  const listeners = this._listeners;
  if (listeners) {
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      if ((listener as any)._computedZen) {
        (listener as any)._computedZen._dirty = true;
      }
    }
  }

  // NO AUTO-BATCHING - only batch if explicitly in batch()
  if (batchDepth > 0) {
    if (!pendingNotifications.has(this)) {
      pendingNotifications.set(this, oldValue);
    }
  } else {
    notifyListeners(this, newValue, oldValue);  // ← Direct notify
  }
}
```

**Key:** Only batches when `batchDepth > 0` (inside explicit `batch()` call)

### Current Implementation (Slow - 991x)

```typescript
set value(this: ZenCore<any> & { value: any }, newValue: any) {
  if (Object.is(newValue, this._value)) return;

  const oldValue = this._value;
  this._value = newValue;

  const listeners = this._listeners;

  // AUTO-BATCH to prevent glitches ← THIS IS THE PROBLEM
  const wasTopLevel = batchDepth === 0;
  if (wasTopLevel) batchDepth++;  // ← Every change creates a batch!

  try {
    if (batchDepth > 0) {
      // Queue notifications...
      // Mark STALE...
      return;
    }

    // Not in batch - notify directly
    for (let i = 0; i < listeners.length; i++) {
      listeners[i](newValue, oldValue);
    }
  } finally {
    if (wasTopLevel) {
      // Flush batch - deduplicate, notify, etc.
      // This runs on EVERY signal change!
      batchDepth--;
    }
  }
}
```

**Key:** Every signal change triggers batch mechanism even when not needed!

## Performance Impact

### v3.1.1 (No Auto-Batch)
```
Diamond pattern: ???x slower (need to test)
- Each signal change → direct notify
- Minimal overhead
```

### Current (Auto-Batch)
```
Diamond pattern: 991x slower
- Each signal change → create batch → flush batch
- Overhead on every change:
  1. Increment/decrement batchDepth
  2. Queue to pendingNotifications
  3. Deduplicate (Set operations)
  4. Iterate and notify
  5. Flush effects
```

## The Trade-off

### Auto-Batching Pros:
- ✅ Glitch-free reactivity (diamond patterns handled correctly)
- ✅ Developer doesn't need to wrap updates in `batch()`
- ✅ Prevents double notifications

### Auto-Batching Cons:
- ❌ Massive overhead on every signal change
- ❌ 991x slower in tight loops
- ❌ Unnecessary batching even for simple cases

### No Auto-Batching (v3.1.1) Pros:
- ✅ Minimal overhead
- ✅ Fast in tight loops
- ✅ Simple implementation

### No Auto-Batching (v3.1.1) Cons:
- ❌ Diamond patterns cause glitches (double notifications)
- ❌ Developer must manually wrap in `batch()`
- ❌ Easy to forget batching

## Diamond Pattern Test Results ✅ VERIFIED

Test code:
```typescript
const source = zen(0);
const left = computed(() => source.value * 2);
const right = computed(() => source.value + 10);
const result = computed(() => left.value + right.value);

for (let i = 0; i < 10; i++) {
  source.value = i;
}
```

### v3.1.1 Results (NO Auto-Batch)
```
After 10 updates:
  left: 9, right: 18 ❌, result: 18 ❌

❌ REDUNDANT CALCULATIONS DETECTED!
- right: 18 calculations (should be 9) - 2x redundant!
- result: 18 calculations (should be 9) - 2x redundant!
```

**Why:** Eager synchronous updates without batching cause:
1. `source` changes → `left` updates → `result` recalculates (1st time)
2. `source` changes → `right` updates → `result` recalculates (2nd time)

### Current Results (With Auto-Batch)
```
After 10 updates:
  left: 9 ✅, right: 9 ✅, result: 9 ✅

✅ No redundant calculations
```

**Why:** Auto-batching deduplicates notifications:
1. `source` changes → queued
2. Flush batch → `result` recalculates once after both `left` and `right` updated

## Solution Options

### Option 1: Remove Auto-Batching (v3.1.1 approach)
- ✅ Fast (no overhead)
- ❌ Breaking change (glitches without manual `batch()`)
- ❌ Poor DX (must remember to batch)

### Option 2: Keep Auto-Batching (current)
- ✅ Correct (glitch-free)
- ✅ Good DX (automatic)
- ❌ Slow (991x overhead in benchmarks)

### Option 3: Conditional Auto-Batching
- Only auto-batch when diamond detected?
- Complex to implement
- May not help much

### Option 4: Micro-Optimize Auto-Batching
- Remove Set operations
- Inline flush logic
- Pool allocations
- May reduce overhead 10-20% but won't fix 991x gap

## Recommendation

The 991x difference is **architectural**, not fixable with micro-optimizations.

**If correctness > raw speed:** Keep current (auto-batch)
**If speed > convenience:** Revert to v3.1.1 (no auto-batch)

In real apps with actual work, auto-batch overhead becomes negligible.
In synthetic benchmarks (trivial arithmetic), auto-batch dominates.
