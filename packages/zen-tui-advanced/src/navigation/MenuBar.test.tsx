/** @jsxImportSource @zen/tui */
/**
 * MenuBar Component Tests
 *
 * Tests for keyboard navigation, shortcuts, callbacks, and reactivity.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createRoot, signal } from '@zen/runtime';
import { clearInputHandlers, dispatchInput, setPlatformOps, tuiPlatformOps } from '@zen/tui';
import { MenuBar, type MenuItemConfig } from './MenuBar.js';

setPlatformOps(tuiPlatformOps);

describe('MenuBar', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render menu bar', () => {
      const items = [
        { label: 'File', key: 'F1' },
        { label: 'Edit', key: 'F2' },
        { label: 'View', key: 'F3' },
      ];

      const result = MenuBar({ items });

      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should render empty menu bar', () => {
      const result = MenuBar({ items: [] });
      expect(result).toBeDefined();
    });

    it('should render with custom colors', () => {
      const items = [{ label: 'File', key: 'F1' }];

      const result = MenuBar({
        items,
        bgColor: 'green',
        textColor: 'yellow',
      });

      expect(result).toBeDefined();
    });

    it('should render with separators', () => {
      const items = [
        { label: 'File', key: 'F1', separator: true },
        { label: 'Edit', key: 'F2' },
      ];

      const result = MenuBar({ items });
      expect(result).toBeDefined();
    });

    it('should render disabled items', () => {
      const items = [
        { label: 'File', key: 'F1', disabled: false },
        { label: 'Edit', key: 'F2', disabled: true },
      ];

      const result = MenuBar({ items });
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Keyboard Navigation
  // ==========================================================================

  describe('Keyboard Navigation', () => {
    it('should navigate right with → arrow', async () => {
      const changes: number[] = [];

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1' },
            { label: 'Edit', key: 'F2' },
            { label: 'View', key: 'F3' },
          ],
          activeIndex: 0,
          onActiveChange: (idx) => changes.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right arrow
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain(1);
    });

    it('should navigate left with ← arrow', async () => {
      const changes: number[] = [];

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1' },
            { label: 'Edit', key: 'F2' },
            { label: 'View', key: 'F3' },
          ],
          activeIndex: 2,
          onActiveChange: (idx) => changes.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[D'); // Left arrow
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain(1);
    });

    it('should not navigate past first item', async () => {
      const changes: number[] = [];

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1' },
            { label: 'Edit', key: 'F2' },
          ],
          activeIndex: 0,
          onActiveChange: (idx) => changes.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[D'); // Left at start
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain(0); // Should stay at 0
    });

    it('should not navigate past last item', async () => {
      const changes: number[] = [];

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1' },
            { label: 'Edit', key: 'F2' },
          ],
          activeIndex: 1,
          onActiveChange: (idx) => changes.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right at end
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toContain(1); // Should stay at 1
    });

    it('should select item with Enter', async () => {
      let selected: string | null = null;

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1', onSelect: () => { selected = 'File'; } },
            { label: 'Edit', key: 'F2', onSelect: () => { selected = 'Edit'; } },
          ],
          activeIndex: 1,
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\r'); // Enter
      await new Promise((r) => setTimeout(r, 10));

      expect(selected).toBe('Edit');
    });

    it('should select item with number key', async () => {
      let selected: string | null = null;

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1', onSelect: () => { selected = 'File'; } },
            { label: 'Edit', key: 'F2', onSelect: () => { selected = 'Edit'; } },
            { label: 'View', key: 'F3', onSelect: () => { selected = 'View'; } },
          ],
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('2'); // Press 2 for Edit
      await new Promise((r) => setTimeout(r, 10));

      expect(selected).toBe('Edit');
    });
  });

  // ==========================================================================
  // Disabled Items
  // ==========================================================================

  describe('Disabled Items', () => {
    it('should not trigger onSelect for disabled items via Enter', async () => {
      let selected: string | null = null;

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1', onSelect: () => { selected = 'File'; } },
            { label: 'Edit', key: 'F2', disabled: true, onSelect: () => { selected = 'Edit'; } },
          ],
          activeIndex: 1, // Disabled item selected
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\r'); // Enter on disabled
      await new Promise((r) => setTimeout(r, 10));

      expect(selected).toBeNull();
    });

    it('should not trigger onSelect for disabled items via number key', async () => {
      let selected: string | null = null;

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1', onSelect: () => { selected = 'File'; } },
            { label: 'Edit', key: 'F2', disabled: true, onSelect: () => { selected = 'Edit'; } },
          ],
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('2'); // Try to select disabled item
      await new Promise((r) => setTimeout(r, 10));

      expect(selected).toBeNull();
    });
  });

  // ==========================================================================
  // Focus Handling
  // ==========================================================================

  describe('Focus Handling', () => {
    it('should not respond to input when not focused', async () => {
      const changes: number[] = [];

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1' },
            { label: 'Edit', key: 'F2' },
          ],
          activeIndex: 0,
          onActiveChange: (idx) => changes.push(idx),
          isFocused: false,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right arrow
      await new Promise((r) => setTimeout(r, 10));

      expect(changes).toEqual([]);
    });

    it('should respond to reactive focus changes', async () => {
      const changes: number[] = [];
      const isFocused = signal(false);

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1' },
            { label: 'Edit', key: 'F2' },
          ],
          activeIndex: 0,
          onActiveChange: (idx) => changes.push(idx),
          isFocused: () => isFocused.value,
        });
      });

      await new Promise((r) => setTimeout(r, 50));

      // Not focused - no response
      dispatchInput('\x1B[C');
      await new Promise((r) => setTimeout(r, 10));
      expect(changes).toEqual([]);

      // Enable focus
      isFocused.value = true;
      await new Promise((r) => setTimeout(r, 10));

      // Now should respond
      dispatchInput('\x1B[C');
      await new Promise((r) => setTimeout(r, 10));
      expect(changes).toContain(1);
    });
  });

  // ==========================================================================
  // Reactive Props
  // ==========================================================================

  describe('Reactive Props', () => {
    it('should support reactive items', () => {
      const items = signal<MenuItemConfig[]>([{ label: 'File', key: 'F1' }]);

      const result = MenuBar({
        items: () => items.value,
      });

      expect(result).toBeDefined();

      // Add item
      items.value = [...items.value, { label: 'Edit', key: 'F2' }];
    });

    it('should support reactive activeIndex', () => {
      const activeIndex = signal(0);

      const result = MenuBar({
        items: [
          { label: 'File', key: 'F1' },
          { label: 'Edit', key: 'F2' },
        ],
        activeIndex: () => activeIndex.value,
      });

      expect(result).toBeDefined();

      // Change index
      activeIndex.value = 1;
    });

    it('should support reactive colors', () => {
      const bgColor = signal('blue');
      const textColor = signal('white');

      const result = MenuBar({
        items: [{ label: 'File', key: 'F1' }],
        bgColor: () => bgColor.value,
        textColor: () => textColor.value,
      });

      expect(result).toBeDefined();

      // Change colors
      bgColor.value = 'green';
      textColor.value = 'yellow';
    });
  });

  // ==========================================================================
  // Controlled Mode
  // ==========================================================================

  describe('Controlled Mode', () => {
    it('should work in controlled mode', async () => {
      const activeIndex = signal(0);
      const changes: number[] = [];

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1' },
            { label: 'Edit', key: 'F2' },
            { label: 'View', key: 'F3' },
          ],
          activeIndex: () => activeIndex.value,
          onActiveChange: (newIndex) => {
            activeIndex.value = newIndex;
            changes.push(newIndex);
          },
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right
      await new Promise((r) => setTimeout(r, 10));

      expect(activeIndex.value).toBe(1);
      expect(changes).toContain(1);
    });

    it('should work in uncontrolled mode', async () => {
      const changes: number[] = [];

      createRoot(() => {
        return MenuBar({
          items: [
            { label: 'File', key: 'F1' },
            { label: 'Edit', key: 'F2' },
          ],
          onActiveChange: (idx) => changes.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right
      await new Promise((r) => setTimeout(r, 10));

      expect(changes.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle single item', async () => {
      const changes: number[] = [];

      createRoot(() => {
        return MenuBar({
          items: [{ label: 'Only', key: 'F1' }],
          activeIndex: 0,
          onActiveChange: (idx) => changes.push(idx),
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\x1B[C'); // Right - should stay at 0
      dispatchInput('\x1B[D'); // Left - should stay at 0
      await new Promise((r) => setTimeout(r, 10));

      // All changes should be 0
      for (const c of changes) {
        expect(c).toBe(0);
      }
    });

    it('should handle items without keys', () => {
      const result = MenuBar({
        items: [{ label: 'NoKey1' }, { label: 'NoKey2' }],
      });

      expect(result).toBeDefined();
    });

    it('should handle items without onSelect', async () => {
      createRoot(() => {
        return MenuBar({
          items: [{ label: 'NoCallback', key: 'F1' }],
          activeIndex: 0,
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('\r'); // Enter - should not crash
      await new Promise((r) => setTimeout(r, 10));
    });

    it('should handle invalid number key', async () => {
      let selected = false;

      createRoot(() => {
        return MenuBar({
          items: [{ label: 'File', key: 'F1', onSelect: () => { selected = true; } }],
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('5'); // No item at index 4
      await new Promise((r) => setTimeout(r, 10));

      expect(selected).toBe(false);
    });

    it('should handle 0 key (no item at index -1)', async () => {
      let selected = false;

      createRoot(() => {
        return MenuBar({
          items: [{ label: 'File', key: 'F1', onSelect: () => { selected = true; } }],
          isFocused: true,
        });
      });

      await new Promise((r) => setTimeout(r, 50));
      dispatchInput('0'); // Index would be -1
      await new Promise((r) => setTimeout(r, 10));

      expect(selected).toBe(false);
    });
  });
});
