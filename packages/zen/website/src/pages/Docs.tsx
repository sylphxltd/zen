/**
 * Docs Page
 */

import { CodeBlock } from '../components/CodeBlock.js';

export function Docs() {
  const container = document.createElement('div');
  container.className = 'container';

  const layout = document.createElement('div');
  layout.className = 'docs-layout';

  // Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'docs-sidebar';

  const sidebarSections = [
    {
      title: 'Getting Started',
      items: ['Installation', 'Quick Start', 'Core Concepts'],
    },
    {
      title: 'API Reference',
      items: ['signal', 'computed', 'effect', 'batch'],
    },
    {
      title: 'Components',
      items: ['For', 'Show', 'Switch', 'Router', 'Portal', 'ErrorBoundary'],
    },
  ];

  sidebarSections.forEach(({ title, items }) => {
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = title;

    const ul = document.createElement('ul');
    items.forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${item.toLowerCase().replace(/\s/g, '-')}`;
      a.textContent = item;
      li.appendChild(a);
      ul.appendChild(li);
    });

    sidebar.appendChild(sectionTitle);
    sidebar.appendChild(ul);
  });

  // Content
  const content = document.createElement('div');
  content.className = 'docs-content';

  // Title
  const h1 = document.createElement('h1');
  h1.textContent = 'Documentation';
  content.appendChild(h1);

  // Installation
  const installSection = createSection(
    'Installation',
    'Install ZenJS via npm or bun:',
    CodeBlock({
      code: `npm install zenjs
# or
bun add zenjs`,
      language: 'bash',
    }),
  );
  content.appendChild(installSection);

  // Quick Start
  const quickStartSection = createSection(
    'Quick Start',
    'Create your first reactive component:',
    CodeBlock({
      code: `import { signal, effect, render } from 'zenjs';

// Create reactive state
const count = signal(0);

// Create component
function Counter() {
  const button = document.createElement('button');
  button.textContent = 'Count: 0';

  // Update button text when count changes
  effect(() => {
    button.textContent = \`Count: \${count.value}\`;
  });

  // Increment on click
  button.onclick = () => count.value++;

  return button;
}

// Render to DOM
render(() => Counter(), document.getElementById('app')!);`,
      language: 'typescript',
    }),
  );
  content.appendChild(quickStartSection);

  // Core Concepts
  const conceptsSection = createSection(
    'Core Concepts',
    'ZenJS is built on three core primitives:',
  );

  const conceptsList = document.createElement('div');
  conceptsList.innerHTML = `
    <h3>signal(value)</h3>
    <p style="color: var(--text-muted); margin-bottom: 16px;">
      Creates reactive state. Read and write via .value property.
    </p>
  `;
  conceptsList.appendChild(
    CodeBlock({
      code: `const count = signal(0);
console.log(count.value); // 0
count.value = 10; // triggers updates`,
      language: 'typescript',
    }),
  );

  conceptsList.innerHTML += `
    <h3 style="margin-top: 32px;">computed(fn)</h3>
    <p style="color: var(--text-muted); margin-bottom: 16px;">
      Creates derived state. Automatically updates when dependencies change.
    </p>
  `;
  conceptsList.appendChild(
    CodeBlock({
      code: `const count = signal(5);
const doubled = computed(() => count.value * 2);

console.log(doubled.value); // 10
count.value = 10;
console.log(doubled.value); // 20`,
      language: 'typescript',
    }),
  );

  conceptsList.innerHTML += `
    <h3 style="margin-top: 32px;">effect(fn)</h3>
    <p style="color: var(--text-muted); margin-bottom: 16px;">
      Runs side effects when dependencies change. Perfect for DOM updates.
    </p>
  `;
  conceptsList.appendChild(
    CodeBlock({
      code: `const count = signal(0);

effect(() => {
  console.log('Count changed:', count.value);
  document.title = \`Count: \${count.value}\`;
});`,
      language: 'typescript',
    }),
  );

  conceptsSection.appendChild(conceptsList);
  content.appendChild(conceptsSection);

  // Components
  const componentsSection = createSection(
    'Components',
    'ZenJS provides essential components for building apps:',
  );

  const componentsList = document.createElement('div');

  // For
  componentsList.innerHTML += `<h3>For</h3><p style="color: var(--text-muted); margin-bottom: 16px;">Efficient list rendering with keyed updates.</p>`;
  componentsList.appendChild(
    CodeBlock({
      code: `import { For, signal } from 'zenjs';

const items = signal(['a', 'b', 'c']);

For({
  each: items,
  children: (item, index) => {
    const li = document.createElement('li');
    li.textContent = \`\${index()}: \${item}\`;
    return li;
  }
});`,
      language: 'typescript',
    }),
  );

  // Show
  componentsList.innerHTML += `<h3 style="margin-top: 32px;">Show</h3><p style="color: var(--text-muted); margin-bottom: 16px;">Conditional rendering.</p>`;
  componentsList.appendChild(
    CodeBlock({
      code: `import { Show, signal } from 'zenjs';

const isVisible = signal(true);

Show({
  when: isVisible,
  children: () => {
    const div = document.createElement('div');
    div.textContent = 'Visible!';
    return div;
  },
  fallback: () => {
    const div = document.createElement('div');
    div.textContent = 'Hidden';
    return div;
  }
});`,
      language: 'typescript',
    }),
  );

  // Router
  componentsList.innerHTML += `<h3 style="margin-top: 32px;">Router</h3><p style="color: var(--text-muted); margin-bottom: 16px;">Hash-based client-side routing.</p>`;
  componentsList.appendChild(
    CodeBlock({
      code: `import { Router, Link, navigate } from 'zenjs';

Router({
  routes: [
    { path: '/', component: () => Home() },
    { path: '/about', component: () => About() },
  ],
  fallback: () => NotFound()
});

// Navigation
Link({ href: '/about', children: 'About' });
navigate('/about');`,
      language: 'typescript',
    }),
  );

  componentsSection.appendChild(componentsList);
  content.appendChild(componentsSection);

  layout.appendChild(sidebar);
  layout.appendChild(content);
  container.appendChild(layout);

  return container;
}

function createSection(title: string, description: string, codeBlock?: Node) {
  const section = document.createElement('section');
  section.id = title.toLowerCase().replace(/\s/g, '-');
  section.style.marginBottom = '48px';

  const h2 = document.createElement('h2');
  h2.textContent = title;

  const p = document.createElement('p');
  p.textContent = description;

  section.appendChild(h2);
  section.appendChild(p);

  if (codeBlock) {
    section.appendChild(codeBlock);
  }

  return section;
}
