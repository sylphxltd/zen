/**
 * SSR Tests - Verify server-side rendering
 */

import { describe, test, expect } from 'bun:test';
import { renderToString } from './server.js';
import { jsx } from './jsx-runtime-server.js';
import { createUniqueId } from './server-utils.js';
import { createEffect, onMount } from './lifecycle.js';

describe('renderToString', () => {
  test('renders simple HTML element', () => {
    const html = renderToString(() => jsx('div', { children: 'Hello' }));
    expect(html).toBe('<div>Hello</div>');
  });

  test('renders nested elements', () => {
    const html = renderToString(() =>
      jsx('div', {
        children: jsx('span', { children: 'Nested' }),
      })
    );
    expect(html).toBe('<div><span>Nested</span></div>');
  });

  test('renders with attributes', () => {
    const html = renderToString(() =>
      jsx('div', {
        className: 'test',
        id: 'main',
        children: 'Content',
      })
    );
    expect(html).toBe('<div class="test" id="main">Content</div>');
  });

  test('escapes HTML entities', () => {
    const html = renderToString(() =>
      jsx('div', { children: '<script>alert("xss")</script>' })
    );
    expect(html).toBe('<div>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</div>');
  });

  test('renders void elements', () => {
    const html = renderToString(() =>
      jsx('img', { src: 'test.jpg', alt: 'Test' })
    );
    expect(html).toBe('<img src="test.jpg" alt="Test" />');
  });

  test('renders style object', () => {
    const html = renderToString(() =>
      jsx('div', {
        style: { color: 'red', fontSize: '16px' },
        children: 'Styled',
      })
    );
    expect(html).toBe('<div style="color:red;font-size:16px">Styled</div>');
  });

  test('renders boolean attributes', () => {
    const html = renderToString(() =>
      jsx('input', { type: 'checkbox', checked: true, disabled: false })
    );
    expect(html).toBe('<input type="checkbox" checked />');
  });

  test('skips event handlers', () => {
    const html = renderToString(() =>
      jsx('button', {
        onClick: () => console.log('click'),
        children: 'Click',
      })
    );
    expect(html).toBe('<button>Click</button>');
    expect(html).not.toContain('onClick');
  });

  test('renders component functions', () => {
    const Greeting = ({ name }: { name: string }) =>
      jsx('div', { children: `Hello, ${name}!` });

    const html = renderToString(() => jsx(Greeting, { name: 'World' }));
    expect(html).toBe('<div>Hello, World!</div>');
  });

  test('generates unique IDs deterministically', () => {
    const Component = () => {
      const id1 = createUniqueId();
      const id2 = createUniqueId();
      return jsx('div', {
        id: id1,
        children: jsx('span', { id: id2 }),
      });
    };

    const html1 = renderToString(Component);
    const html2 = renderToString(Component);

    // IDs should be deterministic (reset between renders)
    expect(html1).toBe(html2);
    expect(html1).toContain('zen-0');
    expect(html1).toContain('zen-1');
  });

  test('skips createEffect in server mode', () => {
    let effectRan = false;

    const Component = () => {
      createEffect(() => {
        effectRan = true;
      });

      return jsx('div', { children: 'Test' });
    };

    renderToString(Component);

    // Effect should NOT run during SSR
    expect(effectRan).toBe(false);
  });

  test('skips onMount in server mode', () => {
    let mountRan = false;

    const Component = () => {
      onMount(() => {
        mountRan = true;
      });

      return jsx('div', { children: 'Test' });
    };

    renderToString(Component);

    // onMount should NOT run during SSR
    expect(mountRan).toBe(false);
  });

  test('renders array of children', () => {
    const html = renderToString(() =>
      jsx('ul', {
        children: [
          jsx('li', { children: 'Item 1' }),
          jsx('li', { children: 'Item 2' }),
          jsx('li', { children: 'Item 3' }),
        ],
      })
    );
    expect(html).toBe('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>');
  });
});
