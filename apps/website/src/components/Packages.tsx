import { For } from '@rapid/web';

export function Packages() {
  const corePackages = [
    {
      name: '@rapid/signal',
      description: 'Ultra-fast reactive primitives with auto-tracking',
      size: '1.75 KB',
      features: ['signal()', 'computed()', 'effect()', 'Auto-tracking', 'Zero deps'],
    },
    {
      name: '@rapid/web',
      description: 'Fine-grained framework with no virtual DOM',
      size: '<5 KB',
      features: ['JSX', 'Router', 'Components', 'No VDOM', 'Render once'],
    },
  ];

  const integrations = [
    { name: '@rapid/signal-react', desc: 'React hooks integration' },
    { name: '@rapid/signal-vue', desc: 'Vue 3 Composition API' },
    { name: '@rapid/signal-svelte', desc: 'Svelte stores compatibility' },
    { name: '@rapid/signal-preact', desc: 'Preact signals integration' },
    { name: '@rapid/signal-solid', desc: 'SolidJS primitives' },
  ];

  const utilities = [
    { name: '@rapid/signal-patterns', desc: 'Useful patterns (store, async, map)' },
    { name: '@rapid/signal-persistent', desc: 'localStorage/sessionStorage sync' },
    { name: '@rapid/signal-craft', desc: 'Immutable state updates' },
    { name: '@rapid/router', desc: 'Type-safe routing' },
  ];

  return (
    <section id="packages" class="py-16 px-0 bg-bg">
      <div class="max-w-screen-xl mx-auto px-6">
        <h2 class="text-5xl font-bold text-center mb-16 text-text">Packages</h2>

        <div class="mb-16">
          <h3 class="text-3xl font-semibold mb-8 text-text">Core Packages</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <For each={corePackages}>
              {(pkg) => (
                <div class="bg-bg-light border border-border rounded-rapid p-8 hover:border-primary transition-colors">
                  <div class="flex items-start justify-between mb-4">
                    <h4 class="text-xl font-semibold text-primary">{pkg.name}</h4>
                    <span class="px-3 py-1 bg-bg border border-border rounded-full text-xs text-primary">
                      {pkg.size}
                    </span>
                  </div>
                  <p class="text-text-muted mb-4">{pkg.description}</p>
                  <ul class="space-y-2 mb-6">
                    <For each={pkg.features}>
                      {(feature) => (
                        <li class="text-text text-sm flex items-center gap-2">
                          <span class="text-success">✓</span>
                          {feature}
                        </li>
                      )}
                    </For>
                  </ul>
                  <pre class="bg-bg border border-border rounded-rapid p-3 text-sm text-primary font-mono overflow-x-auto">
                    npm install {pkg.name}
                  </pre>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="mb-16">
          <h3 class="text-3xl font-semibold mb-8 text-text">Framework Integrations</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <For each={integrations}>
              {(pkg) => (
                <div class="bg-bg-light border border-border rounded-rapid p-6 hover:border-primary transition-colors">
                  <h4 class="text-lg font-semibold text-primary mb-2">{pkg.name}</h4>
                  <p class="text-text-muted text-sm">{pkg.desc}</p>
                </div>
              )}
            </For>
          </div>
        </div>

        <div>
          <h3 class="text-3xl font-semibold mb-8 text-text">Utilities</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <For each={utilities}>
              {(pkg) => (
                <div class="bg-bg-light border border-border rounded-rapid p-6 hover:border-primary transition-colors">
                  <h4 class="text-lg font-semibold text-primary mb-2">{pkg.name}</h4>
                  <p class="text-text-muted text-sm">{pkg.desc}</p>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </section>
  );
}
