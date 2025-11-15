# Zen Optimization Progress Log

## Session: 2024-11-15

### Baseline (Before Optimization)
- Diamond: 119,151 ops/sec (15.15x slower than SolidJS)
- Triangle: 122,325 ops/sec (14.75x slower)
- Fanout: 11,605 ops/sec (25.3x slower) ⚠️
- Deep chain: 123,903 ops/sec (12.2x slower)
- Broad: 105,944 ops/sec (5.7x slower)
- Create signals: 29,628 ops/sec (1.25x slower)
- Bundle: 3.75 KB

### Pass 1: Strong Typing + Manual Loop
**Status:** ❌ FAILED - Reverted
**Results:** Manual indexOf replacement caused 77% regression on Broad benchmark
**Lesson:** V8's indexOf is highly optimized. Don't replace it with manual loops.

### Pass 1b: Strong Typing (indexOf restored)
**Status:** ⚠️ Mixed Results
**Changes:**
- Added explicit types (TrackedListener, etc.)
- Replaced `any` with `unknown` or specific types
**Results:**
- Signal creation: +19.7% ✅
- Broad: +4.5% ✅
- Deep chain: -14.2% ❌
- Most others: -1% to -3%
**Lesson:** Strong typing helps object creation but can hurt some hot paths

### Pass 2: Split Listeners (Computed vs Effects) ⭐
**Status:** ✅ MAJOR SUCCESS
**Changes:**
- Split `_listeners` into `_computedListeners` and `_effectListeners`
- Computeds marked STALE directly (no function wrapper)
- Effects called as functions
- Eliminated function call overhead for computed listeners
**Results:**
- Diamond: +40.4% faster (15.15x → 10.94x gap) ✅✅✅
- Triangle: +40.7% faster (14.75x → 10.64x gap) ✅✅✅
- Fanout: +24.5% faster (25.3x → 19.3x gap) ✅
- Create signals: +17.5% faster ✅
- Deep chain: -8.9% (still better than Pass 1b)
- Bundle: 4.06 KB (+0.31 KB)

**Key Insight:** Function calls have stack frame creation, argument passing overhead.
Direct property access (computed._flags |= STALE) is much faster.

## Current Status (After Pass 2)
- Diamond: 167,328 ops/sec (10.94x slower) - 40% improvement from baseline!
- Triangle: 172,055 ops/sec (10.64x slower) - 41% improvement!
- Fanout: 14,452 ops/sec (19.3x slower) - 25% improvement!
- Deep chain: 112,806 ops/sec (13.5x slower)
- Broad: 104,651 ops/sec (5.7x slower)
- Create signals: 34,829 ops/sec (1.06x slower) - Nearly matched SolidJS!
- Bundle: 4.06 KB

## Gap Analysis

**Current Gap:** ~11x slower on Diamond/Triangle
**Realistic Target:** 5-8x slower (without compiler)
**Need:** 30-45% more improvement

**Gap Breakdown:**
1. Compiler inlining (~8-10x): SolidJS compiler advantage - CANNOT close
2. V8 optimization (~2-3x): CAN improve
3. Algorithm (~1.5-2x): CAN improve

## Pass 2: COMMITTED ✅
**Commit:** afac517
**Date:** 2024-11-15
**Status:** Successfully merged to optimization/perfect-zen branch

## Pass 3: Remove Optional Chaining ❌ FAILED
**Status:** Rejected - Caused regression
**Results:**
- Diamond: -5.6% (172,129 → 162,548 ops/sec) ❌
- Triangle: -3.2% ❌
**Lesson:** TypeScript type assertions don't affect runtime. V8 optimizes `?.` well.
**Details:** See pass3-failed.md

## Pass 4: Bidirectional Pointers ⚠️ MIXED - Rejected
**Status:** Implemented O(1) cleanup, but net negative
**Results:**
- Fanout: +6.9% (14,073 → 15,046 ops/sec) ✅
- Triangle: +0.7% ✅
- Diamond: -3.5% (172,129 → 166,127 ops/sec) ❌
- Deep chain: -12.5% (132,797 → 116,110 ops/sec) ❌
**Lesson:** O(n) → O(1) doesn't always win. Small n makes indexOf fast. Slot overhead hurts.
**Details:** See pass4-mixed-results.md

## Next Steps (Pass 5 Options)

### Option A: Inline Hot Paths (Expected: +15-25%)
Inline array access patterns for 1-3 listeners (most common case).
Current code uses generic loop, inlining could eliminate overhead.

### Option B: Research SolidJS Source (Expected: +20-30%)
Read SolidJS reactive core source to understand their exact algorithms.
May reveal techniques we're missing.

### Option C: Convert to Classes (Expected: +10-15%)
Replace Object.create() with class constructors for better V8 optimization.
Better monomorphic shapes.

### Option D: Profile-Guided Optimization (Expected: varies)
Use V8 profiler to identify actual hot paths, optimize those specifically.

## Lessons Learned

1. ✅ Algorithmic changes > micro-optimizations
2. ✅ Eliminating function calls in hot paths is critical
3. ❌ Don't replace V8-optimized builtins
4. ✅ Measure everything - intuition can be wrong
