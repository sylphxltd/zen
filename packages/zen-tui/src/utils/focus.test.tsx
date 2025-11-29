import { describe, expect, it } from 'bun:test';
import { createRoot, setPlatformOps } from '@zen/runtime';
import { tuiPlatformOps } from '../core/platform-ops.js';
import { Text } from '../primitives/Text.js';
import { FocusProvider, useFocusManager } from './focus.js';

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
