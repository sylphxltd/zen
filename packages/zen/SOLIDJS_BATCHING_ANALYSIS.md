# SolidJS Batching Analysis

## Key Finding: SolidJS DOES Auto-Batch Every Signal Change! ✅

### How writeSignal Works

```typescript
export function writeSignal(node: SignalState<any> | Memo<any>, value: any, isComp?: boolean) {
  // ... value comparison ...

  if (node.observers && node.observers.length) {
    runUpdates(() => {  // ← EVERY signal write calls runUpdates!
      for (let i = 0; i < node.observers!.length; i += 1) {
        const o = node.observers![i];
        if (!o.state) {
          if (o.pure) Updates!.push(o);  // ← Queue computeds
          else Effects!.push(o);         // ← Queue effects
          if (o.observers) markDownstream(o);
        }
        o.state = STALE;  // ← Mark STALE, don't recalculate yet!
      }
    }, false);  // ← false = create Updates queue
  }
}
```

### How runUpdates Works

```typescript
function runUpdates<T>(fn: () => T, init: boolean) {
  if (Updates) return fn();  // ← Already in batch, just run
  let wait = false;
  if (!init) Updates = [];   // ← Create queue (init=false from writeSignal)
  if (Effects) wait = true;
  else Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);   // ← Flush queue when done
    return res;
  } catch (err) {
    if (!wait) Effects = null;
    Updates = null;
    handleError(err);
  }
}
```

**Key insight:** `runUpdates()` checks `if (Updates)` at the top. If already in a batch, it just runs the function without creating a new queue. Otherwise, it creates a queue and flushes it.

## Critical Difference vs Zen

### SolidJS Strategy: Mark STALE, Queue, Flush Once

1. Signal changes → marks observers STALE
2. Queues computeds to `Updates` array
3. Calls `completeUpdates()` which processes queue
4. Computeds recalculate ONCE during flush

**Result:** No redundant calculations in diamond pattern!

### Zen Current Strategy: Mark STALE, Auto-Batch with Set Deduplication

1. Signal changes → auto-creates batch
2. Queues to `pendingNotifications` Map
3. Flushes batch → notifies listeners
4. Listeners trigger eager recalculation

**Problem:** Map overhead + every change creates batch overhead

### Zen v3.1.1 Strategy: Mark Dirty, Eager Update

1. Signal changes → marks computed dirty
2. Immediately calls listener (eager update)
3. Listener triggers `updateComputed()` immediately

**Problem:** Diamond pattern causes 2x redundant calculations!

## Why SolidJS is Fast

1. **STALE state prevents eager recalculation**
   - Zen v3.1.1: `_dirty` flag + eager listener callback → immediate recalc
   - SolidJS: `STALE` state + queued in Updates array → deferred recalc

2. **Queue-based deduplication is cheaper than Map**
   - Zen: `pendingNotifications.set(zen, oldValue)` on every change
   - SolidJS: `Updates.push(o)` - just push to array, dedupe during flush

3. **Topological sorting during flush**
   - SolidJS processes Updates queue in dependency order
   - Ensures each computed runs exactly once

4. **No auto-batch overhead when already in batch**
   - `if (Updates) return fn()` - fast path when nested
   - Zen: Always increments `batchDepth`, always checks, always flushes

## Key Architectural Insight

**SolidJS combines the best of both worlds:**
- ✅ Fast (minimal overhead per signal change)
- ✅ Correct (no diamond pattern glitches)

**How?**
- Every signal write IS batched (like Zen current)
- But uses efficient queue + STALE state (not Map + flush overhead)
- Computeds don't recalculate until flush (lazy pull)
- During flush, `runTop()` walks up owner chain to ensure correct ordering

### How runTop() Prevents Redundant Calculations

```typescript
function runTop(node: Computation<any>) {
  if (node.state === 0) return;  // Already clean
  if (node.state === PENDING) return lookUpstream(node);

  const ancestors = [node];
  // Walk up owner chain, collect ancestors with pending updates
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (node.state) ancestors.push(node);
  }

  // Execute from root to leaf (reverse order)
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    // ... update node ...
  }
}
```

