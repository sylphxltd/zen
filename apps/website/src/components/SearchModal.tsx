import { computed, signal } from '@rapid/signal';
import { For, Show } from '@rapid/web';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface SearchResult {
  title: string;
  category: string;
  description: string;
  path: string;
}

const MOCK_DOCS = [
  {
    title: 'Getting Started',
    category: 'Installation',
    description: 'Install Rapid and set up your first project',
    path: '/docs#getting-started',
  },
  {
    title: 'signal()',
    category: 'Core API',
    description: 'Create reactive state with signals',
    path: '/docs#signal',
  },
  {
    title: 'computed()',
    category: 'Core API',
    description: 'Derive values from other signals',
    path: '/docs#computed',
  },
  {
    title: 'effect()',
    category: 'Core API',
    description: 'Run side effects when signals change',
    path: '/docs#effect',
  },
  {
    title: 'For Component',
    category: 'Components',
    description: 'Efficiently render lists with fine-grained reactivity',
    path: '/docs#for',
  },
  {
    title: 'Show Component',
    category: 'Components',
    description: 'Conditionally render content',
    path: '/docs#show',
  },
  {
    title: 'Router',
    category: 'Routing',
    description: 'Client-side routing with @rapid/router',
    path: '/docs#router',
  },
  {
    title: 'Dark Mode',
    category: 'Examples',
    description: 'Implement theme switching',
    path: '/docs#dark-mode',
  },
  {
    title: 'Performance Tips',
    category: 'Advanced',
    description: 'Optimize your Rapid applications',
    path: '/docs#performance',
  },
  {
    title: 'TypeScript',
    category: 'Advanced',
    description: 'Full TypeScript support and type inference',
    path: '/docs#typescript',
  },
];

export interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal(props: SearchModalProps) {
  const searchQuery = signal('');

  const results = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();

    if (!query) {
      return MOCK_DOCS;
    }

    const filtered = MOCK_DOCS.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query),
    );
    return filtered;
  });

  const handleSelect = (result: SearchResult) => {
    window.location.hash = result.path;
    props.onClose();
    searchQuery.value = '';
  };

  return (
    <Modal onClose={props.onClose} title="Search Documentation">
      {/* Search input */}
      <div class="mb-6">
        <div class="relative">
          <Icon
            icon="lucide:search"
            width="20"
            height="20"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted"
          />
          <input
            type="text"
            placeholder="Search docs..."
            class="w-full pl-10 pr-4 py-3 bg-bg-lighter dark:bg-bg-dark-lighter border border-border dark:border-border-dark rounded-rapid text-text dark:text-text-dark placeholder-text-muted dark:placeholder-text-dark-muted focus:outline-none focus:border-primary"
            value={searchQuery}
            onInput={(e: Event) => {
              const newValue = (e.target as HTMLInputElement).value;
              searchQuery.value = newValue;
            }}
            ref={(el) => {
              // Auto-focus search input when modal opens
              if (el) {
                setTimeout(() => el.focus(), 100);
              }
            }}
          />
        </div>
      </div>

      {/* Results */}
      <div class="space-y-2">
        <Show when={() => results.value.length > 0}>
          <For each={results}>
            {(result) => (
              <button
                type="button"
                onClick={() => handleSelect(result)}
                class="w-full text-left p-4 rounded-rapid hover:bg-bg-lighter dark:hover:bg-bg-dark-lighter border border-transparent hover:border-border dark:hover:border-border-dark transition-all group"
              >
                <div class="flex items-start gap-3">
                  <Icon
                    icon="lucide:file-text"
                    width="20"
                    height="20"
                    class="text-primary mt-1 flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="text-text dark:text-text-dark font-semibold group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                      <span class="text-xs px-2 py-0.5 bg-bg-lighter dark:bg-bg-dark-lighter text-text-muted dark:text-text-dark-muted rounded">
                        {result.category}
                      </span>
                    </div>
                    <p class="text-sm text-text-muted dark:text-text-dark-muted line-clamp-2">
                      {result.description}
                    </p>
                  </div>
                </div>
              </button>
            )}
          </For>
        </Show>

        <Show when={() => results.value.length === 0}>
          <div class="text-center py-8">
            <Icon
              icon="lucide:search-x"
              width="48"
              height="48"
              class="mx-auto text-text-muted dark:text-text-dark-muted mb-3"
            />
            <p class="text-text-muted dark:text-text-dark-muted">
              {() => `No results found for "${searchQuery.value}"`}
            </p>
          </div>
        </Show>
      </div>
    </Modal>
  );
}
