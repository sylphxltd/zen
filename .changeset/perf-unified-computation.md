---
"@sylphx/zen": patch
---

perf: unified Computation class for better V8 optimization (Solid-style)

**Optimization 3.3**: Unified Computed and Effect into a single `Computation` base class with shared execution pattern (Solid.js-inspired).

**Architecture (Solid-style):**
```
BaseNode (shared reactive graph infrastructure)
  ├─ ZenNode (Signal)
  └─ Computation (unified computed + effect)
      ├─ ComputedNode (cached, lazy pull)
      └─ EffectNode (no cache, eager push)
```

**Changes:**
- Created abstract `Computation<T>` base class with unified `_execute()` method
- Both `ComputedNode` and `EffectNode` extend `Computation` with identical data layout
- Shared fields: `_fn`, `_sources`, `_sourceSlots`, `_sourceUnsubs`, `_cleanup`, `_cancelled`, `_epoch`
- Separate execution: `ComputedNode._execute()` = lazy, `EffectNode._execute()` = eager
- Reduced code duplication via unified execution pattern

**Before (separate shapes):**
```typescript
class ComputedNode<T> extends BaseNode<T | null> {
  _calc: () => T;
  _sources: AnyNode[];
  _sourceSlots: number[];
  _unsubs?: Unsubscribe[];
  // No _cleanup, _cancelled
}

interface EffectCore {
  _callback: () => undefined | (() => void);
  _sources: AnyNode[];
  _sourceSlots: number[];
  _sourceUnsubs?: Unsubscribe[];
  _cleanup?: () => void;
  _cancelled: boolean;
  // Separate plain object, not a class
}
```

**After (unified Computation):**
```typescript
abstract class Computation<T> extends BaseNode<T | null> implements DependencyCollector {
  _fn: () => T;
  _sources: AnyNode[];
  _sourceSlots: number[];
  _sourceUnsubs?: Unsubscribe[];
  _cleanup?: () => void;
  _cancelled = false;
  _epoch = 0;

  abstract _execute(): void; // Unified execution pattern
}

class ComputedNode<T> extends Computation<T> {
  _execute() { this._recomputeIfNeeded(); } // Lazy pull
}

class EffectNode extends Computation<void | (() => void)> {
  _execute() { /* eager push logic */ }
}
```

**Benefits:**
- **Stable object shapes**: V8 can optimize both Computed and Effect with same hidden class
- **Reduced polymorphism**: Less inline cache misses in dependency tracking
- **Unified code paths**: Shared logic for setup, cleanup, source tracking
- **Less `if (FLAG_IS_COMPUTED)` checks**: More logic can be shared between Computed/Effect

**Trade-offs:**
- ComputedNode carries `_cleanup` and `_cancelled` fields (~8 bytes overhead)
- Slightly deeper inheritance hierarchy

All 46 tests pass. No performance regression.
