import { computed, effect, signal } from '@rapid/signal';
import { For } from '@rapid/web';
import { Icon } from '../components/Icon';
import apiReferenceMd from '../docs/api-reference.md?raw';
import coreConceptsMd from '../docs/core-concepts.md?raw';
import gettingStartedMd from '../docs/getting-started.md?raw';
import { renderMarkdown } from '../utils/markdown';

interface DocSection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

const sections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'lucide:rocket',
    content: gettingStartedMd,
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: 'lucide:book-open',
    content: coreConceptsMd,
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: 'lucide:code-2',
    content: apiReferenceMd,
  },
];

export function NewDocs() {
  const activeSection = signal('getting-started');
  const renderedContent = signal('');

  const currentSection = computed(() => {
    return sections.find((s) => s.id === activeSection.value) || sections[0];
  });

  effect(() => {
    const section = currentSection.value;

    renderMarkdown(section.content).then((html) => {
      renderedContent.value = html;
    });
  });

  return (
    <div class="min-h-screen bg-bg">
      {/* Hero */}
      <section class="py-12 px-6 bg-gradient-hero border-b border-border">
        <div class="max-w-7xl mx-auto">
          <span class="badge badge-primary mb-4">Learn Rapid</span>
          <h1 class="heading-2 text-text mb-2">Documentation</h1>
          <p class="text-lg text-text-muted">Learn how to build reactive UIs with Rapid</p>
        </div>
      </section>

      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside class="col-span-12 lg:col-span-3">
            <nav class="sticky top-24 space-y-2">
              <For each={sections}>
                {(section) => (
                  <button
                    type="button"
                    onClick={() => {
                      activeSection.value = section.id;
                    }}
                    class={
                      activeSection.value === section.id
                        ? 'w-full flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-medium transition-all'
                        : 'w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text hover:bg-bg-lighter rounded-xl font-medium transition-all'
                    }
                  >
                    <Icon icon={section.icon} width="20" height="20" />
                    <span>{section.title}</span>
                  </button>
                )}
              </For>

              {/* Quick Links */}
              <div class="pt-6 mt-6 border-t border-border">
                <h4 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                  Resources
                </h4>
                <div class="space-y-2">
                  <a
                    href="/playground"
                    class="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
                  >
                    <Icon icon="lucide:play" width="16" height="16" />
                    Playground
                  </a>
                  <a
                    href="/examples"
                    class="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
                  >
                    <Icon icon="lucide:code" width="16" height="16" />
                    Examples
                  </a>
                  <a
                    href="https://github.com/SylphxAI/rapid"
                    target="_blank"
                    rel="noreferrer"
                    class="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors"
                  >
                    <Icon icon="lucide:github" width="16" height="16" />
                    GitHub
                  </a>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main class="col-span-12 lg:col-span-9">
            <div class="card">
              <article
                class="prose prose-invert max-w-none
                  prose-headings:text-text
                  prose-p:text-text-muted
                  prose-strong:text-text
                  prose-code:text-primary prose-code:bg-bg-lighter prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-bg-lighter prose-pre:border prose-pre:border-border
                  prose-a:text-primary hover:prose-a:text-primary-dark
                  prose-li:text-text-muted
                  animate-fade-in"
                innerHTML={renderedContent}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
