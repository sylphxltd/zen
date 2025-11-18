/**
 * Home Page
 */

import { effect, signal } from '../../../src/index.js';
import { CodeBlock } from '../components/CodeBlock.js';

export function Home() {
  const container = document.createElement('div');

  // Hero Section
  const hero = document.createElement('section');
  hero.className = 'hero';

  const heroContainer = document.createElement('div');
  heroContainer.className = 'container';

  const h1 = document.createElement('h1');
  h1.textContent = 'ZenJS';

  const p = document.createElement('p');
  p.textContent =
    'Ultra-fast, ultra-lightweight reactive framework. Beyond SolidJS in performance and simplicity.';

  const actions = document.createElement('div');
  actions.className = 'hero-actions';

  const primaryBtn = document.createElement('a');
  primaryBtn.href = '#/docs';
  primaryBtn.className = 'btn btn-primary';
  primaryBtn.textContent = 'Get Started';

  const secondaryBtn = document.createElement('a');
  secondaryBtn.href = 'https://github.com/SylphxAI/zen';
  secondaryBtn.className = 'btn btn-secondary';
  secondaryBtn.textContent = 'View on GitHub';
  secondaryBtn.target = '_blank';

  actions.appendChild(primaryBtn);
  actions.appendChild(secondaryBtn);

  heroContainer.appendChild(h1);
  heroContainer.appendChild(p);
  heroContainer.appendChild(actions);
  hero.appendChild(heroContainer);

  // Live Demo Section
  const demoSection = document.createElement('section');
  demoSection.className = 'container';
  demoSection.style.marginTop = '80px';

  const demoTitle = document.createElement('h2');
  demoTitle.textContent = 'Live Demo';
  demoTitle.style.textAlign = 'center';
  demoTitle.style.marginBottom = '48px';
  demoTitle.style.fontSize = '48px';

  const demoGrid = document.createElement('div');
  demoGrid.style.display = 'grid';
  demoGrid.style.gridTemplateColumns = '1fr 1fr';
  demoGrid.style.gap = '32px';
  demoGrid.style.alignItems = 'start';

  // Code Example
  const codeExample = CodeBlock({
    code: `import { signal, effect } from 'zenjs';

// Create reactive state
const count = signal(0);

// Auto-updates when count changes
effect(() => {
  console.log('Count:', count.value);
});

// Update state
count.value++;`,
    language: 'typescript',
  });

  // Live Counter
  const liveDemo = document.createElement('div');
  liveDemo.style.background = 'var(--bg-light)';
  liveDemo.style.border = '1px solid var(--border)';
  liveDemo.style.borderRadius = '12px';
  liveDemo.style.padding = '32px';

  const liveDemoTitle = document.createElement('h3');
  liveDemoTitle.textContent = 'Interactive Counter';
  liveDemoTitle.style.marginBottom = '24px';
  liveDemoTitle.style.color = 'var(--primary)';

  const count = signal(0);

  const countDisplay = document.createElement('div');
  countDisplay.style.fontSize = '48px';
  countDisplay.style.fontWeight = 'bold';
  countDisplay.style.textAlign = 'center';
  countDisplay.style.margin = '24px 0';
  countDisplay.style.color = 'var(--primary)';

  effect(() => {
    countDisplay.textContent = String(count.value);
  });

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.gap = '16px';
  btnContainer.style.justifyContent = 'center';

  const incrementBtn = document.createElement('button');
  incrementBtn.className = 'btn btn-primary';
  incrementBtn.textContent = '+1';
  incrementBtn.onclick = () => count.value++;

  const decrementBtn = document.createElement('button');
  decrementBtn.className = 'btn btn-secondary';
  decrementBtn.textContent = '-1';
  decrementBtn.onclick = () => count.value--;

  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn-secondary';
  resetBtn.textContent = 'Reset';
  resetBtn.onclick = () => (count.value = 0);

  btnContainer.appendChild(decrementBtn);
  btnContainer.appendChild(incrementBtn);
  btnContainer.appendChild(resetBtn);

  liveDemo.appendChild(liveDemoTitle);
  liveDemo.appendChild(countDisplay);
  liveDemo.appendChild(btnContainer);

  demoGrid.appendChild(codeExample);
  demoGrid.appendChild(liveDemo);

  demoSection.appendChild(demoTitle);
  demoSection.appendChild(demoGrid);

  // Features Section
  const features = document.createElement('section');
  features.className = 'features';

  const featuresContainer = document.createElement('div');
  featuresContainer.className = 'container';

  const featuresTitle = document.createElement('h2');
  featuresTitle.textContent = 'Why ZenJS?';

  const featureGrid = document.createElement('div');
  featureGrid.className = 'feature-grid';

  const featuresData = [
    {
      icon: '⚡',
      title: 'Ultra Fast',
      description: '150M+ signal updates/sec. Fine-grained reactivity with zero overhead.',
    },
    {
      icon: '🪶',
      title: 'Ultra Light',
      description: 'Core: 1.75 KB. Framework: <5 KB. Smaller than React hooks.',
    },
    {
      icon: '🎯',
      title: 'No Virtual DOM',
      description: 'Direct DOM updates. Components render once. Signals handle all updates.',
    },
    {
      icon: '🔧',
      title: 'Simple API',
      description: 'signal, computed, effect. Consistent .value API. JSX auto-unwrap.',
    },
    {
      icon: '🚀',
      title: 'Complete Features',
      description: 'Router, Portal, ErrorBoundary, For, Show, Switch. Everything you need.',
    },
    {
      icon: '📦',
      title: 'Zero Dependencies',
      description: 'Powered by @sylphx/zen. No runtime dependencies. TypeScript first.',
    },
  ];

  featuresData.forEach(({ icon, title, description }) => {
    const card = document.createElement('div');
    card.className = 'feature-card';

    const iconEl = document.createElement('div');
    iconEl.className = 'feature-icon';
    iconEl.textContent = icon;

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;

    const descEl = document.createElement('p');
    descEl.textContent = description;

    card.appendChild(iconEl);
    card.appendChild(titleEl);
    card.appendChild(descEl);

    featureGrid.appendChild(card);
  });

  featuresContainer.appendChild(featuresTitle);
  featuresContainer.appendChild(featureGrid);
  features.appendChild(featuresContainer);

  // Comparison Section
  const comparison = document.createElement('section');
  comparison.className = 'comparison';

  const comparisonContainer = document.createElement('div');
  comparisonContainer.className = 'container';

  const comparisonTitle = document.createElement('h2');
  comparisonTitle.textContent = 'Framework Comparison';

  const table = document.createElement('table');
  table.className = 'comparison-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Framework', 'Size', 'Performance', 'Virtual DOM', 'Reactivity'].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  const data = [
    ['ZenJS', '<5 KB', '150M+ ops/sec', 'No', 'Fine-grained'],
    ['SolidJS', '7 KB', '~50M ops/sec', 'No', 'Fine-grained'],
    ['Preact', '3 KB', 'N/A', 'Yes', 'Component-level'],
    ['React', '42 KB', 'N/A', 'Yes', 'Component-level'],
    ['Vue 3', '34 KB', 'N/A', 'Yes', 'Fine-grained'],
  ];

  data.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((text) => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  comparisonContainer.appendChild(comparisonTitle);
  comparisonContainer.appendChild(table);
  comparison.appendChild(comparisonContainer);

  // Assemble page
  container.appendChild(hero);
  container.appendChild(demoSection);
  container.appendChild(features);
  container.appendChild(comparison);

  return container;
}
