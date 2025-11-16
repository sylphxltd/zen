# 003. Keep Auto-Batching

**Status:** ✅ Accepted
**Date:** 2025-01-20
**Version:** v3.25.0

## Context

V3 experiment removed auto-batching in `Signal.set`, requiring manual `batch()` calls.

## Decision

Keep auto-batching (increment `batchDepth` in `Signal.set`).

## Rationale

- V3 performed **worst** across all benchmarks
- Auto-batching reduces scheduler overhead
- Manual batching is error-prone for users

## Consequences

**Positive:**
- Better performance (+21.7% diamond vs V3)
- Better DX (automatic optimization)

**Negative:**
- Slightly more complex `Signal.set` logic (acceptable)

## References

<!-- VERIFY: packages/zen/src/zen.ts -->
- Implementation: `Signal.set` in `packages/zen/src/zen.ts` lines 440-450
- Benchmark comparison: `/tmp/zen-final-comprehensive-report.md` Phase 5-8
