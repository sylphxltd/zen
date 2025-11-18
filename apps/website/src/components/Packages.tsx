import { For } from '@zen/zen';

export function Packages() {
  const corePackages = [
    {
      name: '@zen/signal',
      description: 'Ultra-fast reactive primitives with auto-tracking',
      size: '1.75 KB',
      features: ['signal()', 'computed()', 'effect()', 'Auto-tracking', 'Zero deps'],
    },
    {
      name: '@zen/zen',
      description: 'Fine-grained framework with no virtual DOM',
      size: '<5 KB',
      features: ['JSX', 'Router', 'Components', 'No VDOM', 'Render once'],
    },
  ];

  const integrations = [
    { name: '@zen/signal-react', desc: 'React hooks integration' },
    { name: '@zen/signal-vue', desc: 'Vue 3 Composition API' },
    { name: '@zen/signal-svelte', desc: 'Svelte stores compatibility' },
    { name: '@zen/signal-preact', desc: 'Preact signals integration' },
    { name: '@zen/signal-solid', desc: 'SolidJS primitives' },
  ];

  const utilities = [
    { name: '@zen/signal-patterns', desc: 'Useful patterns (store, async, map)' },
    { name: '@zen/signal-persistent', desc: 'localStorage/sessionStorage sync' },
    { name: '@zen/signal-craft', desc: 'Immutable state updates' },
    { name: '@zen/router', desc: 'Type-safe routing' },
  ];

  return (
    <section id="packages" class="packages">
      <div class="container">
        <h2 class="section-title">Packages</h2>

        <div class="packages-section">
          <h3 class="packages-subtitle">Core Packages</h3>
          <div class="packages-grid-large">
            <For each={corePackages}>
              {(pkg) => (
                <div class="package-card-large">
                  <div class="package-header">
                    <h4 class="package-name">{pkg.name}</h4>
                    <span class="package-size">{pkg.size}</span>
                  </div>
                  <p class="package-description">{pkg.description}</p>
                  <ul class="package-features">
                    <For each={pkg.features}>
                      {(feature) => <li>{feature}</li>}
                    </For>
                  </ul>
                  <pre class="package-install">npm install {pkg.name}</pre>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="packages-section">
          <h3 class="packages-subtitle">Framework Integrations</h3>
          <div class="packages-grid">
            <For each={integrations}>
              {(pkg) => (
                <div class="package-card">
                  <h4 class="package-name">{pkg.name}</h4>
                  <p class="package-description">{pkg.desc}</p>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="packages-section">
          <h3 class="packages-subtitle">Utilities</h3>
          <div class="packages-grid">
            <For each={utilities}>
              {(pkg) => (
                <div class="package-card">
                  <h4 class="package-name">{pkg.name}</h4>
                  <p class="package-description">{pkg.desc}</p>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </section>
  );
}
