# Architecture Decision Records

## Index

- [ADR-001: Unified Scheduler (v3.25.0)](#001-unified-scheduler)
- [ADR-002: Reject Duplicate Subscription Checking](#002-reject-duplicate-subscription-checking)
- [ADR-003: Keep Auto-Batching](#003-keep-auto-batching)
- [ADR-004: Bitflag Pending State (v3.26.0)](#004-bitflag-pending-state)
- [ADR-005: Zero-Allocation Flush (v3.26.0)](#005-zero-allocation-flush)
- [ADR-006: Inline Critical Functions (v3.26.0)](#006-inline-critical-functions)

---

## Quick Links

- [001-unified-scheduler.md](001-unified-scheduler.md) - Consolidate 3 queues into 1
- [002-reject-duplicate-checking.md](002-reject-duplicate-checking.md) - Why duplicate check hurts performance
- [003-keep-auto-batching.md](003-keep-auto-batching.md) - Why V3 without batching failed
- [004-bitflag-pending-state.md](004-bitflag-pending-state.md) - O(1) schedule check
- [005-zero-allocation-flush.md](005-zero-allocation-flush.md) - Eliminate slice() in hot path
- [006-inline-critical-functions.md](006-inline-critical-functions.md) - Remove function call overhead
