---
"@sylphx/zen": patch
---

perf: unified Computation class for better V8 optimization

**Optimization 3.3**: Unified Computed and Effect into a single `Computation` base class to improve V8 hidden class optimization and reduce shape polymorphism.

**Changes:**
- Created abstract `Computation<T>` base class extending `BaseNode`
- Both `ComputedNode` and `EffectNode` now extend `Computation`
- Shared structure: `_fn`, `_sources`, `_sourceSlots`, `_cleanup`
- Separate execution logic: `ComputedNode` (lazy pull), `EffectNode` (eager push)
- Backward compatibility via getter properties

**Before (separate shapes):**
```typescript
class ComputedNode<T> extends BaseNode<T | null> {
  _calc: () => T;
  _sources: AnyNode[];
  _sourceSlots: number[];
  _unsubs?: Unsubscribe[];
  // ...
}

interface EffectCore {
  _callback: () => undefined | (() => void);
  _sources: AnyNode[];
  _sourceSlots: number[];
  _sourceUnsubs?: Unsubscribe[];
  // ...
}
```

**After (unified shape):**
```typescript
abstract class Computation<T> extends BaseNode<T | null> implements DependencyCollector {
  _fn: () => T;
  _sources: AnyNode[];
  _sourceSlots: number[];
  _sourceUnsubs?: Unsubscribe[];
  _cleanup?: () => void;
}

class ComputedNode<T> extends Computation<T> { /* ... */ }
class EffectNode extends Computation<void | (() => void)> { /* ... */ }
```

**Impact:**
- V8 can better optimize with stable object shapes
- Reduced inline cache misses for dependency tracking operations
- No performance regression in benchmarks
- Foundation for future optimizations

**Trade-offs:**
- Slightly more complex inheritance hierarchy
- Effect nodes carry `_cleanup` field (negligible memory overhead)
