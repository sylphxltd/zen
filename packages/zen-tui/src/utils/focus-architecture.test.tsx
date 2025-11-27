/** @jsxImportSource @zen/tui */
/**
 * Focus Architecture Tests
 */
import { describe, expect, test } from 'bun:test';
import { computed, createRoot, setPlatformOps, signal } from '@zen/runtime';
import { Show } from '@zen/runtime';
import { tuiPlatformOps } from '../core/platform-ops.js';
import { clearInputHandlers, dispatchInput, useInput } from '../hooks/useInput.js';
import { Box } from '../primitives/Box.js';
import { FocusProvider, useFocus } from './focus.js';

setPlatformOps(tuiPlatformOps);

describe('Focus Architecture', () => {
  test('Tab switches focus between two items', async () => {
    clearInputHandlers();

    const log: string[] = [];
    let focusAResult: any;
    let focusBResult: any;

    createRoot(() => {
      return FocusProvider({
        get children() {
          focusAResult = useFocus({ id: 'item-a', autoFocus: true });
          useInput(
            (input) => {
              log.push(`A: "${input}"`);
              return false;
            },
            { isActive: focusAResult.isFocused },
          );

          focusBResult = useFocus({ id: 'item-b' });
          useInput(
            (input) => {
              log.push(`B: "${input}"`);
              return false;
            },
            { isActive: focusBResult.isFocused },
          );

          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(focusAResult?.isFocused?.value).toBe(true);
    expect(focusBResult?.isFocused?.value).toBe(false);

    log.length = 0;
    dispatchInput('x');
    expect(log).toEqual(['A: "x"']);

    dispatchInput('\t');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(focusAResult?.isFocused?.value).toBe(false);
    expect(focusBResult?.isFocused?.value).toBe(true);

    log.length = 0;
    dispatchInput('y');
    expect(log).toEqual(['B: "y"']);

    clearInputHandlers();
  });

  test('isFocused gate + FocusProvider combo', async () => {
    clearInputHandlers();

    const log: string[] = [];
    const scopeActive = signal(true);
    let focusAResult: any;
    let focusBResult: any;

    createRoot(() => {
      return FocusProvider({
        get children() {
          // Item A
          focusAResult = useFocus({ id: 'item-a', autoFocus: true });
          const effectiveA = computed(() => {
            if (!scopeActive.value) return false;
            return focusAResult.isFocused.value;
          });
          useInput(
            (input) => {
              log.push(`A: "${input}"`);
              return false;
            },
            { isActive: effectiveA },
          );

          // Item B
          focusBResult = useFocus({ id: 'item-b' });
          const effectiveB = computed(() => {
            if (!scopeActive.value) return false;
            return focusBResult.isFocused.value;
          });
          useInput(
            (input) => {
              log.push(`B: "${input}"`);
              return false;
            },
            { isActive: effectiveB },
          );

          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Initially A is focused, scope is active
    log.length = 0;
    dispatchInput('1');
    expect(log).toEqual(['A: "1"']);

    // Tab to B
    dispatchInput('\t');
    await new Promise((resolve) => setTimeout(resolve, 10));

    log.length = 0;
    dispatchInput('2');
    expect(log).toEqual(['B: "2"']);

    // Close gate - neither should receive
    scopeActive.value = false;
    await new Promise((resolve) => setTimeout(resolve, 10));

    log.length = 0;
    dispatchInput('3');
    expect(log).toEqual([]);

    // Open gate - B should receive (it was last focused)
    scopeActive.value = true;
    await new Promise((resolve) => setTimeout(resolve, 10));

    log.length = 0;
    dispatchInput('4');
    expect(log).toEqual(['B: "4"']);

    clearInputHandlers();
  });
});

describe('AllTest-like structure (manual simulation)', () => {
  test('List (autoFocus) + TextArea with gate', async () => {
    clearInputHandlers();

    const log: string[] = [];
    const scopeActive = signal(true);
    let listFocusResult: any;
    let textareaFocusResult: any;

    createRoot(() => {
      return FocusProvider({
        get children() {
          // Simulate List with autoFocus
          listFocusResult = useFocus({ id: 'all-file-list', autoFocus: true });
          const listEffective = computed(() => {
            if (!scopeActive.value) return false;
            return listFocusResult.isFocused.value;
          });
          useInput(
            (input, key) => {
              if (key.downArrow || key.upArrow) {
                log.push('List: arrow');
                return true;
              }
              log.push(`List: "${input}"`);
              return false;
            },
            { isActive: listEffective },
          );

          // Simulate TextArea
          textareaFocusResult = useFocus({ id: 'all-editor' });
          const textareaEffective = computed(() => {
            if (!scopeActive.value) return false;
            return textareaFocusResult.isFocused.value;
          });
          useInput(
            (input, key) => {
              // TextArea accepts most input
              if (input && !key.tab) {
                log.push(`TextArea: "${input}"`);
                return true;
              }
              return false;
            },
            { isActive: textareaEffective },
          );

          return Box({ children: 'AllTest simulation' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // List should have autoFocus
    expect(listFocusResult?.isFocused?.value).toBe(true);
    expect(textareaFocusResult?.isFocused?.value).toBe(false);

    // Type 'a' - List should receive (not TextArea!)
    log.length = 0;
    dispatchInput('a');
    expect(log).toContain('List: "a"');
    expect(log.filter((l) => l.startsWith('TextArea'))).toEqual([]);

    // Tab to TextArea
    dispatchInput('\t');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listFocusResult?.isFocused?.value).toBe(false);
    expect(textareaFocusResult?.isFocused?.value).toBe(true);

    // Type 'b' - TextArea should receive
    log.length = 0;
    dispatchInput('b');
    expect(log).toContain('TextArea: "b"');
    expect(log.filter((l) => l.startsWith('List'))).toEqual([]);

    clearInputHandlers();
  });
});

describe('AllTest with gate starting closed', () => {
  test('Gate closed -> open -> Tab navigation', async () => {
    clearInputHandlers();

    const log: string[] = [];
    const scopeActive = signal(false); // Start with gate closed (header mode)
    let listFocusResult: any;
    let textareaFocusResult: any;

    // Simulate the AllTest pattern where both components have focusId AND isFocused prop
    createRoot(() => {
      return FocusProvider({
        get children() {
          // Simulate List: focusId + autoFocus + isFocused gate
          listFocusResult = useFocus({ id: 'all-file-list', autoFocus: true });
          const listEffective = computed(() => {
            // Gate pattern: external gate AND FocusProvider focus
            if (!scopeActive.value) return false; // Gate closed
            return listFocusResult.isFocused.value;
          });
          useInput(
            (input, key) => {
              // Match real List behavior: only handle navigation keys
              if (key.downArrow || key.upArrow || input === 'j' || input === 'k') {
                log.push('List: navigation');
                return true;
              }
              if (key.return) {
                log.push('List: select');
                return true;
              }
              // List does NOT consume regular character input!
              log.push(`List: passthrough "${input}"`);
              return false;
            },
            { isActive: listEffective },
          );

          // Simulate TextArea: focusId (no autoFocus) + isFocused gate
          textareaFocusResult = useFocus({ id: 'all-editor' });
          const textareaEffective = computed(() => {
            if (!scopeActive.value) return false; // Gate closed
            return textareaFocusResult.isFocused.value;
          });
          useInput(
            (input, key) => {
              if (input && !key.tab) {
                log.push(`TextArea: "${input}"`);
                return true;
              }
              return false;
            },
            { isActive: textareaEffective },
          );

          return Box({ children: 'AllTest with focusId' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // With gate closed, no component should receive input
    log.length = 0;
    dispatchInput('x');
    expect(log).toEqual([]); // No handlers active

    // Open gate (enter content mode)
    scopeActive.value = true;
    await new Promise((resolve) => setTimeout(resolve, 50));

    // List should have autoFocus, so it should receive input
    // List passes through character input (doesn't consume), but TextArea should NOT receive
    // because TextArea's handler should not be active (wrong focus)
    log.length = 0;
    dispatchInput('a');
    expect(log).toContain('List: passthrough "a"');
    // CRITICAL: TextArea should NOT receive input when List is focused
    expect(log.filter((l) => l.startsWith('TextArea'))).toEqual([]);

    // Tab to TextArea
    dispatchInput('\t');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listFocusResult?.isFocused?.value).toBe(false);
    expect(textareaFocusResult?.isFocused?.value).toBe(true);

    // TextArea should receive input
    log.length = 0;
    dispatchInput('b');
    expect(log).toContain('TextArea: "b"');
    expect(log.filter((l) => l.startsWith('List'))).toEqual([]);

    // Tab back to List
    dispatchInput('\t');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(listFocusResult?.isFocused?.value).toBe(true);
    expect(textareaFocusResult?.isFocused?.value).toBe(false);

    // List should receive input again (passthrough, but TextArea should NOT)
    log.length = 0;
    dispatchInput('c');
    expect(log).toContain('List: passthrough "c"');
    expect(log.filter((l) => l.startsWith('TextArea'))).toEqual([]);

    clearInputHandlers();
  });
});
