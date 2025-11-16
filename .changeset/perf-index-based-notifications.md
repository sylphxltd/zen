---
'@sylphx/zen': patch
---

perf(zen): index-based pendingNotifications processing (no splice)

**Optimization 3.1: Index-based pendingNotifications**

Replaced `splice(0, len)` with head index tracking in `flushPendingNotifications()`.

**Before:**
```typescript
while (pending.length > 0) {
  const len = pending.length;
  for (let i = 0; i < len; i++) { ... }
  pending.splice(0, len); // O(n) array copy
}
```

**After:**
```typescript
while (pendingNotificationsHead < pendingNotifications.length) {
  const startHead = pendingNotificationsHead;
  const endHead = pendingNotifications.length;
  for (let i = startHead; i < endHead; i++) { ... }
  pendingNotificationsHead = endHead; // O(1) index update
}
// Reset after full flush
pendingNotifications.length = 0;
pendingNotificationsHead = 0;
```

**Impact**: Eliminates last remaining `splice()` call in hot path. All queue processing now uses index-based iteration (dirtyNodes, dirtyComputeds, pendingNotifications).

All 46 tests passing.
