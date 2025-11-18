import { For } from '@zen/zen';

export function Features() {
  const features = [
    {
      icon: '⚡',
      title: 'Extreme Performance',
      description: '150M+ signal updates/sec. Fine-grained reactivity with zero overhead.',
    },
    {
      icon: '🪶',
      title: 'Ultra Lightweight',
      description: 'Signal core: 1.75 KB. Full framework: <5 KB. Smaller than most libraries.',
    },
    {
      icon: '🎯',
      title: 'No Virtual DOM',
      description: 'Direct DOM updates. Components render once. Signals handle all changes.',
    },
    {
      icon: '🔧',
      title: 'Simple API',
      description: 'signal(), computed(), effect(). Consistent .value API. Auto-tracking.',
    },
    {
      icon: '📦',
      title: 'Rich Ecosystem',
      description: 'React, Vue, Svelte, Solid integrations. Patterns, persistence, routing.',
    },
    {
      icon: '🚀',
      title: 'TypeScript First',
      description: 'Full type inference. Zero runtime overhead. Developer experience first.',
    },
  ];

  return (
    <section class="features">
      <div class="container">
        <h2 class="section-title">Why Zen?</h2>
        <div class="features-grid">
          <For each={features}>
            {(feature) => (
              <div class="feature-card">
                <div class="feature-icon">{feature.icon}</div>
                <h3 class="feature-title">{feature.title}</h3>
                <p class="feature-description">{feature.description}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
