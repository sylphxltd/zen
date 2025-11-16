---
"@sylphx/zen": minor
---

Unified queue-based scheduler rewrite with subscribe API simplification (Solid.js-style)

**Major Performance Improvements:**
- Eliminated diamond graph duplicate computations (O(n) → O(1))
- Effects run once per flush regardless of source count (O(sources) → O(1))
- Unified queue-based scheduler with 4-phase flush (propagate → recompute → execute → notify)
- Each computation/effect runs at most once per flush via deduplication flags

**Subscribe API Simplification:**
- Removed separate effect listener system (_effectListener1/_effectListener2/_effectListeners)
- subscribe() now uses effect() internally for unified scheduling
- Automatic deduplication through effect scheduler

**BREAKING CHANGES:**
- subscribe() no longer calls listener immediately on subscription
- First listener call happens on first update, not immediately
- This aligns with effect-based reactivity and enables better deduplication

**Implementation Details:**
- EffectNodes now increment GLOBAL_EFFECT_COUNT on subscribe
- FLAG_IN_EFFECT_QUEUE for effect deduplication
- FLAG_IN_COMPUTED_QUEUE for computed deduplication
- Wrapped unsubscribe functions for accurate effect counting
- Queue reset in finally block for error safety

All 47 tests pass. Core performance bottlenecks eliminated.
