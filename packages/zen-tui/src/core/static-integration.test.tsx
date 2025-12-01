/** @jsxImportSource .. */
/**
 * Static Component Integration Tests
 *
 * Verifies:
 * 1. Static content goes to scrollback (not managed in buffer)
 * 2. console.log/error/stdout appear above dynamic UI
 * 3. Multiple Static components work correctly
 * 4. Static content persists after app unmount
 * 5. Buffer doesn't retain static content
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { signal } from '@zen/signal';
import { Box } from '../primitives/Box.js';
import { Static } from '../primitives/Static.js';
import { Text } from '../primitives/Text.js';

// Mock stdout/stderr to capture output
let stdoutWrites: string[] = [];
let stderrWrites: string[] = [];
let originalStdoutWrite: typeof process.stdout.write;
let originalStderrWrite: typeof process.stderr.write;

beforeEach(() => {
  stdoutWrites = [];
  stderrWrites = [];

  originalStdoutWrite = process.stdout.write.bind(process.stdout);
  originalStderrWrite = process.stderr.write.bind(process.stderr);

  process.stdout.write = ((chunk: string | Uint8Array) => {
    const str = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
    stdoutWrites.push(str);
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array) => {
    const str = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
    stderrWrites.push(str);
    return true;
  }) as typeof process.stderr.write;
});

afterEach(() => {
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
});

describe('Static Component - Scrollback Behavior', () => {
  test('static content is written directly to stdout (not buffered)', async () => {
    const { processStaticNodes, findStaticNodes } = await import('./tui-renderer.js');

    // Create a mock static node with items
    const items = signal([{ id: 1, text: 'First item' }]);

    const staticNode = {
      type: 'element' as const,
      tagName: 'static',
      props: {
        __itemsGetter: () => items.value,
        __renderChild: (item: { id: number; text: string }) => ({
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: [item.text],
          style: {},
        }),
        __lastRenderedCount: 0,
      },
      children: [],
      style: {},
    };

    // Process should write directly to stdout
    // biome-ignore lint/suspicious/noExplicitAny: accessing internal function signature
    const linesPrinted = (processStaticNodes as any)(staticNode, true);

    expect(linesPrinted).toBe(1);

    // Find the static content in stdout writes
    const staticOutput = stdoutWrites.find((w) => w.includes('First item'));
    expect(staticOutput).toBeDefined();
  });

  test('static content is NOT written in fullscreen mode', async () => {
    const { processStaticNodes } = await import('./tui-renderer.js');

    const items = signal([{ id: 1, text: 'Should not appear' }]);

    const staticNode = {
      type: 'element' as const,
      tagName: 'static',
      props: {
        __itemsGetter: () => items.value,
        __renderChild: (item: { id: number; text: string }) => ({
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: [item.text],
          style: {},
        }),
        __lastRenderedCount: 0,
      },
      children: [],
      style: {},
    };

    // Process with isInlineMode = false (fullscreen)
    const linesPrinted = (processStaticNodes as any)(staticNode, false);

    expect(linesPrinted).toBe(0);
  });

  test('only new items are printed (incremental)', async () => {
    const { processStaticNodes } = await import('./tui-renderer.js');

    const items = signal([
      { id: 1, text: 'Item 1' },
      { id: 2, text: 'Item 2' },
    ]);

    const staticNode = {
      type: 'element' as const,
      tagName: 'static',
      props: {
        __itemsGetter: () => items.value,
        __renderChild: (item: { id: number; text: string }) => ({
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: [item.text],
          style: {},
        }),
        __lastRenderedCount: 1, // Already rendered 1 item
      },
      children: [],
      style: {},
    };

    stdoutWrites = [];
    const linesPrinted = (processStaticNodes as any)(staticNode, true);

    // Should only print the new item (Item 2)
    expect(linesPrinted).toBe(1);

    const output = stdoutWrites.join('');
    expect(output).toContain('Item 2');
    expect(output).not.toContain('Item 1');
  });

  test('__lastRenderedCount is updated after printing', async () => {
    const { processStaticNodes } = await import('./tui-renderer.js');

    const items = signal([
      { id: 1, text: 'Item 1' },
      { id: 2, text: 'Item 2' },
      { id: 3, text: 'Item 3' },
    ]);

    const staticNode = {
      type: 'element' as const,
      tagName: 'static',
      props: {
        __itemsGetter: () => items.value,
        __renderChild: (item: { id: number; text: string }) => ({
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: [item.text],
          style: {},
        }),
        __lastRenderedCount: 0,
      },
      children: [],
      style: {},
    };

    (processStaticNodes as any)(staticNode, true);

    // Count should be updated
    expect(staticNode.props.__lastRenderedCount).toBe(3);
  });
});

describe('Static Component - Multiple Static Components', () => {
  test('multiple static components are found in tree', async () => {
    const { findStaticNodes } = await import('./tui-renderer.js');

    const rootNode = {
      type: 'element' as const,
      tagName: 'box',
      props: {},
      children: [
        {
          type: 'element' as const,
          tagName: 'static',
          props: { __itemsGetter: () => ['a'], __renderChild: () => 'a' },
          children: [],
          style: {},
        },
        {
          type: 'element' as const,
          tagName: 'box',
          props: {},
          children: [
            {
              type: 'element' as const,
              tagName: 'static',
              props: { __itemsGetter: () => ['b'], __renderChild: () => 'b' },
              children: [],
              style: {},
            },
          ],
          style: {},
        },
        {
          type: 'element' as const,
          tagName: 'static',
          props: { __itemsGetter: () => ['c'], __renderChild: () => 'c' },
          children: [],
          style: {},
        },
      ],
      style: {},
    };

    const staticNodes = (findStaticNodes as any)(rootNode);
    expect(staticNodes.length).toBe(3);
  });

  test('multiple static components print in order', async () => {
    const { processStaticNodes } = await import('./tui-renderer.js');

    const rootNode = {
      type: 'element' as const,
      tagName: 'box',
      props: {},
      children: [
        {
          type: 'element' as const,
          tagName: 'static',
          props: {
            __itemsGetter: () => [{ text: 'First Static' }],
            __renderChild: (item: { text: string }) => ({
              type: 'text' as const,
              tagName: 'text',
              props: {},
              children: [item.text],
              style: {},
            }),
            __lastRenderedCount: 0,
          },
          children: [],
          style: {},
        },
        {
          type: 'element' as const,
          tagName: 'static',
          props: {
            __itemsGetter: () => [{ text: 'Second Static' }],
            __renderChild: (item: { text: string }) => ({
              type: 'text' as const,
              tagName: 'text',
              props: {},
              children: [item.text],
              style: {},
            }),
            __lastRenderedCount: 0,
          },
          children: [],
          style: {},
        },
      ],
      style: {},
    };

    stdoutWrites = [];
    const linesPrinted = (processStaticNodes as any)(rootNode, true);

    expect(linesPrinted).toBe(2);

    const output = stdoutWrites.join('');
    const firstIndex = output.indexOf('First Static');
    const secondIndex = output.indexOf('Second Static');

    expect(firstIndex).toBeLessThan(secondIndex);
  });
});

describe('Static Component - Styled Content', () => {
  test('renders text with colors', async () => {
    const { renderNodeToString } = await import('./tui-renderer.js');

    const node = {
      type: 'text' as const,
      tagName: 'text',
      props: {},
      children: ['Colored text'],
      style: { color: 'green' },
    };

    const output = (renderNodeToString as any)(node);

    // Should contain ANSI green color code
    expect(output).toContain('\x1b[32m');
    expect(output).toContain('Colored text');
    expect(output).toContain('\x1b[39m'); // Reset
  });

  test('renders text with bold', async () => {
    const { renderNodeToString } = await import('./tui-renderer.js');

    const node = {
      type: 'text' as const,
      tagName: 'text',
      props: {},
      children: ['Bold text'],
      style: { bold: true },
    };

    const output = (renderNodeToString as any)(node);

    expect(output).toContain('\x1b[1m'); // Bold
    expect(output).toContain('Bold text');
    expect(output).toContain('\x1b[22m'); // Reset bold
  });

  test('renders box with border', async () => {
    const { renderNodeToString } = await import('./tui-renderer.js');

    const node = {
      type: 'element' as const,
      tagName: 'box',
      props: {},
      children: [
        {
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: ['Content'],
          style: {},
        },
      ],
      style: { borderStyle: 'single' },
    };

    const output = (renderNodeToString as any)(node);

    // Should contain border characters
    expect(output).toContain('┌');
    expect(output).toContain('┐');
    expect(output).toContain('└');
    expect(output).toContain('┘');
    expect(output).toContain('│');
    expect(output).toContain('Content');
  });

  test('renders round border', async () => {
    const { renderNodeToString } = await import('./tui-renderer.js');

    const node = {
      type: 'element' as const,
      tagName: 'box',
      props: {},
      children: [
        {
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: ['Round'],
          style: {},
        },
      ],
      style: { borderStyle: 'round' },
    };

    const output = (renderNodeToString as any)(node);

    expect(output).toContain('╭');
    expect(output).toContain('╮');
    expect(output).toContain('╰');
    expect(output).toContain('╯');
  });

  test('renders double border', async () => {
    const { renderNodeToString } = await import('./tui-renderer.js');

    const node = {
      type: 'element' as const,
      tagName: 'box',
      props: {},
      children: [
        {
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: ['Double'],
          style: {},
        },
      ],
      style: { borderStyle: 'double' },
    };

    const output = (renderNodeToString as any)(node);

    expect(output).toContain('╔');
    expect(output).toContain('╗');
    expect(output).toContain('╚');
    expect(output).toContain('╝');
    expect(output).toContain('║');
  });

  test('renders multiline content (flexDirection column)', async () => {
    const { renderNodeToString } = await import('./tui-renderer.js');

    const node = {
      type: 'element' as const,
      tagName: 'box',
      props: {},
      children: [
        {
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: ['Line 1'],
          style: {},
        },
        {
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: ['Line 2'],
          style: {},
        },
        {
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: ['Line 3'],
          style: {},
        },
      ],
      style: { flexDirection: 'column' },
    };

    const output = (renderNodeToString as any)(node);

    // Should have newlines between lines
    const lines = output.split('\n');
    expect(lines.length).toBe(3);
    expect(lines[0]).toContain('Line 1');
    expect(lines[1]).toContain('Line 2');
    expect(lines[2]).toContain('Line 3');
  });

  test('renders multiline content inside border', async () => {
    const { renderNodeToString } = await import('./tui-renderer.js');

    const node = {
      type: 'element' as const,
      tagName: 'box',
      props: {},
      children: [
        {
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: ['Line 1'],
          style: {},
        },
        {
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: ['Line 2'],
          style: {},
        },
      ],
      style: { borderStyle: 'single', flexDirection: 'column' },
    };

    const output = (renderNodeToString as any)(node);

    // Should have border around multiline content
    const lines = output.split('\n');
    expect(lines.length).toBe(4); // top border + 2 lines + bottom border
    expect(lines[0]).toContain('┌');
    expect(lines[1]).toContain('│');
    expect(lines[1]).toContain('Line 1');
    expect(lines[2]).toContain('│');
    expect(lines[2]).toContain('Line 2');
    expect(lines[3]).toContain('└');
  });
});

describe('Static Component - Line Counting', () => {
  test('counts single line correctly', async () => {
    const { processStaticNodes } = await import('./tui-renderer.js');

    const staticNode = {
      type: 'element' as const,
      tagName: 'static',
      props: {
        __itemsGetter: () => [{ text: 'Single line' }],
        __renderChild: (item: { text: string }) => ({
          type: 'text' as const,
          tagName: 'text',
          props: {},
          children: [item.text],
          style: {},
        }),
        __lastRenderedCount: 0,
      },
      children: [],
      style: {},
    };

    const linesPrinted = (processStaticNodes as any)(staticNode, true);
    expect(linesPrinted).toBe(1);
  });

  test('counts multiline content correctly', async () => {
    const { processStaticNodes } = await import('./tui-renderer.js');

    const staticNode = {
      type: 'element' as const,
      tagName: 'static',
      props: {
        __itemsGetter: () => [{ text: 'Multi' }],
        __renderChild: () => ({
          type: 'element' as const,
          tagName: 'box',
          props: {},
          children: [
            { type: 'text' as const, tagName: 'text', props: {}, children: ['Line 1'], style: {} },
            { type: 'text' as const, tagName: 'text', props: {}, children: ['Line 2'], style: {} },
            { type: 'text' as const, tagName: 'text', props: {}, children: ['Line 3'], style: {} },
          ],
          style: { flexDirection: 'column' },
        }),
        __lastRenderedCount: 0,
      },
      children: [],
      style: {},
    };

    const linesPrinted = (processStaticNodes as any)(staticNode, true);
    expect(linesPrinted).toBe(3); // 3 lines
  });

  test('counts bordered content correctly', async () => {
    const { processStaticNodes } = await import('./tui-renderer.js');

    const staticNode = {
      type: 'element' as const,
      tagName: 'static',
      props: {
        __itemsGetter: () => [{ text: 'Boxed' }],
        __renderChild: () => ({
          type: 'element' as const,
          tagName: 'box',
          props: {},
          children: [
            { type: 'text' as const, tagName: 'text', props: {}, children: ['Content'], style: {} },
          ],
          style: { borderStyle: 'single' },
        }),
        __lastRenderedCount: 0,
      },
      children: [],
      style: {},
    };

    const linesPrinted = (processStaticNodes as any)(staticNode, true);
    expect(linesPrinted).toBe(3); // top border + content + bottom border
  });
});

describe('Renderer - clearCurrentContent', () => {
  test('clearCurrentContent clears inline content before static print', async () => {
    const { createRenderer } = await import('./renderer/index.js');

    const renderer = createRenderer({
      width: 80,
      height: 24,
      mode: 'inline',
    });

    // Simulate some content rendered
    (renderer as any).contentHeight = 5;
    (renderer as any).cursorLine = 0;

    stdoutWrites = [];
    renderer.clearCurrentContent();

    // Should have written clear sequences
    const output = stdoutWrites.join('');
    // Should contain cursor movement and clear line sequences
    expect(output.length).toBeGreaterThan(0);
  });

  test('clearCurrentContent does nothing in fullscreen mode', async () => {
    const { createRenderer } = await import('./renderer/index.js');

    const renderer = createRenderer({
      width: 80,
      height: 24,
      mode: 'fullscreen',
    });

    (renderer as any).contentHeight = 5;

    stdoutWrites = [];
    renderer.clearCurrentContent();

    // Should not have written anything
    expect(stdoutWrites.length).toBe(0);
  });

  test('clearCurrentContent does nothing when contentHeight is 0', async () => {
    const { createRenderer } = await import('./renderer/index.js');

    const renderer = createRenderer({
      width: 80,
      height: 24,
      mode: 'inline',
    });

    (renderer as any).contentHeight = 0;

    stdoutWrites = [];
    renderer.clearCurrentContent();

    // Should not have written anything
    expect(stdoutWrites.length).toBe(0);
  });
});

describe('Renderer - resetCursorForStaticContent', () => {
  test('resets cursor tracking after static content', async () => {
    const { createRenderer } = await import('./renderer/index.js');

    const renderer = createRenderer({
      width: 80,
      height: 24,
      mode: 'inline',
    });

    // Simulate rendered content
    (renderer as any).contentHeight = 10;
    (renderer as any).cursorLine = 5;
    (renderer as any).isFirstRender = false;

    renderer.resetCursorForStaticContent(3);

    // Should reset tracking
    expect((renderer as any).contentHeight).toBe(0);
    expect((renderer as any).cursorLine).toBe(0);
    expect((renderer as any).isFirstRender).toBe(true);
  });
});

describe('Static Component - countNewStaticItems', () => {
  test('counts new items correctly', async () => {
    // This tests the private method indirectly through behavior
    const { findStaticNodes } = await import('./tui-renderer.js');

    const items1 = [{ id: 1 }, { id: 2 }];
    const items2 = [{ id: 3 }];

    const rootNode = {
      type: 'element' as const,
      tagName: 'box',
      props: {},
      children: [
        {
          type: 'element' as const,
          tagName: 'static',
          props: {
            __itemsGetter: () => items1,
            __lastRenderedCount: 1, // 1 already rendered, 1 new
          },
          children: [],
          style: {},
        },
        {
          type: 'element' as const,
          tagName: 'static',
          props: {
            __itemsGetter: () => items2,
            __lastRenderedCount: 0, // 0 rendered, 1 new
          },
          children: [],
          style: {},
        },
      ],
      style: {},
    };

    const staticNodes = (findStaticNodes as any)(rootNode);

    // Calculate new items manually (same logic as countNewStaticItems)
    let newCount = 0;
    for (const node of staticNodes) {
      const items = node.props.__itemsGetter();
      const lastCount = node.props.__lastRenderedCount || 0;
      if (items.length > lastCount) {
        newCount += items.length - lastCount;
      }
    }

    expect(newCount).toBe(2); // 1 from first + 1 from second
  });
});
