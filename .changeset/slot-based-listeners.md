---
"@sylphx/zen": minor
"@sylphx/zen-craft": patch
"@sylphx/zen-patterns": patch
"@sylphx/zen-persistent": patch
"@sylphx/zen-preact": patch
"@sylphx/zen-react": patch
"@sylphx/zen-router": patch
"@sylphx/zen-router-preact": patch
"@sylphx/zen-router-react": patch
"@sylphx/zen-solid": patch
"@sylphx/zen-svelte": patch
"@sylphx/zen-vue": patch
---

perf(zen): slot-based O(1) listener management and optimized notifications

Performance improvements to zen core reactivity system:

- **O(1) unsubscribe**: Slot-based index tracking replaces linear array search
- **O(1) batch deduplication**: FLAG_PENDING_NOTIFY prevents duplicate notifications
- **Optimized hot paths**: Removed optional chaining from notification loops
- **Cleaner internals**: Extracted addEffectListener() and addComputedListener()

No breaking changes - pure internal optimization. All existing code continues to work unchanged.
