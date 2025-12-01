import { describe, expect, it } from 'bun:test';
import { createRoot, setPlatformOps } from '@zen/runtime';
import { tuiPlatformOps } from '../core/platform-ops.js';
import { clearInputHandlers, dispatchInput } from '../hooks/useInput.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';
import { FocusProvider, useFocus, useFocusManager } from './focus.js';

// Type alias for test results (avoids noExplicitAny in tests)
type FocusResult = ReturnType<typeof useFocus>;

// Initialize platform operations before tests
setPlatformOps(tuiPlatformOps);

describe('FocusProvider', () => {
  it('should create a focus provider', () => {
    let providerCreated = false;

    createRoot(() => {
      const provider = FocusProvider({ children: 'test' });
      providerCreated = provider !== undefined;
    });

    expect(providerCreated).toBe(true);
  });

  it('should provide focus context to children', () => {
    let testComplete = false;

    createRoot(() => {
      FocusProvider({
        get children() {
          // This getter executes within the Provider context
          const manager = useFocusManager();
          testComplete =
            manager !== null &&
            typeof manager.focus === 'function' &&
            typeof manager.focusNext === 'function' &&
            typeof manager.focusPrevious === 'function';
          return Text({ children: 'test' });
        },
      });
    });

    expect(testComplete).toBe(true);
  });
});

describe('Focus Management', () => {
  it('should provide all focus manager methods', () => {
    let testComplete = false;

    createRoot(() => {
      FocusProvider({
        get children() {
          const manager = useFocusManager();
          testComplete =
            typeof manager.focus === 'function' &&
            typeof manager.focusNext === 'function' &&
            typeof manager.focusPrevious === 'function' &&
            typeof manager.enableFocus === 'function' &&
            typeof manager.disableFocus === 'function';
          return Text({ children: 'test' });
        },
      });
    });

    expect(testComplete).toBe(true);
  });
});

describe('Lazy Children Pattern', () => {
  it('should support function children: {() => <Component />}', () => {
    let childrenExecuted = false;
    let contextAvailable = false;

    createRoot(() => {
      // This tests the lazy children pattern: <FocusProvider>{() => <Child />}</FocusProvider>
      // The function should be executed and the component should be rendered
      FocusProvider({
        children: () => {
          childrenExecuted = true;
          // Try to access the context - should work because we're inside the Provider
          try {
            const manager = useFocusManager();
            contextAvailable = typeof manager.focus === 'function';
          } catch {
            contextAvailable = false;
          }
          return Text({ children: 'lazy child' });
        },
      });
    });

    expect(childrenExecuted).toBe(true);
    expect(contextAvailable).toBe(true);
  });

  it('should execute descriptor returned from function children', () => {
    let componentCreated = false;

    // Custom component that sets a flag when created
    function ChildComponent() {
      componentCreated = true;
      return Text({ children: 'child' });
    }

    createRoot(() => {
      // The function returns a descriptor { _jsx: true, type: ChildComponent, props: {} }
      // This descriptor should be executed by Context.Provider
      FocusProvider({
        children: () => {
          // Simulating what JSX does: jsx(ChildComponent, {})
          // returns { _jsx: true, type: ChildComponent, props: {} }
          return {
            _jsx: true,
            type: ChildComponent,
            props: {},
          };
        },
      });
    });

    expect(componentCreated).toBe(true);
  });
});