**Key insight:** Instead of topological sorting, SolidJS uses **owner chain traversal**:
1. When processing a computed in the queue, walk UP to find all dirty ancestors
2. Execute from root → leaf (reverse order)
3. This ensures parents update before children
4. Each computed only processes once due to state checks (CLEAN/STALE/PENDING)

## The Missing Piece in Zen

Zen's lazy-pull attempt failed because:
1. We marked STALE but didn't queue the computeds
2. Listeners expected immediate notifications with new values
3. STALE computeds have old `_value`

**SolidJS solution:**
- Don't notify listeners during signal write
- Queue computeds to Updates array
- Flush Updates → recalculate computeds → THEN notify listeners
- Listeners receive fresh values

## Recommendation

To match SolidJS performance while maintaining correctness:

1. **Keep auto-batching** (every signal change creates/uses batch)
2. **Replace Map with Array** for pending queue (cheaper than Map operations)
3. **Add PENDING state** (in addition to dirty) to track "in progress"
4. **Mark STALE without eager recalculation** in computed listeners
5. **During flush, use lookUpstream pattern** to check if sources are dirty
6. **Only recalculate if sources changed** (not just because listener fired)

**Alternative simpler approach:**
- Keep current Map-based batching
- But DON'T eagerly recalculate in computed listener
- Just mark dirty, queue the computed
- During flush, recalculate queued computeds ONCE
- This gives correctness without full SolidJS complexity

## Summary: Answer to "Does SolidJS have auto-batching?"

**YES! SolidJS auto-batches every signal change.**

Every `writeSignal()` call wraps its observer notifications in `runUpdates()`:
```typescript
if (node.observers && node.observers.length) {
  runUpdates(() => {  // ← Auto-batch!
    for (const o of node.observers) {
      if (o.pure) Updates!.push(o);  // Queue computed
      else Effects!.push(o);         // Queue effect
      o.state = STALE;               // Mark dirty
    }
  }, false);
}
```

**But SolidJS is fast because:**
1. Uses array queue, not Map (cheaper)
2. Marks STALE without recalculating
3. Flushes queue with smart ordering (owner chain traversal)
4. State checks prevent redundant work (CLEAN=0, STALE=1, PENDING=2)

**Zen current is slow because:**
1. Auto-batching ✅ (same as SolidJS)
2. Uses Map with oldValue tracking (more overhead)
3. Marks dirty + EAGER recalculation in listener
4. No state checks to prevent redundant work

**The fix:** Keep auto-batching, but defer recalculation until flush (like SolidJS)

---

## Q: Can we remove manual batch()?

**NO - Keep manual batch() for nested batching optimization.**

### Why keep batch()?

Even with auto-batching, manual `batch()` is still valuable:

```typescript
// Without manual batch():
// Each update creates its own micro-batch
store.users.value = newUsers;      // ← Batch 1: flush
store.filter.value = newFilter;    // ← Batch 2: flush
store.sortBy.value = newSort;      // ← Batch 3: flush
// Result: 3 flushes, computeds may recalculate 3 times

// With manual batch():
batch(() => {
  store.users.value = newUsers;    // ← Queued
  store.filter.value = newFilter;  // ← Queued
  store.sortBy.value = newSort;    // ← Queued
});  // ← Single flush here
// Result: 1 flush, computeds recalculate once
```

### SolidJS keeps batch() too

SolidJS has both:
- Auto-batching via `runUpdates()` wrapper in `writeSignal()`
- Manual `batch()` function exported for user control

```typescript
export function batch<T>(fn: Accessor<T>): T {
  return runUpdates(fn, false);
}
```

The auto-batching prevents glitches, manual batching optimizes multi-update scenarios.

### How runUpdates handles nested batching

```typescript
function runUpdates<T>(fn: () => T, init: boolean) {
  if (Updates) return fn();  // ← Already batching, just run fn
  // ... create queue, run fn, flush ...
}
```

When nested:
1. Outer `runUpdates` creates Updates queue
2. Inner `runUpdates` sees queue exists → just runs fn, no flush
3. Only outer flush happens

**Zen should work the same way:**
- Auto-batching: Every signal change wraps in batch
- Manual batch: User wraps multiple changes
- Nested batching: Inner batches skip flush, only outer flushes
