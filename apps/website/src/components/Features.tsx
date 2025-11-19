import { For } from '@zen/zen';
import { Icon } from './Icon.tsx';

export function Features() {
  const features = [
    {
      icon: 'lucide:zap',
      title: 'Extreme Performance',
      description: '150M+ signal updates/sec. Fine-grained reactivity with zero overhead.',
    },
    {
      icon: 'lucide:feather',
      title: 'Ultra Lightweight',
      description: 'Signal core: 1.75 KB. Full framework: <5 KB. Smaller than most libraries.',
    },
    {
      icon: 'lucide:target',
      title: 'No Virtual DOM',
      description: 'Direct DOM updates. Components render once. Signals handle all changes.',
    },
    {
      icon: 'lucide:wrench',
      title: 'Simple API',
      description: 'signal(), computed(), effect(). Consistent .value API. Auto-tracking.',
    },
    {
      icon: 'lucide:package',
      title: 'Rich Ecosystem',
      description: 'React, Vue, Svelte, Solid integrations. Patterns, persistence, routing.',
    },
    {
      icon: 'lucide:rocket',
      title: 'TypeScript First',
      description: 'Full type inference. Zero runtime overhead. Developer experience first.',
    },
  ];

  return (
    <section class="py-16 px-0 bg-bg">
      <div class="max-w-screen-xl mx-auto px-6">
        <h2 class="text-5xl font-bold text-center mb-16 text-text">Why Zen?</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <For each={features}>
            {(feature) => (
              <div class="bg-bg-light border border-border rounded-zen p-8 hover:border-primary transition-colors">
                <div class="mb-4">
                  <Icon icon={feature.icon} width="48" height="48" class="text-primary" />
                </div>
                <h3 class="text-xl font-semibold mb-3 text-text">{feature.title}</h3>
                <p class="text-text-muted leading-relaxed">{feature.description}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
