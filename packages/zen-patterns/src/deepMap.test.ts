import { describe, expect, it, vi } from 'vitest';
import { subscribe } from '@sylphx/zen';
import { deepMap, listenPaths, setPath } from './deepMap';

describe('deepMap', () => {
  it('should create a deepMap with initial nested values', () => {
    const config = deepMap({
      ui: {
        theme: 'dark',
        layout: { sidebar: 'left', width: 200 },
      },
    });

    expect(config.value).toEqual({
      ui: {
        theme: 'dark',
        layout: { sidebar: 'left', width: 200 },
      },
    });
  });

  it('should update nested paths immutably', () => {
    const config = deepMap({
      ui: { theme: 'dark', layout: { width: 200 } },
    });
    const oldValue = config.value;
    const oldUi = config.value.ui;

    config.setPath('ui.theme', 'light');

    expect(config.value.ui.theme).toBe('light');
    expect(config.value).not.toBe(oldValue); // Root changed
    expect(config.value.ui).not.toBe(oldUi); // Parent changed
  });

  it('should provide selective path reactivity', () => {
    const config = deepMap({
      ui: {
        theme: 'dark',
        layout: { sidebar: 'left', width: 200 },
      },
    });

    const themeListener = vi.fn();
    const sidebarListener = vi.fn();
    const widthListener = vi.fn();

    listenPaths(config, ['ui.theme'], themeListener);
    listenPaths(config, ['ui.layout.sidebar'], sidebarListener);
    listenPaths(config, ['ui.layout.width'], widthListener);

    // Listeners are called immediately on subscription with initial values
    expect(themeListener).toHaveBeenCalledTimes(1);
    expect(sidebarListener).toHaveBeenCalledTimes(1);
    expect(widthListener).toHaveBeenCalledTimes(1);

    config.setPath('ui.theme', 'light');
    expect(themeListener).toHaveBeenCalledTimes(2);
    expect(sidebarListener).toHaveBeenCalledTimes(1);
    expect(widthListener).toHaveBeenCalledTimes(1);

    config.setPath('ui.layout.width', 300);
    expect(themeListener).toHaveBeenCalledTimes(2);
    expect(sidebarListener).toHaveBeenCalledTimes(1);
    expect(widthListener).toHaveBeenCalledTimes(2);
  });

  it('should support array bracket notation', () => {
    const data = deepMap({ items: [{ name: 'A' }, { name: 'B' }] });

    data.setPath('items[0].name', 'C');

    expect(data.value.items[0].name).toBe('C');
    expect(data.value.items[1].name).toBe('B');
  });

  it('should support array path syntax', () => {
    const data = deepMap({ items: [{ name: 'A' }] });

    data.setPath(['items', 0, 'name'], 'Updated');

    expect(data.value.items[0].name).toBe('Updated');
  });

  it('should create missing intermediate objects', () => {
    const data = deepMap<any>({});

    data.setPath('ui.theme', 'dark');

    expect(data.value).toEqual({ ui: { theme: 'dark' } });
  });

  it('should create missing intermediate arrays', () => {
    const data = deepMap<any>({});

    data.setPath(['items', 0, 'name'], 'First');

    expect(data.value).toEqual({ items: [{ name: 'First' }] });
  });

  it('should pass value, path, and full object to listener', () => {
    const config = deepMap({ ui: { theme: 'dark' } });

    const listener = vi.fn();
    const unsub = listenPaths(config, ['ui.theme'], listener);

    // Clear initial call on subscription
    listener.mockClear();

    config.setPath('ui.theme', 'light');

    expect(listener).toHaveBeenCalledWith('light', 'ui.theme', expect.objectContaining({ ui: { theme: 'light' } }));

    unsub();
  });

  it('should support multiple paths in listener', () => {
    const config = deepMap({
      ui: { theme: 'dark', color: 'blue' },
    });

    let changes = 0;
    listenPaths(config, ['ui.theme', 'ui.color'], () => changes++);

    config.setPath('ui.theme', 'light');
    config.setPath('ui.color', 'red');

    expect(changes).toBe(2);
  });

  it('should support unsubscribe', () => {
    const config = deepMap({ ui: { theme: 'dark' } });

    let changes = 0;
    const unsubscribe = listenPaths(config, ['ui.theme'], () => changes++);

    config.setPath('ui.theme', 'light');
    expect(changes).toBe(1);

    unsubscribe();

    config.setPath('ui.theme', 'dark');
    expect(changes).toBe(1); // Should not increment
  });

  it('should support setPath helper', () => {
    const config = deepMap({ ui: { theme: 'dark' } });

    setPath(config, 'ui.theme', 'light');

    expect(config.value.ui.theme).toBe('light');
  });

  it('should support selectPath for computed access', () => {
    const config = deepMap({ ui: { theme: 'dark' } });

    const themeZ = config.selectPath('ui.theme');

    // Need to subscribe to trigger initial computation
    const unsub = subscribe(themeZ, vi.fn());

    expect(themeZ.value).toBe('dark');

    config.setPath('ui.theme', 'light');
    expect(themeZ.value).toBe('light');

    unsub();
  });

  it('should cache selectPath computeds', () => {
    const config = deepMap({ ui: { theme: 'dark' } });

    const themeZ1 = config.selectPath('ui.theme');
    const themeZ2 = config.selectPath('ui.theme');

    expect(themeZ1).toBe(themeZ2); // Should be same instance
  });

  it('should handle undefined nested access gracefully', () => {
    const config = deepMap<any>({ ui: {} });

    const themeZ = config.selectPath('ui.theme');

    expect(themeZ.value).toBeUndefined();
  });
});
