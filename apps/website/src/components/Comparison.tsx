export function Comparison() {
  const frameworks = [
    {
      name: 'Rapid',
      size: '1.75 KB',
      perf: '150M+ ops/sec',
      vdom: 'No',
      reactivity: 'Fine-grained',
      highlight: true,
    },
    { name: 'SolidJS', size: '7 KB', perf: '~50M ops/sec', vdom: 'No', reactivity: 'Fine-grained' },
    { name: 'Preact', size: '3 KB', perf: 'N/A', vdom: 'Yes', reactivity: 'Component' },
    { name: 'Vue 3', size: '34 KB', perf: 'N/A', vdom: 'Yes', reactivity: 'Fine-grained' },
    { name: 'React', size: '42 KB', perf: 'N/A', vdom: 'Yes', reactivity: 'Component' },
  ];

  return (
    <section class="py-16 px-0 bg-bg-light">
      <div class="max-w-screen-xl mx-auto px-6">
        <h2 class="text-5xl font-bold text-center mb-4 text-text">Framework Comparison</h2>
        <p class="text-xl text-center text-text-muted mb-12">
          See how Rapid compares to other popular frameworks
        </p>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse bg-bg border border-border rounded-rapid overflow-hidden">
            <thead>
              <tr class="bg-bg-lighter">
                <th class="text-left p-4 text-text font-semibold border-b border-border">
                  Framework
                </th>
                <th class="text-left p-4 text-text font-semibold border-b border-border">
                  Bundle Size
                </th>
                <th class="text-left p-4 text-text font-semibold border-b border-border">
                  Performance
                </th>
                <th class="text-left p-4 text-text font-semibold border-b border-border">
                  Virtual DOM
                </th>
                <th class="text-left p-4 text-text font-semibold border-b border-border">
                  Reactivity
                </th>
              </tr>
            </thead>
            <tbody>
              {frameworks.map((fw) => (
                <tr
                  key={fw.name}
                  class={
                    fw.highlight
                      ? 'bg-primary/10 border-l-4 border-l-primary'
                      : 'hover:bg-bg-lighter transition-colors'
                  }
                >
                  <td class="p-4 border-b border-border">
                    <strong class="text-text">{fw.name}</strong>
                  </td>
                  <td class="p-4 border-b border-border text-text-muted">{fw.size}</td>
                  <td class="p-4 border-b border-border text-text-muted">{fw.perf}</td>
                  <td class="p-4 border-b border-border text-text-muted">{fw.vdom}</td>
                  <td class="p-4 border-b border-border text-text-muted">{fw.reactivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
