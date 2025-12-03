/**
 * Fine-Grained Reactivity Tests
 *
 * These tests lock down the core characteristics of Rapid's fine-grained reactivity:
 * 1. Components render only once
 * 2. Effects execute immediately (synchronous)
 * 3. Computeds are lazy with equality checking
 * 4. Minimal re-execution (only when values actually change)
 */

import { describe, expect, it, vi } from 'vitest';
import { signal, computed, effect } from './signal';

describe('Fine-Grained Reactivity Guarantees', () => {
  describe('Immediate Synchronous Execution', () => {
    it('should execute effects immediately when signal changes', () => {
      const count = signal(0);
      const log: number[] = [];

      effect(() => {
        log.push(count.value);
      });

      expect(log).toEqual([0]); // Initial run

      count.value = 1;
      expect(log).toEqual([0, 1]); // Immediate, synchronous

      count.value = 2;
      expect(log).toEqual([0, 1, 2]); // No delay
    });

    it('should execute nested effects in subscription order', () => {
      const trigger = signal(0);
      const log: string[] = [];

      effect(() => {
        trigger.value; // Subscribe
        log.push('effect-1');
      });

      effect(() => {
        trigger.value; // Subscribe
        log.push('effect-2');
      });

      log.length = 0; // Clear initial runs
      trigger.value = 1;

      // Effects execute in subscription order, immediately
      expect(log).toEqual(['effect-1', 'effect-2']);
    });
  });

  describe('Component Render Once', () => {
    it('should not re-run component function when dependencies change', () => {
      const count = signal(0);
      let componentRuns = 0;
      let effectRuns = 0;

      // Simulate a component
      function Component() {
        componentRuns++;

        effect(() => {
          effectRuns++;
          console.log(count.value);
        });

        return 'rendered';
      }

      Component(); // Initial render
      expect(componentRuns).toBe(1);
      expect(effectRuns).toBe(1);

      // Change signal - only effect re-runs, NOT component
      count.value = 1;
      expect(componentRuns).toBe(1); // ✅ Component still ran only once
      expect(effectRuns).toBe(2); // ✅ Effect re-ran

      count.value = 2;
      expect(componentRuns).toBe(1); // ✅ Still only once
      expect(effectRuns).toBe(3);
    });

    it('should setup reactive graph once during component render', () => {
      const data = signal({ name: 'Alice' });
      let componentRuns = 0;
      let computedCreations = 0;
      let effectCreations = 0;

      function Component() {
        componentRuns++;

        // Create computed
        computedCreations++;
        const displayName = computed(() => {
          return data.value.name.toUpperCase();
        });

        // Create effect
        effectCreations++;
        effect(() => {
          console.log(displayName.value);
        });

        return 'rendered';
      }

      Component();
      expect(componentRuns).toBe(1);
      expect(computedCreations).toBe(1);
      expect(effectCreations).toBe(1);

      // Change data - component doesn't re-run, graph already set up
      data.value = { name: 'Bob' };
      expect(componentRuns).toBe(1); // ✅ No re-render
      expect(computedCreations).toBe(1); // ✅ Computed not recreated
      expect(effectCreations).toBe(1); // ✅ Effect not recreated
    });
  });

  describe('Lazy Computed with Equality Checking', () => {
    it('should only recompute when accessed and dirty', () => {
      const count = signal(0);
      let computations = 0;

      const doubled = computed(() => {
        computations++;
        return count.value * 2;
      });

      expect(computations).toBe(0); // ✅ Lazy - not computed yet

      doubled.value; // Access
      expect(computations).toBe(1); // ✅ Computed on access

      doubled.value; // Access again
      expect(computations).toBe(1); // ✅ Cached, no recomputation

      count.value = 1; // Change source
      expect(computations).toBe(1); // ✅ Not recomputed yet (lazy)

      doubled.value; // Access
      expect(computations).toBe(2); // ✅ Recomputed on access
    });

    it('should not notify if computed value unchanged (equality check)', () => {
      const items = signal([1, 2, 3]);
      let computations = 0;
      let effectRuns = 0;

      const count = computed(() => {
        computations++;
        return items.value.length;
      });

      effect(() => {
        effectRuns++;
        count.value;
      });

      expect(computations).toBe(1);
      expect(effectRuns).toBe(1);

      // Change array reference but same length
      items.value = [4, 5, 6]; // Different reference, same length
      expect(computations).toBe(2); // ✅ Recomputed (source changed)
      expect(effectRuns).toBe(1); // ✅ NOT notified (value unchanged: 3 === 3)
    });

    it('should handle array reference changes correctly', () => {
      const items = signal([1, 2, 3]);
      let effectRuns = 0;

      effect(() => {
        effectRuns++;
        items.value; // Access array
      });

      expect(effectRuns).toBe(1);

      // New array reference
      items.value = [1, 2, 3]; // Different reference, same content
      expect(effectRuns).toBe(2); // ✅ Notified (different reference)

      // Same reference
      items.value = items.value;
      expect(effectRuns).toBe(2); // ✅ NOT notified (same reference)
    });
  });

  describe('Minimal Re-execution', () => {
    it('should only execute effects that depend on changed signals', () => {
      const a = signal(1);
      const b = signal(2);
      let effectARuns = 0;
      let effectBRuns = 0;

      effect(() => {
        effectARuns++;
        a.value;
      });

      effect(() => {
        effectBRuns++;
        b.value;
      });

      effectARuns = 0;
      effectBRuns = 0;

      a.value = 10;
      expect(effectARuns).toBe(1); // ✅ Only effect A ran
      expect(effectBRuns).toBe(0); // ✅ Effect B didn't run

      b.value = 20;
      expect(effectARuns).toBe(1); // ✅ Effect A still only ran once
      expect(effectBRuns).toBe(1); // ✅ Only effect B ran
    });

    it('should not re-execute effect if signal value unchanged (Object.is)', () => {
      const count = signal(5);
      let runs = 0;

      effect(() => {
        runs++;
        count.value;
      });

      expect(runs).toBe(1);

      count.value = 5; // Same value
      expect(runs).toBe(1); // ✅ NOT re-executed

      count.value = 6; // Different value
      expect(runs).toBe(2); // ✅ Re-executed
    });
  });

  describe('Conditional Rendering Patterns', () => {
    it('should handle Show-like conditional rendering correctly', () => {
      const show = signal(true);
      const data = signal('Hello');
      let childCreations = 0;
      let childEffectRuns = 0;
      let currentChild: any = null;
      let previousCondition = false;

      // Simulate Show component pattern
      effect(() => {
        const condition = show.value;

        // Only dispose if condition changed
        if (currentChild && previousCondition !== condition) {
          currentChild.dispose();
          currentChild = null;
        }

        previousCondition = condition;

        // Only create if condition true and no current child
        if (condition && !currentChild) {
          childCreations++;

          // Child's effect
          const disposeEffect = effect(() => {
            childEffectRuns++;
            data.value; // Subscribe to data
          });

          currentChild = {
            dispose: vi.fn(() => {
              disposeEffect();
            }),
          };
        }
      });

      expect(childCreations).toBe(1);
      expect(childEffectRuns).toBe(1);

      // Change data - child not recreated, only effect re-runs
      data.value = 'World';
      expect(childCreations).toBe(1); // ✅ NOT recreated
      expect(childEffectRuns).toBe(2); // ✅ Effect re-ran

      // Change condition to false - child disposed
      const childToDispose = currentChild;
      show.value = false;
      expect(childToDispose.dispose).toHaveBeenCalled();
      expect(childCreations).toBe(1);

      // Change data while hidden - no effect runs
      const prevRuns = childEffectRuns;
      data.value = 'Hidden';
      expect(childEffectRuns).toBe(prevRuns); // ✅ Disposed effect doesn't run

      // Show again - child recreated
      show.value = true;
      expect(childCreations).toBe(2); // ✅ Recreated because condition changed
    });
  });

  describe('Context Ordering (Descriptor Pattern)', () => {
    it('should ensure parent context is set before children access it', () => {
      const log: string[] = [];
      let parentContext: any = null;

      // Simulate lazy children via descriptor pattern
      function Parent(props: { children: () => any }) {
        log.push('parent-start');

        // Parent sets up context
        parentContext = { value: 'parent-context' };
        log.push('parent-context-set');

        // Access children (lazy evaluation)
        const child = props.children();
        log.push('parent-end');

        return child;
      }

      function Child() {
        log.push('child-start');

        // Child accesses parent context
        expect(parentContext).not.toBeNull();
        expect(parentContext.value).toBe('parent-context');
        log.push('child-accessed-context');

        return 'child-rendered';
      }

      // Descriptor pattern - children as lazy getter
      Parent({
        children: () => Child(),
      });

      // Verify order
      expect(log).toEqual([
        'parent-start',
        'parent-context-set',
        'child-start',
        'child-accessed-context',
        'parent-end',
      ]);
    });
  });

  describe('Performance Characteristics', () => {
    it('should not create unnecessary computations', () => {
      const a = signal(1);
      const b = signal(2);
      let computations = 0;

      const sum = computed(() => {
        computations++;
        return a.value + b.value;
      });

      // Not accessed yet
      expect(computations).toBe(0);

      // First access
      expect(sum.value).toBe(3);
      expect(computations).toBe(1);

      // Cached
      expect(sum.value).toBe(3);
      expect(computations).toBe(1);

      // Change a
      a.value = 10;
      expect(computations).toBe(1); // ✅ Not recomputed yet (lazy)

      // Access
      expect(sum.value).toBe(12);
      expect(computations).toBe(2); // ✅ Recomputed once
    });

    it('should handle deeply nested reactive graph efficiently', () => {
      const source = signal(1);
      let level1Computations = 0;
      let level2Computations = 0;
      let level3Computations = 0;

      const level1 = computed(() => {
        level1Computations++;
        return source.value * 2;
      });

      const level2 = computed(() => {
        level2Computations++;
        return level1.value * 2;
      });

      const level3 = computed(() => {
        level3Computations++;
        return level2.value * 2;
      });

      // Access deepest
      expect(level3.value).toBe(8); // 1 * 2 * 2 * 2
      expect(level1Computations).toBe(1);
      expect(level2Computations).toBe(1);
      expect(level3Computations).toBe(1);

      // Change source
      source.value = 2;

      // Access deepest again
      expect(level3.value).toBe(16); // 2 * 2 * 2 * 2

      // Each level computed exactly once more
      expect(level1Computations).toBe(2);
      expect(level2Computations).toBe(2);
      expect(level3Computations).toBe(2);
    });
  });
});
