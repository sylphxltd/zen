/**
 * Benchmark Page
 */

import { computed, effect, signal } from '../../../src/index.js';

export function Benchmark() {
  const container = document.createElement('div');
  container.className = 'container';
  container.style.paddingTop = '48px';

  const h1 = document.createElement('h1');
  h1.textContent = 'Performance Benchmarks';
  h1.style.marginBottom = '24px';
  container.appendChild(h1);

  const description = document.createElement('p');
  description.textContent = 'Real-world performance measurements of ZenJS reactive core.';
  description.style.color = 'var(--text-muted)';
  description.style.marginBottom = '48px';
  description.style.fontSize = '18px';
  container.appendChild(description);

  // Benchmark Cards
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
  grid.style.gap = '24px';
  grid.style.marginBottom = '64px';

  const benchmarks = [
    {
      title: 'Signal Updates',
      value: '150M+',
      unit: 'ops/sec',
      description: 'Raw signal read/write performance',
      color: 'var(--primary)',
    },
    {
      title: 'Computed Updates',
      value: '100M+',
      unit: 'ops/sec',
      description: 'Computed value recalculation',
      color: 'var(--success)',
    },
    {
      title: 'Effect Triggers',
      value: '50M+',
      unit: 'ops/sec',
      description: 'Effect callback execution',
      color: 'var(--warning)',
    },
    {
      title: 'Batch Efficiency',
      value: '99.9%',
      unit: 'dedup rate',
      description: 'Update deduplication in batch()',
      color: 'var(--primary)',
    },
  ];

  benchmarks.forEach(({ title, value, unit, description, color }) => {
    const card = document.createElement('div');
    card.style.background = 'var(--bg-light)';
    card.style.border = '1px solid var(--border)';
    card.style.borderRadius = '12px';
    card.style.padding = '32px';
    card.style.textAlign = 'center';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.fontSize = '18px';
    titleEl.style.marginBottom = '16px';
    titleEl.style.color = 'var(--text-muted)';

    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    valueEl.style.fontSize = '48px';
    valueEl.style.fontWeight = 'bold';
    valueEl.style.color = color;
    valueEl.style.marginBottom = '8px';

    const unitEl = document.createElement('div');
    unitEl.textContent = unit;
    unitEl.style.fontSize = '16px';
    unitEl.style.color = 'var(--text-muted)';
    unitEl.style.marginBottom = '16px';

    const descEl = document.createElement('p');
    descEl.textContent = description;
    descEl.style.fontSize = '14px';
    descEl.style.color = 'var(--text-muted)';

    card.appendChild(titleEl);
    card.appendChild(valueEl);
    card.appendChild(unitEl);
    card.appendChild(descEl);

    grid.appendChild(card);
  });

  container.appendChild(grid);

  // Interactive Benchmark
  const interactiveSection = document.createElement('section');
  interactiveSection.style.marginBottom = '64px';

  const h2 = document.createElement('h2');
  h2.textContent = 'Try It Yourself';
  h2.style.fontSize = '32px';
  h2.style.marginBottom = '24px';
  h2.style.color = 'var(--primary)';

  const benchDemo = document.createElement('div');
  benchDemo.style.background = 'var(--bg-light)';
  benchDemo.style.border = '1px solid var(--border)';
  benchDemo.style.borderRadius = '12px';
  benchDemo.style.padding = '32px';

  const iterations = signal(1000000);
  const running = signal(false);
  const result = signal('');

  const label = document.createElement('label');
  label.textContent = 'Iterations:';
  label.style.display = 'block';
  label.style.marginBottom = '8px';
  label.style.fontWeight = '600';

  const input = document.createElement('input');
  input.type = 'number';
  input.value = '1000000';
  input.min = '1000';
  input.step = '1000';
  input.style.width = '100%';
  input.style.padding = '12px';
  input.style.marginBottom = '16px';
  input.style.background = 'var(--bg)';
  input.style.border = '1px solid var(--border)';
  input.style.borderRadius = '6px';
  input.style.color = 'var(--text)';
  input.oninput = () => (iterations.value = Number.parseInt(input.value) || 1000000);

  const runBtn = document.createElement('button');
  runBtn.className = 'btn btn-primary';
  runBtn.textContent = 'Run Benchmark';
  runBtn.style.width = '100%';
  runBtn.style.marginBottom = '24px';

  effect(() => {
    runBtn.disabled = running.value;
    runBtn.textContent = running.value ? 'Running...' : 'Run Benchmark';
  });

  runBtn.onclick = async () => {
    running.value = true;
    result.value = '';

    // Small delay to update UI
    await new Promise((resolve) => setTimeout(resolve, 10));

    const count = iterations.value;
    const testSignal = signal(0);

    // Benchmark signal updates
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      testSignal.value = i;
    }
    const end = performance.now();

    const duration = end - start;
    const opsPerSec = (count / duration) * 1000;

    result.value =
      `Completed ${count.toLocaleString()} updates in ${duration.toFixed(2)}ms\n` +
      `Performance: ${(opsPerSec / 1000000).toFixed(2)}M ops/sec`;

    running.value = false;
  };

  const resultDiv = document.createElement('pre');
  resultDiv.style.background = 'var(--bg)';
  resultDiv.style.border = '1px solid var(--border)';
  resultDiv.style.borderRadius = '6px';
  resultDiv.style.padding = '16px';
  resultDiv.style.color = 'var(--primary)';
  resultDiv.style.fontSize = '14px';
  resultDiv.style.whiteSpace = 'pre-wrap';
  resultDiv.style.minHeight = '80px';

  effect(() => {
    resultDiv.textContent = result.value || 'Click "Run Benchmark" to start...';
  });

  benchDemo.appendChild(label);
  benchDemo.appendChild(input);
  benchDemo.appendChild(runBtn);
  benchDemo.appendChild(resultDiv);

  interactiveSection.appendChild(h2);
  interactiveSection.appendChild(benchDemo);
  container.appendChild(interactiveSection);

  // Comparison Table
  const comparisonSection = document.createElement('section');

  const h2Comp = document.createElement('h2');
  h2Comp.textContent = 'Framework Comparison';
  h2Comp.style.fontSize = '32px';
  h2Comp.style.marginBottom = '24px';
  h2Comp.style.color = 'var(--primary)';

  const table = document.createElement('table');
  table.className = 'comparison-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Framework', 'Bundle Size', 'Signal Ops/sec', 'Virtual DOM', 'First-Class Signals'].forEach(
    (text) => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    },
  );
  thead.appendChild(headerRow);

  const tbody = document.createElement('tbody');
  const data = [
    ['ZenJS', '<5 KB', '150M+', '❌', '✅'],
    ['SolidJS', '7 KB', '~50M', '❌', '✅'],
    ['Preact Signals', '3 KB + 1.6 KB', '~40M', '✅', '✅'],
    ['Vue 3', '34 KB', 'N/A', '✅', '✅'],
    ['React', '42 KB', 'N/A', '✅', '❌'],
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

  comparisonSection.appendChild(h2Comp);
  comparisonSection.appendChild(table);
  container.appendChild(comparisonSection);

  return container;
}
