import { signal } from '@zen/signal';
import { Link } from '@zen/router';
import { Show } from '@zen/zen';
import { Icon } from './Icon.tsx';
import { SearchModal } from './SearchModal.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

export function Header() {
  const isSearchOpen = signal(false);

  return (
    <>
      <header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border dark:bg-bg/80 dark:border-border">
        <div class="max-w-screen-xl mx-auto px-6">
          <nav class="flex items-center justify-between h-16">
            <Link
              href="/"
              class="flex items-center gap-2 text-xl font-bold text-text hover:text-primary transition-colors"
            >
              <Icon icon="lucide:zap" width="24" height="24" class="text-primary" />
              <span>Zen</span>
            </Link>
            <div class="flex items-center gap-6">
              <Link href="/" class="text-text-muted hover:text-text transition-colors">
                Home
              </Link>
              <Link href="/docs" class="text-text-muted hover:text-text transition-colors">
                Docs
              </Link>
              <Link href="/playground" class="text-text-muted hover:text-text transition-colors">
                Playground
              </Link>
              <a
                href="https://github.com/SylphxAI/zen"
                target="_blank"
                class="text-text-muted hover:text-text transition-colors"
                rel="noreferrer"
              >
                GitHub
              </a>
              <button
                type="button"
                onClick={() => {
                  isSearchOpen.value = true;
                }}
                class="flex items-center gap-2 px-3 py-1.5 bg-bg-lighter dark:bg-bg-dark-lighter border border-border dark:border-border-dark rounded-zen text-text-muted dark:text-text-dark-muted hover:border-primary transition-colors"
                aria-label="Search documentation"
              >
                <Icon icon="lucide:search" width="16" height="16" />
                <span class="text-sm">Search</span>
                <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-bg dark:bg-bg-dark border border-border dark:border-border-dark rounded">
                  ⌘K
                </kbd>
              </button>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      <Show when={() => isSearchOpen.value}>
        {() => (
          <SearchModal
            onClose={() => {
              isSearchOpen.value = false;
            }}
          />
        )}
      </Show>
    </>
  );
}
