# 006. Inline Critical Functions

**Status:** ✅ Accepted
**Date:** 2025-01-21
**Version:** v3.26.0

## Context

`addObserver()` called on every signal read and computation read. Function call overhead in hot paths.

## Decision

Inline `addObserver()` logic directly in `Signal.get` and `Computation.read`.

## Rationale

- Eliminate function call overhead
- +3% performance in many-updates scenario
- Hot path optimization: read/write most frequent operations

## Consequences

**Positive:**
- Measurable performance improvement
- JIT-friendly (easier to optimize inline code)

**Negative:**
- Code duplication (~10 lines duplicated)
- Harder to maintain (changes need updates in 2 places)
- Larger minified bundle (+~50 bytes, still under limit)

## References

<!-- VERIFY: packages/zen/src/zen.ts -->
- Signal: `Signal.get` in `packages/zen/src/zen.ts` lines 412-426
- Computation: `Computation.read` in `packages/zen/src/zen.ts` lines 237-249
- Original: `addObserver()` still exists at line 148 for non-hot paths
