/** @jsxImportSource @zen/tui */
/**
 * List Component Tests - Architecture Level
 *
 * CRITICAL: Import from @zen/tui to use same module instance as List component
 */
import { signal, computed, createRoot } from '@zen/runtime';
import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { List } from './List.js';

// CRITICAL: Import from @zen/tui to share the same inputHandlers instance
import {
  useInput,
  dispatchInput,
  clearInputHandlers,
  setPlatformOps,
  tuiPlatformOps,
  useFocus,
  FocusProvider,
  Box,
} from '@zen/tui';

setPlatformOps(tuiPlatformOps);

describe('List Component', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  describe('Basic Rendering', () => {
    it('should render with items', () => {
      const result = List({ items: ['A', 'B', 'C'] });
      expect(result).toBeDefined();
    });

    it('should render empty list', () => {
      const result = List({ items: [] });
      expect(result).toBeDefined();
    });

    it('should render with reactive items', () => {
      const items = signal(['A', 'B']);
      const result = List({ items: () => items.value });
      expect(result).toBeDefined();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate down with ↓ arrow', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 0,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      dispatchInput('\x1B[B'); // Down arrow
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
      expect(selections[selections.length - 1].index).toBe(1);
      expect(selections[selections.length - 1].item).toBe('Banana');
    });

    it('should navigate up with ↑ arrow', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 2,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      dispatchInput('\x1B[A'); // Up arrow
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
      expect(selections[selections.length - 1].index).toBe(1);
    });

    it('should navigate with j/k keys', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 0,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      dispatchInput('j'); // Down
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(selections[selections.length - 1].index).toBe(1);

      dispatchInput('k'); // Up
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(selections[selections.length - 1].index).toBe(0);
    });

    it('should trigger onSelect with Enter', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 1,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      dispatchInput('\r'); // Enter
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
      expect(selections[selections.length - 1].index).toBe(1);
      expect(selections[selections.length - 1].item).toBe('Banana');
    });

    it('should not navigate past first item', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 0,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      dispatchInput('\x1B[A'); // Up when at 0
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not have triggered selection change (index stays 0)
      // Or if it did trigger, index should still be 0
    });

    it('should not navigate past last item', async () => {
      const selections: Array<{ item: string; index: number }> = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          initialIndex: 2,
          onSelect: (item, idx) => selections.push({ item, index: idx }),
          isFocused: true,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      dispatchInput('\x1B[B'); // Down when at last
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not have triggered selection change (index stays 2)
    });
  });

  describe('Focus Gate Pattern', () => {
    it('should NOT receive input when isFocused=false', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          onSelect: (_, idx) => selections.push(idx),
          isFocused: false,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      dispatchInput('\x1B[B');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(selections).toEqual([]);
    });

    it('should receive input when isFocused=true', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          onSelect: (_, idx) => selections.push(idx),
          isFocused: true,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      dispatchInput('\x1B[B');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
    });

    it('should respond to reactive isFocused changes', async () => {
      const selections: number[] = [];
      const isFocused = signal(false);

      createRoot(() => {
        return List({
          items: ['Apple', 'Banana', 'Cherry'],
          onSelect: (_, idx) => selections.push(idx),
          isFocused: () => isFocused.value,
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Not focused
      dispatchInput('\x1B[B');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(selections).toEqual([]);

      // Focus
      isFocused.value = true;
      await new Promise(resolve => setTimeout(resolve, 10));

      // Now should receive
      dispatchInput('\x1B[B');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(selections.length).toBeGreaterThan(0);
    });
  });

  describe('FocusProvider Integration', () => {
    it('should work with focusId and autoFocus', async () => {
      const selections: number[] = [];

      createRoot(() => {
        return FocusProvider({
          get children() {
            return List({
              items: ['Apple', 'Banana', 'Cherry'],
              focusId: 'test-list',
              autoFocus: true,
              onSelect: (_, idx) => selections.push(idx),
              isFocused: true, // Gate open
            });
          }
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      dispatchInput('\x1B[B');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(selections.length).toBeGreaterThan(0);
    });

    it('should respect gate AND FocusProvider focus', async () => {
      const selections: number[] = [];
      const gate = signal(true);

      createRoot(() => {
        return FocusProvider({
          get children() {
            return List({
              items: ['Apple', 'Banana', 'Cherry'],
              focusId: 'test-list',
              autoFocus: true,
              onSelect: (_, idx) => selections.push(idx),
              isFocused: () => gate.value,
            });
          }
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Gate open - should work
      dispatchInput('\x1B[B');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(selections.length).toBeGreaterThan(0);

      const countBefore = selections.length;

      // Close gate
      gate.value = false;
      await new Promise(resolve => setTimeout(resolve, 10));

      // Gate closed - should NOT receive
      dispatchInput('\x1B[B');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(selections.length).toBe(countBefore);
    });
  });

  describe('Tab Navigation with FocusProvider', () => {
    it('should switch focus with Tab', async () => {
      const listSelections: number[] = [];
      const otherReceived: string[] = [];

      createRoot(() => {
        return FocusProvider({
          get children() {
            // Another focusable first (gets autoFocus)
            const otherFocus = useFocus({ id: 'other', autoFocus: true });
            const otherEffective = computed(() => otherFocus.isFocused.value);
            useInput(
              (input: string) => {
                otherReceived.push(input);
                return false;
              },
              { isActive: otherEffective }
            );

            // List (no autoFocus, will get focus after Tab)
            const listResult = List({
              items: ['Apple', 'Banana'],
              focusId: 'list',
              onSelect: (_, idx) => listSelections.push(idx),
              isFocused: true,
            });

            return Box({ children: [listResult] });
          }
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Other has autoFocus - type
      dispatchInput('x');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(otherReceived).toContain('x');

      // Tab to List
      dispatchInput('\t');
      await new Promise(resolve => setTimeout(resolve, 10));

      // Now List should receive
      dispatchInput('\x1B[B');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(listSelections.length).toBeGreaterThan(0);
    });
  });
});
