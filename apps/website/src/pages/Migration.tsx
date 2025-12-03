import { For, Show, signal } from '@zen/web';
import { Icon } from '../components/Icon.tsx';

export function Migration() {
  const activeFramework = signal<'react' | 'vue' | 'solid' | 'svelte' | 'vanilla'>('react');
  const activeStep = signal(0);

  const frameworks = [
    { id: 'react' as const, name: 'React', color: '#61DAFB', abbr: 'R' },
    { id: 'vue' as const, name: 'Vue', color: '#42B883', abbr: 'V' },
    { id: 'solid' as const, name: 'Solid', color: '#4F88C6', abbr: 'S' },
    { id: 'svelte' as const, name: 'Svelte', color: '#FF3E00', abbr: 'Sv' },
    { id: 'vanilla' as const, name: 'Vanilla', color: '#F7DF1E', abbr: 'JS' },
  ];

  const migrations = {
    react: {
      tagline: '90% smaller, 10x faster',
      stats: { before: '42 KB', after: '< 5 KB', reduction: '-88%' },
      quickWins: [
        { icon: 'lucide:package', text: 'No dependency arrays' },
        { icon: 'lucide:zap', text: 'No re-renders' },
        { icon: 'lucide:brain', text: 'Auto-tracking' },
      ],
      comparisons: [
        {
          label: 'State',
          before: `const [count, setCount] = useState(0);
setCount(c => c + 1);`,
          after: `const count = signal(0);
count.value++;`,
        },
        {
          label: 'Computed',
          before: `const doubled = useMemo(
  () => count * 2,
  [count]  // 😩 dependency array
);`,
          after: `const doubled = computed(
  () => count.value * 2
  // ✨ auto-tracked!
);`,
        },
        {
          label: 'Effects',
          before: `useEffect(() => {
  document.title = count;
}, [count]);  // 😩 easy to forget`,
          after: `effect(() => {
  document.title = count.value;
});  // ✨ just works`,
        },
      ],
    },
    vue: {
      tagline: 'Same API, smaller bundle',
      stats: { before: '34 KB', after: '< 5 KB', reduction: '-85%' },
      quickWins: [
        { icon: 'lucide:copy', text: 'Nearly identical API' },
        { icon: 'lucide:file-code', text: 'No .vue files needed' },
        { icon: 'lucide:boxes', text: 'Any bundler works' },
      ],
      comparisons: [
        {
          label: 'Reactive',
          before: `import { ref } from 'vue';
const count = ref(0);
count.value++;`,
          after: `import { signal } from '@zen/signal';
const count = signal(0);
count.value++;  // ✨ identical!`,
        },
        {
          label: 'Computed',
          before: `import { computed } from 'vue';
const doubled = computed(
  () => count.value * 2
);`,
          after: `import { computed } from '@zen/signal';
const doubled = computed(
  () => count.value * 2
);  // ✨ same API!`,
        },
        {
          label: 'Watch',
          before: `watchEffect(() => {
  console.log(count.value);
});`,
          after: `effect(() => {
  console.log(count.value);
});  // ✨ just renamed`,
        },
      ],
    },
    solid: {
      tagline: 'Unified .value API',
      stats: { before: '7 KB', after: '< 5 KB', reduction: '-30%' },
      quickWins: [
        { icon: 'lucide:equal', text: 'Consistent .value' },
        { icon: 'lucide:arrow-right-left', text: 'No getter/setter split' },
        { icon: 'lucide:sparkles', text: 'Same reactivity model' },
      ],
      comparisons: [
        {
          label: 'Signals',
          before: `const [count, setCount] = createSignal(0);
count();      // read (call it)
setCount(1);  // write (different fn)`,
          after: `const count = signal(0);
count.value;      // read
count.value = 1;  // write
// ✨ unified API!`,
        },
        {
          label: 'Computed',
          before: `const doubled = createMemo(
  () => count() * 2
);
doubled();  // call to read`,
          after: `const doubled = computed(
  () => count.value * 2
);
doubled.value;  // ✨ consistent`,
        },
      ],
    },
    svelte: {
      tagline: 'No compiler needed',
      stats: { before: 'Compiler', after: 'Runtime', reduction: '0 KB build' },
      quickWins: [
        { icon: 'lucide:code', text: 'Standard JavaScript' },
        { icon: 'lucide:check-circle', text: 'Better IDE support' },
        { icon: 'lucide:globe', text: 'Works anywhere' },
      ],
      comparisons: [
        {
          label: 'Reactive',
          before: `// Svelte (needs compiler)
<script>
  let count = 0;
  $: doubled = count * 2;
</script>`,
          after: `// Zen (standard JS)
const count = signal(0);
const doubled = computed(
  () => count.value * 2
);`,
        },
        {
          label: 'Stores',
          before: `// Svelte store
import { writable } from 'svelte/store';
const count = writable(0);
$count;  // auto-subscribe`,
          after: `// Zen signal
import { signal } from '@zen/signal';
const count = signal(0);
count.value;  // ✨ simpler`,
        },
      ],
    },
    vanilla: {
      tagline: 'Add reactivity, keep control',
      stats: { before: 'Manual DOM', after: '1.75 KB', reduction: 'Reactive' },
      quickWins: [
        { icon: 'lucide:feather', text: 'Only 1.75 KB' },
        { icon: 'lucide:puzzle', text: 'Gradual adoption' },
        { icon: 'lucide:layers', text: 'Works with any DOM' },
      ],
      comparisons: [
        {
          label: 'State + DOM',
          before: `let count = 0;
const el = document.querySelector('#n');

function update() {
  el.textContent = count;  // manual!
}

btn.onclick = () => {
  count++;
  update();  // 😩 don't forget!
};`,
          after: `const count = signal(0);

effect(() => {
  el.textContent = count.value;
});  // ✨ auto-updates!

btn.onclick = () => count.value++;`,
        },
      ],
    },
  };

  const steps = [
    {
      title: 'Install',
      icon: 'lucide:download',
      code: 'npm install @zen/signal @zen/web',
      description: 'Add Zen packages to your project',
    },
    {
      title: 'Configure',
      icon: 'lucide:settings',
      code: `// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@zen/web"
  }
}`,
      description: 'Update your TypeScript config',
    },
    {
      title: 'Migrate',
      icon: 'lucide:git-branch',
      code: `// Start with one component
import { signal } from '@zen/signal';

function Counter() {
  const count = signal(0);
  return (
    <button onClick={() => count.value++}>
      {count}
    </button>
  );
}`,
      description: 'Convert components one at a time',
    },
  ];

  const current = () => migrations[activeFramework.value];

  return (
    <div class="min-h-screen bg-bg">
      {/* Hero - Dramatic gradient */}
      <section class="relative overflow-hidden border-b border-border">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

        <div class="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-bg-light/80 backdrop-blur border border-border rounded-full text-sm text-text-muted mb-6">
            <Icon icon="lucide:arrow-right-left" width="16" height="16" class="text-primary" />
            Framework Migration Guide
          </div>

          <h1 class="text-4xl md:text-6xl font-bold text-text mb-6">
            Switch to{' '}
            <span class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Zen
            </span>
          </h1>

          <p class="text-xl text-text-muted max-w-2xl mx-auto mb-10">
            Familiar APIs. Smaller bundles. Better performance.
            <br />
            Migrate from your current framework with confidence.
          </p>

          {/* Framework Pills */}
          <div class="flex flex-wrap justify-center gap-3">
            <For each={frameworks}>
              {(fw) => (
                <button
                  type="button"
                  class="group relative"
                  onClick={() => {
                    activeFramework.value = fw.id;
                  }}
                >
                  <div
                    class={
                      activeFramework.value === fw.id
                        ? 'flex items-center gap-3 px-6 py-3 bg-bg-light border-2 border-primary rounded-2xl shadow-lg shadow-primary/20 transition-all'
                        : 'flex items-center gap-3 px-6 py-3 bg-bg-light/50 border-2 border-transparent rounded-2xl hover:bg-bg-light hover:border-border transition-all'
                    }
                  >
                    <div
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: fw.color }}
                    >
                      {fw.abbr}
                    </div>
                    <span class="font-medium text-text">{fw.name}</span>
                  </div>
                </button>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section class="border-b border-border bg-bg-light/50">
        <div class="max-w-6xl mx-auto px-6 py-8">
          <div class="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div class="text-center">
              <div class="text-3xl font-bold text-text-muted line-through opacity-60">
                {current().stats.before}
              </div>
              <div class="text-sm text-text-subtle">Before</div>
            </div>
            <div class="flex items-center gap-3">
              <Icon icon="lucide:arrow-right" width="24" height="24" class="text-primary" />
              <div class="px-4 py-2 bg-success/10 text-success font-bold rounded-xl text-lg">
                {current().stats.reduction}
              </div>
              <Icon icon="lucide:arrow-right" width="24" height="24" class="text-primary" />
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-primary">{current().stats.after}</div>
              <div class="text-sm text-text-subtle">After (Zen)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Wins */}
      <section class="py-12 border-b border-border">
        <div class="max-w-6xl mx-auto px-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <For each={() => current().quickWins}>
              {(win) => (
                <div class="flex items-center gap-4 p-5 bg-bg-light rounded-2xl border border-border">
                  <div class="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-xl">
                    <Icon icon={win.icon} width="24" height="24" />
                  </div>
                  <span class="font-medium text-text">{win.text}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* Code Comparisons */}
      <section class="py-16">
        <div class="max-w-6xl mx-auto px-6">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-text mb-3">Side-by-Side</h2>
            <p class="text-text-muted">See how your code transforms</p>
          </div>

          <div class="space-y-6">
            <For each={() => current().comparisons}>
              {(comp) => (
                <div class="bg-bg-light rounded-3xl border border-border overflow-hidden">
                  <div class="px-6 py-4 bg-bg-lighter border-b border-border">
                    <span class="font-semibold text-text">{comp.label}</span>
                  </div>
                  <div class="grid grid-cols-1 lg:grid-cols-2">
                    {/* Before */}
                    <div class="p-6 border-b lg:border-b-0 lg:border-r border-border">
                      <div class="flex items-center gap-2 text-sm text-text-muted mb-4">
                        <div class="w-2 h-2 rounded-full bg-red-400" />
                        Before
                      </div>
                      <pre class="text-sm font-mono text-text-muted whitespace-pre-wrap leading-relaxed">
                        {comp.before}
                      </pre>
                    </div>
                    {/* After */}
                    <div class="p-6 bg-success/[0.03]">
                      <div class="flex items-center gap-2 text-sm text-success font-medium mb-4">
                        <div class="w-2 h-2 rounded-full bg-success" />
                        After (Zen)
                      </div>
                      <pre class="text-sm font-mono text-text whitespace-pre-wrap leading-relaxed">
                        {comp.after}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>

      {/* Migration Steps */}
      <section class="py-16 bg-bg-light/30 border-y border-border">
        <div class="max-w-4xl mx-auto px-6">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-text mb-3">3 Simple Steps</h2>
            <p class="text-text-muted">Get started in minutes</p>
          </div>

          {/* Step Tabs */}
          <div class="flex justify-center gap-4 mb-8">
            {steps.map((step, i) => (
              <button
                key={step.title}
                type="button"
                class="transition-all"
                onClick={() => {
                  activeStep.value = i;
                }}
              >
                <Show
                  when={() => activeStep.value === i}
                  fallback={
                    <div class="flex flex-col items-center gap-2 px-6 py-3 bg-bg-light text-text-muted font-medium rounded-2xl border border-border hover:border-primary/30">
                      <span class="w-8 h-8 flex items-center justify-center bg-bg text-text-muted rounded-full text-sm font-bold border border-border">
                        {i + 1}
                      </span>
                      {step.title}
                    </div>
                  }
                >
                  <div class="flex flex-col items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-2xl shadow-lg shadow-primary/30 scale-105">
                    <span class="w-8 h-8 flex items-center justify-center bg-white text-primary rounded-full text-sm font-bold">
                      {i + 1}
                    </span>
                    {step.title}
                  </div>
                </Show>
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div class="bg-bg-light rounded-3xl border border-border overflow-hidden">
            {steps.map((step, i) => (
              <Show key={step.title} when={() => activeStep.value === i}>
                <div class="p-8">
                  <div class="flex items-center gap-4 mb-6">
                    <div class="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white rounded-2xl shadow-lg">
                      <Icon icon={step.icon} width="28" height="28" />
                    </div>
                    <div>
                      <h3 class="text-xl font-bold text-text">{step.title}</h3>
                      <p class="text-text-muted">{step.description}</p>
                    </div>
                  </div>
                  <pre class="p-5 bg-bg rounded-2xl border border-border font-mono text-sm text-text whitespace-pre-wrap overflow-x-auto">
                    {step.code}
                  </pre>
                </div>
              </Show>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section class="py-20">
        <div class="max-w-4xl mx-auto px-6 text-center">
          <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl" />
            <div class="relative bg-bg-light rounded-3xl border border-border p-12">
              <Icon icon="lucide:rocket" width="48" height="48" class="mx-auto mb-6 text-primary" />
              <h2 class="text-3xl font-bold text-text mb-4">Ready to migrate?</h2>
              <p class="text-lg text-text-muted mb-8 max-w-lg mx-auto">
                Join thousands of developers who've made the switch to faster, lighter, more
                maintainable code.
              </p>
              <div class="flex flex-wrap justify-center gap-4">
                <a
                  href="/docs"
                  class="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 transition-all hover:scale-105"
                >
                  <Icon icon="lucide:book-open" width="20" height="20" />
                  Read the Docs
                </a>
                <a
                  href="/playground"
                  class="inline-flex items-center gap-2 px-8 py-4 bg-bg hover:bg-bg-lighter text-text font-semibold rounded-2xl border border-border transition-all hover:scale-105"
                >
                  <Icon icon="lucide:play" width="20" height="20" />
                  Try Playground
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
