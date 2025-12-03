import { describe, expect, it, mock } from 'bun:test';
import { subscribe } from '@rapid/signal';
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
        theme: 'original',
        layout: { sidebar: 'left', width: 100 },
      },
    });

    const themeCalls: string[] = [];
    const sidebarCalls: string[] = [];
    const widthCalls: number[] = [];

    listenPaths(config, ['ui.theme'], (value) => themeCalls.push(value));
    listenPaths(config, ['ui.layout.sidebar'], (value) => sidebarCalls.push(value));
    listenPaths(config, ['ui.layout.width'], (value) => widthCalls.push(value));

    // Subscribe doesn't call listeners immediately
    expect(themeCalls).toEqual([]);
    expect(sidebarCalls).toEqual([]);
    expect(widthCalls).toEqual([]);

    config.setPath('ui.theme', 'updated');
    expect(config.selectPath('ui.theme').value).toBe('updated');
    expect(themeCalls).toEqual(['updated']);
    expect(sidebarCalls).toEqual([]);
    expect(widthCalls).toEqual([]);

    config.setPath('ui.layout.width', 500);
    expect(config.selectPath('ui.layout.width').value).toBe(500);
    expect(themeCalls).toEqual(['updated']);
    expect(sidebarCalls).toEqual([]);
    expect(widthCalls).toEqual([500]);
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
    const config = deepMap({ ui: { theme: 'original' } });

    const calls: Array<{ value: string; path: string; obj: any }> = [];
    const listener = (value: string, path: string, obj: any) => {
      calls.push({ value, path, obj });
    };
    const unsub = listenPaths(config, ['ui.theme'], listener);

    // Subscribe doesn't call immediately
    expect(calls.length).toBe(0);

    config.setPath('ui.theme', 'updated');

    // Listener called with new value after change
    expect(config.selectPath('ui.theme').value).toBe('updated');
    expect(calls.length).toBe(1);
    expect(calls[0]?.value).toBe('updated');
    expect(calls[0]?.path).toBe('ui.theme');

    unsub();
  });

  it('should support multiple paths in listener', () => {
    const config = deepMap({
      ui: { theme: 'dark', color: 'blue' },
    });

    let changes = 0;
    listenPaths(config, ['ui.theme', 'ui.color'], () => changes++);

    // No initial calls
    expect(changes).toBe(0);

    config.setPath('ui.theme', 'light');
    config.setPath('ui.color', 'red');

    expect(changes).toBe(2);
  });

  it('should support unsubscribe', () => {
    const config = deepMap({ ui: { theme: 'dark' } });

    let changes = 0;
    const unsubscribe = listenPaths(config, ['ui.theme'], () => changes++);

    // No initial call
    expect(changes).toBe(0);

    config.setPath('ui.theme', 'light');
    expect(changes).toBe(1);

    unsubscribe();

    config.setPath('ui.theme', 'dark');
    expect(changes).toBe(1); // Should not increment after unsubscribe
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
    const unsub = subscribe(themeZ, mock());

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
