import { For } from '@rapid/web';
import { Icon } from './Icon.tsx';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const packages = [
    { label: '@rapid/signal', href: '/docs' },
    { label: '@rapid/web', href: '/docs' },
    { label: '@rapid/tui', href: '/docs' },
    { label: '@rapid/router', href: '/docs' },
  ];

  const resources = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Examples', href: '/examples' },
    { label: 'Playground', href: '/playground' },
    { label: 'Migration Guide', href: '/migration' },
  ];

  const community = [
    { label: 'GitHub', href: 'https://github.com/SylphxAI/rapid', external: true },
    { label: 'Issues', href: 'https://github.com/SylphxAI/rapid/issues', external: true },
    {
      label: 'Discussions',
      href: 'https://github.com/SylphxAI/rapid/discussions',
      external: true,
    },
  ];

  return (
    <footer class="bg-bg-light border-t border-border">
      <div class="max-w-6xl mx-auto px-6 py-16">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-2.5 mb-4">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Icon icon="lucide:zap" width="18" height="18" class="text-white" />
              </div>
              <span class="text-xl font-bold text-text">Rapid</span>
            </div>
            <p class="text-text-muted text-sm mb-4 max-w-xs">
              Ultra-fast reactive primitives and fine-grained framework for building modern web
              applications.
            </p>
            <div class="flex gap-2">
              <span class="badge badge-primary text-xs">1.75 KB</span>
              <span class="badge badge-success text-xs">150M+ ops/sec</span>
            </div>
          </div>

          {/* Packages */}
          <div>
            <h4 class="text-sm font-semibold text-text mb-4 uppercase tracking-wider">Packages</h4>
            <ul class="space-y-2.5">
              <For each={packages}>
                {(link) => (
                  <li>
                    <a
                      href={link.href}
                      class="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 class="text-sm font-semibold text-text mb-4 uppercase tracking-wider">Resources</h4>
            <ul class="space-y-2.5">
              <For each={resources}>
                {(link) => (
                  <li>
                    <a
                      href={link.href}
                      class="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 class="text-sm font-semibold text-text mb-4 uppercase tracking-wider">Community</h4>
            <ul class="space-y-2.5">
              <For each={community}>
                {(link) => (
                  <li>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noreferrer' : undefined}
                      class="text-sm text-text-muted hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      {link.external && (
                        <Icon icon="lucide:share-2" width="12" height="12" class="opacity-50" />
                      )}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div class="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-sm text-text-muted">© {currentYear} Rapid. MIT License.</p>
          <p class="text-sm text-text-subtle">
            Built with <span class="text-primary font-medium">@rapid/web</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
