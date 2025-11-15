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

feat(zen): topological scheduling for glitch-free reactive updates

Major improvement to reactivity guarantees:

**Glitch-Free Guarantees**
- Entire dependency graph stabilizes after each signal write
- Computeds update in topological order (level-based)
- No temporary inconsistent states visible to observers
- All notifications batched and flushed after stabilization

**Before:**
```ts
const a = zen(1);
const b = computed(() => a.value * 2);
a.value = 5;
// b was only marked STALE, not recomputed
```

**After:**
```ts
const a = zen(1);
const b = computed(() => a.value * 2);
a.value = 5;
// b automatically stabilized in topo order
// Guaranteed consistent state
```

**Performance:**
- O(1) per node/edge core operations maintained
- Topological processing only on affected subgraph
- Version-based staleness prevents wasted recomputation

**Compatibility:**
- Breaking semantic change: computeds eagerly stabilize when in active graph
- All existing code continues to work
- Tests updated to reflect new eager stabilization behavior
