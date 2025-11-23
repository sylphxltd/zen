import { describe, expect, it, beforeAll } from 'vitest';
import { createRoot } from '@zen/signal';
import { setPlatformOps } from '@zen/runtime';
import { tuiPlatformOps } from './platform-ops';
import { FocusProvider, useFocusManager } from './focus';
import { Text } from './components/Text';

// Initialize platform operations before tests
beforeAll(() => {
  setPlatformOps(tuiPlatformOps);
});

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
