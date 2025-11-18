export function Comparison() {
  const frameworks = [
    { name: 'Zen', size: '1.75 KB', perf: '150M+ ops/sec', vdom: 'No', reactivity: 'Fine-grained', highlight: true },
    { name: 'SolidJS', size: '7 KB', perf: '~50M ops/sec', vdom: 'No', reactivity: 'Fine-grained' },
    { name: 'Preact', size: '3 KB', perf: 'N/A', vdom: 'Yes', reactivity: 'Component' },
    { name: 'Vue 3', size: '34 KB', perf: 'N/A', vdom: 'Yes', reactivity: 'Fine-grained' },
    { name: 'React', size: '42 KB', perf: 'N/A', vdom: 'Yes', reactivity: 'Component' },
  ];

  return (
    <section class="comparison">
      <div class="container">
        <h2 class="section-title">Framework Comparison</h2>
        <p class="section-description">
          See how Zen compares to other popular frameworks
        </p>
        <div class="comparison-table-wrapper">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Framework</th>
                <th>Bundle Size</th>
                <th>Performance</th>
                <th>Virtual DOM</th>
                <th>Reactivity</th>
              </tr>
            </thead>
            <tbody>
              {frameworks.map((fw) => (
                <tr class={fw.highlight ? 'highlight' : ''}>
                  <td><strong>{fw.name}</strong></td>
                  <td>{fw.size}</td>
                  <td>{fw.perf}</td>
                  <td>{fw.vdom}</td>
                  <td>{fw.reactivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
