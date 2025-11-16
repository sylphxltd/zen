# 002. Reject Duplicate Subscription Checking

**Status:** ✅ Accepted
**Date:** 2025-01-20
**Version:** v3.25.0

## Context

Considered adding `includes()` check in `addObserver()` to prevent duplicate subscriptions.

## Decision

Reject duplicate checking. Allow duplicates if they occur.

## Rationale

- Loop cost > problem cost: O(n) check every subscription
- Duplicates rare in practice: Proper cleanup prevents them
- Performance regression: Testing showed slowdown, not speedup

## Consequences

**Positive:**
- Better performance in hot read/write paths
- Simpler code

**Negative:**
- Theoretical duplicate subscriptions possible (but rare/prevented by cleanup)

## References

<!-- VERIFY: packages/zen/src/zen.ts -->
- Implementation: `addObserver()` in `packages/zen/src/zen.ts` - no duplicate check
- Analysis: `/tmp/zen-final-comprehensive-report.md` Phase 1-8