describe('autoFocus', () => {
  it('should auto-focus first item with autoFocus: true', async () => {
    clearInputHandlers();

    let focusResult: FocusResult;

    createRoot(() => {
      return FocusProvider({
        get children() {
          focusResult = useFocus({ id: 'input-1', autoFocus: true });
          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(focusResult?.isFocused?.value).toBe(true);
    clearInputHandlers();
  });

  it('should NOT auto-focus when autoFocus is not set', async () => {
    clearInputHandlers();

    let focusResult: FocusResult;

    createRoot(() => {
      return FocusProvider({
        get children() {
          focusResult = useFocus({ id: 'input-1' }); // No autoFocus
          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(focusResult?.isFocused?.value).toBe(false);
    clearInputHandlers();
  });

  it('should NOT auto-focus when autoFocus is false', async () => {
    clearInputHandlers();

    let focusResult: FocusResult;

    createRoot(() => {
      return FocusProvider({
        get children() {
          focusResult = useFocus({ id: 'input-1', autoFocus: false });
          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(focusResult?.isFocused?.value).toBe(false);
    clearInputHandlers();
  });

  it('should only auto-focus first item when multiple have autoFocus', async () => {
    clearInputHandlers();

    let focusA: FocusResult;
    let focusB: FocusResult;

    createRoot(() => {
      return FocusProvider({
        get children() {
          focusA = useFocus({ id: 'input-a', autoFocus: true });
          focusB = useFocus({ id: 'input-b', autoFocus: true });
          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // First registered item gets focus
    expect(focusA?.isFocused?.value).toBe(true);
    expect(focusB?.isFocused?.value).toBe(false);
    clearInputHandlers();
  });

  it('should auto-focus second item if first does not have autoFocus', async () => {
    clearInputHandlers();

    let focusA: FocusResult;
    let focusB: FocusResult;

    createRoot(() => {
      return FocusProvider({
        get children() {
          focusA = useFocus({ id: 'input-a' }); // No autoFocus
          focusB = useFocus({ id: 'input-b', autoFocus: true }); // Has autoFocus
          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(focusA?.isFocused?.value).toBe(false);
    expect(focusB?.isFocused?.value).toBe(true);
    clearInputHandlers();
  });

  it('should require Tab to focus when no autoFocus is set on any item', async () => {
    clearInputHandlers();

    let focusA: FocusResult;
    let focusB: FocusResult;

    createRoot(() => {
      return FocusProvider({
        get children() {
          focusA = useFocus({ id: 'input-a' });
          focusB = useFocus({ id: 'input-b' });
          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Nothing focused initially
    expect(focusA?.isFocused?.value).toBe(false);
    expect(focusB?.isFocused?.value).toBe(false);

    // Press Tab to focus first item
    dispatchInput('\t');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(focusA?.isFocused?.value).toBe(true);
    expect(focusB?.isFocused?.value).toBe(false);

    // Press Tab again to focus second item
    dispatchInput('\t');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(focusA?.isFocused?.value).toBe(false);
    expect(focusB?.isFocused?.value).toBe(true);

    clearInputHandlers();
  });

  it('should preserve Tab navigation order regardless of autoFocus', async () => {
    clearInputHandlers();

    let focusA: FocusResult;
    let focusB: FocusResult;
    let focusC: FocusResult;

    createRoot(() => {
      return FocusProvider({
        get children() {
          focusA = useFocus({ id: 'input-a' });
          focusB = useFocus({ id: 'input-b', autoFocus: true }); // Middle item has autoFocus
          focusC = useFocus({ id: 'input-c' });
          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // B has autoFocus, so it starts focused
    expect(focusA?.isFocused?.value).toBe(false);
    expect(focusB?.isFocused?.value).toBe(true);
    expect(focusC?.isFocused?.value).toBe(false);

    // Tab should go to C (next in order)
    dispatchInput('\t');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(focusA?.isFocused?.value).toBe(false);
    expect(focusB?.isFocused?.value).toBe(false);
    expect(focusC?.isFocused?.value).toBe(true);

    // Tab should wrap to A
    dispatchInput('\t');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(focusA?.isFocused?.value).toBe(true);
    expect(focusB?.isFocused?.value).toBe(false);
    expect(focusC?.isFocused?.value).toBe(false);

    clearInputHandlers();
  });

  it('should support Shift+Tab to go backwards from autoFocus', async () => {
    clearInputHandlers();

    let focusA: FocusResult;
    let focusB: FocusResult;

    createRoot(() => {
      return FocusProvider({
        get children() {
          focusA = useFocus({ id: 'input-a' });
          focusB = useFocus({ id: 'input-b', autoFocus: true });
          return Box({ children: 'test' });
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // B starts focused
    expect(focusB?.isFocused?.value).toBe(true);

    // Shift+Tab should go to A
    dispatchInput('\x1b[Z'); // Shift+Tab escape sequence
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(focusA?.isFocused?.value).toBe(true);
    expect(focusB?.isFocused?.value).toBe(false);

    clearInputHandlers();
  });
});
