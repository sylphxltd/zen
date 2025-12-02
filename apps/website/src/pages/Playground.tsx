import * as Babel from '@babel/standalone';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import * as ZenSignal from '@zen/signal';
import { effect } from '@zen/signal';
import { For, Show, computed, signal } from '@zen/web';
import * as Zen from '@zen/web';
import { Fragment, jsx } from '@zen/web/jsx-runtime';
import { Icon } from '../components/Icon.tsx';
import { categories, examples } from '../data/examples.ts';

export function Playground() {
  const templates = examples.reduce(
    (acc, ex) => {
      acc[ex.id] = ex.code;
      return acc;
    },
    {} as Record<string, string>,
  );

  const selectedCategory = signal<string>('basic');
  const selectedExampleId = signal<string>('counter');
  const code = signal(templates.counter || '');

  const filteredExamples = computed(() =>
    examples.filter((ex) => ex.category === selectedCategory.value),
  );

  const selectedExample = computed(
    () => examples.find((ex) => ex.id === selectedExampleId.value) || examples[0],
  );
  const error = signal('');
  const executeTime = signal(0);
  const renderTime = signal(0);
  const opsPerSecond = signal(0);

  let editorView: EditorView | null = null;
  let autoRunTimer: number | null = null;

  const handleCategoryChange = (categoryId: string) => {
    selectedCategory.value = categoryId;
    const firstExample = examples.find((ex) => ex.category === categoryId);
    if (firstExample) {
      selectedExampleId.value = firstExample.id;
      loadExample(firstExample.id);
    }
  };

  const loadExample = (exampleId: string) => {
    selectedExampleId.value = exampleId;
    const newCode = templates[exampleId] || templates.counter;
    code.value = newCode;

    if (editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: newCode },
      });
    }
  };

  Zen.effect(() => {
    const _currentCode = code.value;

    if (autoRunTimer !== null) {
      clearTimeout(autoRunTimer);
    }

    autoRunTimer = window.setTimeout(() => {
      runCode();
    }, 1000);

    return () => {
      if (autoRunTimer !== null) {
        clearTimeout(autoRunTimer);
      }
    };
  });

  const initEditor = (container: HTMLDivElement) => {
    const startState = EditorState.create({
      doc: code.value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
        javascript({ jsx: true, typescript: true }),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            code.value = update.state.doc.toString();
          }
        }),
      ],
    });

    editorView = new EditorView({
      state: startState,
      parent: container,
    });
  };

  const runCode = () => {
    const startTime = performance.now();
    try {
      const previewEl = document.getElementById('preview');
      if (!previewEl) return;

      const codeWithoutImports = code.value.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');

      const transformed = Babel.transform(codeWithoutImports, {
        presets: [
          [
            'react',
            {
              runtime: 'classic',
              pragma: 'jsx',
              pragmaFrag: 'Fragment',
            },
          ],
        ],
        filename: 'playground.tsx',
      });

      // biome-ignore lint/suspicious/noExplicitAny: JSX createElement requires dynamic types
      const createElement = (
        type: unknown,
        props: Record<string, unknown> | null,
        ...children: unknown[]
      ) => {
        const allProps: Record<string, unknown> = props || {};
        if (children.length > 0) {
          allProps.children = children.length === 1 ? children[0] : children;
        }
        // biome-ignore lint/suspicious/noExplicitAny: JSX runtime accepts any component type
        return jsx(type as any, allProps);
      };

      const zenContext = {
        ...Zen,
        ...ZenSignal,
        jsx: createElement,
        Fragment,
        document,
        console,
      };

      const execStart = performance.now();
      const wrappedCode = `
        ${transformed.code}
        return typeof app !== 'undefined' ? app : null;
      `;
      const fn = new Function(...Object.keys(zenContext), wrappedCode);
      let result = fn(...Object.values(zenContext));
      const execEnd = performance.now();

      if (previewEl.firstChild) {
        Zen.disposeNode(previewEl.firstChild);
      }

      previewEl.innerHTML = '';

      // Handle ComponentDescriptor pattern (ADR-011)
      // When jsx(Component, props) is called, it returns a descriptor object
      // that needs to be executed to get the actual DOM node
      if (result && typeof result === 'object' && '_jsx' in result && result._jsx === true) {
        result = Zen.executeDescriptor(result);
      }

      if (result && result instanceof Node) {
        previewEl.appendChild(result);
      }

      error.value = '';

      executeTime.value = execEnd - execStart;
      renderTime.value = execEnd - startTime;

      const iterations = 1000;
      const benchStart = performance.now();
      const testSignal = signal(0);
      for (let i = 0; i < iterations; i++) {
        testSignal.value = i;
      }
      const benchEnd = performance.now();
      const timePerOp = (benchEnd - benchStart) / iterations;
      opsPerSecond.value = Math.round(1000 / timePerOp);
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Unknown error';
    }
  };

  return (
    <div class="min-h-screen bg-bg">
      {/* Hero */}
      <section class="py-8 px-6 bg-gradient-hero border-b border-border">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 class="heading-2 text-text mb-2">Interactive Playground</h1>
              <p class="text-text-muted">Browse examples, edit code, and see instant results</p>
            </div>
            <Show when={() => executeTime.value > 0}>
              <div class="flex gap-4">
                <div class="text-center px-4 py-2 bg-bg-light border border-border rounded-xl">
                  <div class="text-xs text-text-muted">Execute</div>
                  <div class="font-bold text-success">{executeTime.value.toFixed(2)}ms</div>
                </div>
                <div class="text-center px-4 py-2 bg-bg-light border border-border rounded-xl">
                  <div class="text-xs text-text-muted">Total</div>
                  <div class="font-bold text-primary">{renderTime.value.toFixed(2)}ms</div>
                </div>
                <div class="text-center px-4 py-2 bg-bg-light border border-border rounded-xl">
                  <div class="text-xs text-text-muted">Ops/sec</div>
                  <div class="font-bold text-secondary">{opsPerSecond.value.toLocaleString()}</div>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </section>

      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside class="col-span-12 lg:col-span-3 space-y-6">
            {/* Categories */}
            <div class="bg-bg-light border border-border rounded-2xl p-5">
              <h3 class="text-xs font-bold text-text-subtle uppercase tracking-widest mb-4">
                Categories
              </h3>
              <nav class="flex flex-wrap gap-2">
                <For each={categories}>
                  {(category) => (
                    <button
                      type="button"
                      class={
                        selectedCategory.value === category.id
                          ? 'flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm shadow-md transition-all'
                          : 'flex items-center gap-2 px-4 py-2 bg-bg-lighter text-text-muted hover:text-text hover:bg-bg-dark border border-border rounded-lg text-sm transition-all'
                      }
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      <Icon icon={category.icon} width="16" height="16" />
                      {category.name}
                    </button>
                  )}
                </For>
              </nav>
            </div>

            {/* Examples List */}
            <div class="bg-bg-light border border-border rounded-2xl p-5">
              <h3 class="text-xs font-bold text-text-subtle uppercase tracking-widest mb-4">
                Examples
              </h3>
              <div class="space-y-2">
                <For each={filteredExamples}>
                  {(example) => (
                    <button
                      type="button"
                      class={
                        selectedExampleId.value === example.id
                          ? 'w-full text-left p-3 bg-bg-lighter border-2 border-primary rounded-xl transition-all shadow-sm'
                          : 'w-full text-left p-3 bg-bg hover:bg-bg-lighter border border-border hover:border-border-light rounded-xl transition-all'
                      }
                      onClick={() => loadExample(example.id)}
                    >
                      <div class="flex items-start gap-3">
                        <div
                          class={
                            selectedExampleId.value === example.id
                              ? 'flex-shrink-0 w-9 h-9 flex items-center justify-center bg-primary text-white rounded-lg shadow-sm'
                              : 'flex-shrink-0 w-9 h-9 flex items-center justify-center bg-bg-lighter text-text-muted rounded-lg border border-border'
                          }
                        >
                          <Icon icon={example.icon} width="18" height="18" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="text-sm font-semibold text-text">{example.title}</h4>
                          <p class="text-xs text-text-muted mt-0.5 line-clamp-2">
                            {example.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main class="col-span-12 lg:col-span-9 space-y-5">
            {/* Current Example Header */}
            <div class="bg-bg-light border border-border rounded-2xl p-5 flex items-center gap-4">
              <div class="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white rounded-xl shadow-lg">
                <Icon icon={selectedExample.value.icon} width="28" height="28" />
              </div>
              <div class="flex-1">
                <h2 class="text-xl font-bold text-text">{selectedExample.value.title}</h2>
                <p class="text-sm text-text-muted mt-1">{selectedExample.value.description}</p>
              </div>
            </div>

            <Show when={() => error.value !== ''}>
              <div class="p-4 bg-error/10 border border-error/30 rounded-xl text-error font-mono text-sm flex items-start gap-3">
                <Icon icon="lucide:x" width="18" height="18" class="flex-shrink-0 mt-0.5" />
                <div>
                  <strong class="block mb-1">Error</strong>
                  {error}
                </div>
              </div>
            </Show>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Editor */}
              <div class="bg-bg-light border border-border rounded-2xl overflow-hidden flex flex-col">
                <div class="flex items-center justify-between bg-bg-lighter border-b border-border px-5 py-3">
                  <div class="flex items-center gap-2">
                    <div class="flex gap-1.5">
                      <div class="w-3 h-3 rounded-full bg-error/60" />
                      <div class="w-3 h-3 rounded-full bg-warning/60" />
                      <div class="w-3 h-3 rounded-full bg-success/60" />
                    </div>
                    <span class="font-medium text-text text-sm ml-2">Code Editor</span>
                  </div>
                  <button
                    type="button"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text bg-bg hover:bg-bg-dark border border-border rounded-lg transition-all"
                    onClick={() => {
                      code.value = selectedExample.value.code;
                      if (editorView) {
                        editorView.dispatch({
                          changes: {
                            from: 0,
                            to: editorView.state.doc.length,
                            insert: selectedExample.value.code,
                          },
                        });
                      }
                    }}
                  >
                    <Icon icon="lucide:rotate-ccw" width="12" height="12" />
                    Reset
                  </button>
                </div>
                <div
                  class="flex-1 min-h-[480px]"
                  ref={(el) => {
                    if (el && !editorView) {
                      initEditor(el as HTMLDivElement);
                    }
                  }}
                />
              </div>

              {/* Preview */}
              <div class="bg-bg-light border border-border rounded-2xl overflow-hidden flex flex-col">
                <div class="flex items-center justify-between bg-bg-lighter border-b border-border px-5 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span class="font-medium text-text text-sm">Live Preview</span>
                  </div>
                  <button
                    type="button"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text bg-bg hover:bg-bg-dark border border-border rounded-lg transition-all"
                    onClick={() => {
                      const el = document.getElementById('preview');
                      if (el) el.innerHTML = '';
                    }}
                  >
                    <Icon icon="lucide:x" width="12" height="12" />
                    Clear
                  </button>
                </div>
                <div id="preview" class="flex-1 min-h-[480px] p-5 overflow-auto bg-bg" />
              </div>
            </div>

            {/* Tips */}
            <div class="bg-bg-light border border-border rounded-2xl p-5">
              <h3 class="font-semibold text-text mb-4 flex items-center gap-2">
                <div class="w-8 h-8 flex items-center justify-center bg-warning/10 text-warning rounded-lg">
                  <Icon icon="lucide:lightbulb" width="18" height="18" />
                </div>
                Playground Tips
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="flex items-start gap-3 p-3 bg-bg rounded-xl">
                  <span class="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-md text-xs font-bold">
                    1
                  </span>
                  <span class="text-sm text-text-muted">
                    Create a variable called{' '}
                    <code class="px-1.5 py-0.5 bg-bg-lighter border border-border rounded text-primary text-xs font-mono">
                      app
                    </code>{' '}
                    with your component
                  </span>
                </div>
                <div class="flex items-start gap-3 p-3 bg-bg rounded-xl">
                  <span class="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-md text-xs font-bold">
                    2
                  </span>
                  <span class="text-sm text-text-muted">
                    Code runs automatically 1 second after you stop typing
                  </span>
                </div>
                <div class="flex items-start gap-3 p-3 bg-bg rounded-xl">
                  <span class="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-md text-xs font-bold">
                    3
                  </span>
                  <span class="text-sm text-text-muted">
                    Errors won't clear your preview - previous version stays visible
                  </span>
                </div>
                <div class="flex items-start gap-3 p-3 bg-bg rounded-xl">
                  <span class="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-md text-xs font-bold">
                    4
                  </span>
                  <span class="text-sm text-text-muted">
                    All Zen features: signal, computed, effect, Show, For
                  </span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
