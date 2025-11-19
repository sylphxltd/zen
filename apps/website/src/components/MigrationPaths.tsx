import { For, signal } from '@zen/zen';

export function MigrationPaths() {
  const activeTab = signal('react');

  const frameworks = [
    { id: 'react', name: 'React', icon: '⚛️' },
    { id: 'vue', name: 'Vue', icon: '💚' },
    { id: 'solid', name: 'Solid', icon: '🔷' },
    { id: 'svelte', name: 'Svelte', icon: '🧡' },
  ];

  const migrationSteps = {
    react: {
      title: 'Seamless Migration from React',
      subtitle: 'React developers will feel right at home',
      steps: [
        {
          step: 1,
          title: 'Start with Signal (No Code Changes)',
          code: `// Add @zen/signal to existing React project
import { useZen } from '@zen/signal-react'
import { signal } from '@zen/signal'

// Create global signal
const count = signal(0)

// Use in any React component
function Counter() {
  const value = useZen(count)
  return (
    <button onClick={() => count.value++}>
      Count: {value}
    </button>
  )
}`,
          benefit: '✅ Zero rewrites, instant 1.75KB Signal',
        },
        {
          step: 2,
          title: 'Gradually Replace Components',
          code: `// React and Zen components coexist
<ReactApp>
  <ReactHeader />
  <ZenCounter />  {/* New components use Zen */}
  <ReactFooter />
</ReactApp>

// Slowly migrate complex components to Zen
// Enjoy smaller bundles and faster performance`,
          benefit: '✅ Incremental migration, zero risk',
        },
        {
          step: 3,
          title: 'Full Migration (Optional)',
          code: `// When ready, go all-in with Zen
import { render, signal } from '@zen/zen'

function App() {
  const count = signal(0)

  return (
    <div>
      <h1>My App</h1>
      <button onClick={() => count.value++}>
        {count.value}
      </button>
    </div>
  )
}

render(() => <App />, document.getElementById('app'))`,
          benefit: '✅ Bundle size: 42KB → <5KB',
        },
      ],
    },
    vue: {
      title: 'Seamless Migration from Vue',
      subtitle: 'Vue 3 Composition API users will feel instantly familiar',
      steps: [
        {
          step: 1,
          title: 'Nearly Identical API',
          code: `// Vue 3 Composition API
import { ref, computed } from 'vue'
const count = ref(0)
const doubled = computed(() => count.value * 2)

// Zen Signal - Exactly the same!
import { signal, computed } from '@zen/signal'
const count = signal(0)
const doubled = computed(() => count.value * 2)`,
          benefit: '✅ Zero learning curve',
        },
        {
          step: 2,
          title: 'Use Zen Signal in Vue',
          code: `// Use Zen Signal in Vue components
import { useZen } from '@zen/signal-vue'
import { signal } from '@zen/signal'

const globalState = signal({ user: null })

export default {
  setup() {
    const state = useZen(globalState)
    return { state }
  }
}`,
          benefit: '✅ Better global state management',
        },
        {
          step: 3,
          title: 'Migrate to Zen Framework',
          code: `// Zen syntax similar to Vue 3
import { signal, computed } from '@zen/zen'

function Counter() {
  const count = signal(0)
  const doubled = computed(() => count.value * 2)

  return (
    <div>
      <p>Count: {count.value}</p>
      <p>Doubled: {doubled.value}</p>
      <button onClick={() => count.value++}>+</button>
    </div>
  )
}`,
          benefit: '✅ 34KB → <5KB',
        },
      ],
    },
    solid: {
      title: 'Migration from Solid',
      subtitle: 'Solid users will find Zen even simpler',
      steps: [
        {
          step: 1,
          title: 'Unified .value API',
          code: `// Solid - Remember when to use ()
const [count, setCount] = createSignal(0)
const doubled = createMemo(() => count() * 2)
console.log(count())  // Read with ()
setCount(1)           // Write with setter

// Zen - Unified .value
const count = signal(0)
const doubled = computed(() => count.value * 2)
console.log(count.value)  // Read with .value
count.value = 1           // Write with .value`,
          benefit: '✅ More consistent API',
        },
        {
          step: 2,
          title: 'Smaller Bundle',
          code: `// Solid: 7KB (good, but Zen is smaller)
// Zen: <5KB Signal + Framework

// Similar performance, but lighter weight
// And no compiler setup needed`,
          benefit: '✅ 7KB → <5KB',
        },
      ],
    },
    svelte: {
      title: 'Migration from Svelte',
      subtitle: 'Svelte users will love not needing a compiler',
      steps: [
        {
          step: 1,
          title: 'Svelte Requires Compiler',
          code: `// Svelte - Needs special compiler
let count = 0
$: doubled = count * 2  // Special syntax

// Zen - Pure JavaScript/TypeScript
const count = signal(0)
const doubled = computed(() => count.value * 2)`,
          benefit: '✅ Standard JS, works with any tool',
        },
        {
          step: 2,
          title: 'Use Zen Signal in Svelte',
          code: `// Use Zen Signal for global state management
import { toStore } from '@zen/signal-svelte'
import { signal } from '@zen/signal'

const count = signal(0)
const countStore = toStore(count)

// Use in Svelte components
$: value = $countStore`,
          benefit: '✅ Better global state',
        },
      ],
    },
  };

  return (
    <section class="py-16 px-0 bg-bg">
      <div class="max-w-screen-xl mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-text mb-4">Seamless Migration</h2>
          <p class="text-xl text-text-muted max-w-2xl mx-auto">
            Migrate to Zen from any framework, or use Zen Signal standalone
          </p>
        </div>

        {/* Framework tabs */}
        <div class="flex flex-wrap gap-3 justify-center mb-8">
          <For each={frameworks}>
            {(fw) => (
              <button
                type="button"
                class={
                  activeTab.value === fw.id
                    ? 'px-6 py-3 bg-primary text-white rounded-zen font-medium transition-all shadow-zen'
                    : 'px-6 py-3 bg-bg-light hover:bg-bg-lighter text-text-muted hover:text-text border border-border rounded-zen font-medium transition-all'
                }
                onClick={() => {
                  activeTab.value = fw.id;
                }}
              >
                <span class="mr-2">{fw.icon}</span>
                {fw.name}
              </button>
            )}
          </For>
        </div>

        {/* Migration content */}
        <div class="bg-bg-light border border-border rounded-zen p-8">
          <div class="text-center mb-8">
            <h3 class="text-3xl font-bold text-text mb-2">
              {migrationSteps[activeTab.value]?.title}
            </h3>
            <p class="text-lg text-text-muted">{migrationSteps[activeTab.value]?.subtitle}</p>
          </div>

          <div class="space-y-8">
            <For each={migrationSteps[activeTab.value]?.steps}>
              {(step) => (
                <div class="bg-bg border border-border rounded-zen overflow-hidden">
                  <div class="bg-bg-lighter border-b border-border px-6 py-4">
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-3 mb-2">
                          <span class="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full font-bold">
                            {step.step}
                          </span>
                          <h4 class="text-xl font-semibold text-text">{step.title}</h4>
                        </div>
                        <p class="text-success font-medium ml-11">{step.benefit}</p>
                      </div>
                    </div>
                  </div>
                  <pre class="p-6 text-sm text-text-muted font-mono overflow-x-auto">
                    {step.code}
                  </pre>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* CTA */}
        <div class="mt-12 text-center">
          <a
            href="/docs/migration"
            class="inline-block px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-zen shadow-zen transition-all hover:scale-105"
          >
            View Full Migration Guide →
          </a>
        </div>
      </div>
    </section>
  );
}
