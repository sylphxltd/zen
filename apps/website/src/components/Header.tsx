import { Link } from '@rapid/router';
import { signal } from '@rapid/signal';
import { For, Show } from '@rapid/web';
import { Icon } from './Icon.tsx';
import { SearchModal } from './SearchModal.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

export function Header() {
  const isSearchOpen = signal(false);
  const isMobileMenuOpen = signal(false);

  const navLinks = [
    { href: '/docs', label: 'Docs' },
    { href: '/examples', label: 'Examples' },
    { href: '/playground', label: 'Playground' },
    { href: '/migration', label: 'Migration' },
  ];

  return (
    <>
      <header class="sticky top-0 z-50 glass border-b border-border/50">
        <div class="max-w-6xl mx-auto px-6">
          <nav class="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" class="flex items-center gap-2.5 group">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
                <Icon icon="lucide:zap" width="18" height="18" class="text-white" />
              </div>
              <span class="text-xl font-bold text-text">Rapid</span>
            </Link>

            {/* Desktop Navigation */}
            <div class="hidden md:flex items-center gap-1">
              <For each={navLinks}>
                {(link) => (
                  <Link
                    href={link.href}
                    class="px-4 py-2 text-text-muted hover:text-text hover:bg-bg-lighter rounded-lg transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                )}
              </For>
            </div>

            {/* Right Actions */}
            <div class="flex items-center gap-2">
              {/* Search Button */}
              <button
                type="button"
                onClick={() => {
                  isSearchOpen.value = true;
                }}
                class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-bg-lighter border border-border rounded-lg text-text-muted hover:text-text hover:border-primary/50 transition-all text-sm"
                aria-label="Search documentation"
              >
                <Icon icon="lucide:search" width="14" height="14" />
                <span>Search</span>
                <kbd class="hidden lg:inline-block px-1.5 py-0.5 text-2xs bg-bg border border-border rounded font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* GitHub Link */}
              <a
                href="https://github.com/SylphxAI/rapid"
                target="_blank"
                rel="noreferrer"
                class="p-2 text-text-muted hover:text-text hover:bg-bg-lighter rounded-lg transition-colors"
                aria-label="GitHub"
              >
                <Icon icon="lucide:github" width="20" height="20" />
              </a>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => {
                  isMobileMenuOpen.value = !isMobileMenuOpen.value;
                }}
                class="md:hidden p-2 text-text-muted hover:text-text hover:bg-bg-lighter rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Show
                  when={() => isMobileMenuOpen.value}
                  fallback={<Icon icon="lucide:menu" width="20" height="20" />}
                >
                  <Icon icon="lucide:x" width="20" height="20" />
                </Show>
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Menu */}
        <Show when={() => isMobileMenuOpen.value}>
          <div class="md:hidden border-t border-border bg-bg-light animate-fade-in">
            <div class="px-4 py-3 space-y-1">
              <For each={navLinks}>
                {(link) => (
                  <Link
                    href={link.href}
                    class="block px-4 py-3 text-text-muted hover:text-text hover:bg-bg-lighter rounded-lg transition-colors font-medium"
                    onClick={() => {
                      isMobileMenuOpen.value = false;
                    }}
                  >
                    {link.label}
                  </Link>
                )}
              </For>
              <button
                type="button"
                onClick={() => {
                  isSearchOpen.value = true;
                  isMobileMenuOpen.value = false;
                }}
                class="w-full flex items-center gap-2 px-4 py-3 text-text-muted hover:text-text hover:bg-bg-lighter rounded-lg transition-colors font-medium"
              >
                <Icon icon="lucide:search" width="18" height="18" />
                Search
              </button>
            </div>
          </div>
        </Show>
      </header>

      <Show when={() => isSearchOpen.value}>
        <SearchModal
          onClose={() => {
            isSearchOpen.value = false;
          }}
        />
      </Show>
    </>
  );
}
