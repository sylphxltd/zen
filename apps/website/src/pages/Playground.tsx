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
import * as ZenSignal from '@rapid/signal';
import { For, Show, computed, signal } from '@rapid/web';
import * as Rapid from '@rapid/web';
import { Fragment, jsx } from '@rapid/web/jsx-runtime';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { Icon } from '../components/Icon.tsx';
import { examples } from '../data/examples.ts';

// CSS for reactivity highlighting
const HIGHLIGHT_CSS = `
  .rapid-updated {
    animation: rapid-highlight 0.5s ease-out;
  }
  @keyframes rapid-highlight {
    0% { outline: 2px solid #22d3ee; outline-offset: 2px; background-color: rgba(34, 211, 238, 0.1); }
    100% { outline: 2px solid transparent; outline-offset: 2px; background-color: transparent; }
  }
`;

export function Playground() {
  // Inject highlight CSS
  if (typeof document !== 'undefined' && !document.getElementById('rapid-highlight-style')) {
    const style = document.createElement('style');
    style.id = 'rapid-highlight-style';
    style.textContent = HIGHLIGHT_CSS;
    document.head.appendChild(style);
  }

  // State
  const code = signal(getInitialCode());
  const error = signal('');
  const domUpdates = signal(0);
  const signalChanges = signal(0);
  const lastRunTime = signal(0);
  const showExamples = signal(false);
  const selectedExample = signal(examples[0]);

  let editorView: EditorView | null = null;
  let debounceTimer: number | null = null;

  // Get initial code from URL or default
  function getInitialCode(): string {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#code=')) {
        try {
          const compressed = hash.slice(6);
          const decoded = decompressFromEncodedURIComponent(compressed);
          if (decoded) return decoded;
        } catch {
          // Ignore decode errors
        }
      }
    }
    return examples[0].code;
  }

  // Share URL
  const shareCode = () => {
    const compressed = compressToEncodedURIComponent(code.value);
    const url = `${window.location.origin}${window.location.pathname}#code=${compressed}`;
    navigator.clipboard.writeText(url);
    // Could show a toast here
  };

  // Load example
  const loadExample = (example: (typeof examples)[0]) => {
    code.value = example.code;
    selectedExample.value = example;
    showExamples.value = false;
    if (editorView) {
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: example.code },
      });
    }
    // Clear URL hash when loading example
    window.history.replaceState(null, '', window.location.pathname);
  };

  // Debounced code execution
  Rapid.effect(() => {
    const _currentCode = code.value;

    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(() => {
      runCode();
    }, 100); // 100ms debounce instead of 1s

    return () => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
    };
  });

  // Initialize editor
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
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    editorView = new EditorView({
      state: startState,
      parent: container,
    });
  };

  // Run code with tracking
  const runCode = () => {
    const startTime = performance.now();
    domUpdates.value = 0;
    signalChanges.value = 0;

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

      // Create tracked signal that counts changes
      const createTrackedSignal = <T,>(initial: T) => {
        const s = signal(initial);
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(s), 'value');
        const originalGet = descriptor?.get;
        const originalSet = descriptor?.set;
        if (originalGet && originalSet) {
          Object.defineProperty(s, 'value', {
            get() {
              return originalGet.call(this);
            },
            set(v: T) {
              signalChanges.value++;
              originalSet.call(this, v);
            },
          });
        }
        return s;
      };

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
        ...Rapid,
        ...ZenSignal,
        signal: createTrackedSignal,
        jsx: createElement,
        Fragment,
        document,
        console,
      };

      const wrappedCode = `
        ${transformed.code}
        return typeof app !== 'undefined' ? app : null;
      `;
      const fn = new Function(...Object.keys(zenContext), wrappedCode);
      let result = fn(...Object.values(zenContext));

      // Cleanup previous content
      if (previewEl.firstChild) {
        Rapid.disposeNode(previewEl.firstChild);
      }
      previewEl.innerHTML = '';

      // Handle ComponentDescriptor pattern (ADR-011)
      if (result && typeof result === 'object' && '_jsx' in result && result._jsx === true) {
        result = Rapid.executeDescriptor(result);
      }

      if (result && result instanceof Node) {
        // Wrap result to track DOM updates
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: DOM mutation tracking requires nested conditionals
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'characterData' || mutation.type === 'childList') {
              domUpdates.value++;
              // Highlight the updated element
              const target =
                mutation.target.nodeType === Node.ELEMENT_NODE
                  ? (mutation.target as Element)
                  : mutation.target.parentElement;
              if (target) {
                target.classList.remove('rapid-updated');
                // Trigger reflow to restart animation
                void target.offsetWidth;
                target.classList.add('rapid-updated');
              }
            }
          }
        });

        previewEl.appendChild(result);
        observer.observe(previewEl, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }

      error.value = '';
      lastRunTime.value = performance.now() - startTime;
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Unknown error';
    }
  };

  return (
    <div class="h-screen flex flex-col bg-bg overflow-hidden">
      {/* Header */}
      <header class="flex-shrink-0 h-14 border-b border-border bg-bg-light flex items-center justify-between px-4">
        <div class="flex items-center gap-4">
          <a
            href="/"
            class="text-lg font-bold text-text flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Icon icon="lucide:play-circle" width="20" height="20" class="text-primary" />
            Rapid Playground
          </a>

          {/* Examples Dropdown */}
          <div class="relative">
            <button
              type="button"
              class="flex items-center gap-2 px-3 py-1.5 bg-bg hover:bg-bg-lighter border border-border rounded-lg text-sm text-text-muted hover:text-text transition-colors"
              onClick={() => {
                showExamples.value = !showExamples.value;
              }}
            >
              <Icon icon="lucide:folder-open" width="14" height="14" />
              <span class="max-w-[150px] truncate">{selectedExample.value.title}</span>
              <Icon icon="lucide:chevron-down" width="14" height="14" />
            </button>

            <Show when={() => showExamples.value}>
              <div class="absolute top-full left-0 mt-1 w-72 bg-bg-light border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                <For each={examples}>
                  {(example) => (
                    <button
                      type="button"
                      class="w-full text-left px-4 py-3 hover:bg-bg-lighter border-b border-border last:border-b-0 transition-colors"
                      onClick={() => loadExample(example)}
                    >
                      <div class="flex items-center gap-3">
                        <Icon
                          icon={example.icon}
                          width="18"
                          height="18"
                          class="text-text-muted flex-shrink-0"
                        />
                        <div class="min-w-0">
                          <div class="font-medium text-text text-sm">{example.title}</div>
                          <div class="text-xs text-text-muted truncate">{example.description}</div>
                        </div>
                      </div>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
            onClick={shareCode}
          >
            <Icon icon="lucide:share" width="14" height="14" />
            Share
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div class="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div class="w-1/2 border-r border-border flex flex-col">
          <div class="flex-shrink-0 h-10 bg-bg-lighter border-b border-border flex items-center px-4">
            <div class="flex items-center gap-2">
              <div class="flex gap-1.5">
                <div class="w-3 h-3 rounded-full bg-error/60" />
                <div class="w-3 h-3 rounded-full bg-warning/60" />
                <div class="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span class="text-sm text-text-muted ml-2">app.tsx</span>
            </div>
          </div>
          <div
            class="flex-1 overflow-hidden"
            ref={(el) => {
              if (el && !editorView) {
                initEditor(el as HTMLDivElement);
              }
            }}
          />
        </div>

        {/* Preview */}
        <div class="w-1/2 flex flex-col">
          <div class="flex-shrink-0 h-10 bg-bg-lighter border-b border-border flex items-center justify-between px-4">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span class="text-sm text-text-muted">Live Preview</span>
            </div>
            <Show when={() => lastRunTime.value > 0}>
              <span class="text-xs text-text-muted">{lastRunTime.value.toFixed(1)}ms</span>
            </Show>
          </div>

          <Show when={() => error.value !== ''}>
            <div class="flex-shrink-0 p-3 bg-error/10 border-b border-error/30 text-error font-mono text-sm">
              <div class="flex items-start gap-2">
                <Icon icon="lucide:x-circle" width="16" height="16" class="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          </Show>

          <div id="preview" class="flex-1 p-6 overflow-auto bg-white" />
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <footer class="flex-shrink-0 h-10 border-t border-border bg-bg-light flex items-center justify-between px-4">
        <div class="flex items-center gap-6 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-cyan-400" />
            <span class="text-text-muted">DOM Updates:</span>
            <span class="font-mono font-bold text-cyan-400">{domUpdates}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-purple-400" />
            <span class="text-text-muted">Signal Changes:</span>
            <span class="font-mono font-bold text-purple-400">{signalChanges}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-400" />
            <span class="text-text-muted">Re-renders:</span>
            <span class="font-mono font-bold text-green-400">0</span>
            <span class="text-text-subtle">(Rapid never re-renders!)</span>
          </div>
        </div>

        <div class="flex items-center gap-3 text-xs text-text-muted">
          <span>Fine-grained reactivity in action</span>
          <Icon icon="lucide:zap" width="14" height="14" class="text-warning" />
        </div>
      </footer>

      {/* Click outside to close examples dropdown */}
      <Show when={() => showExamples.value}>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: overlay dismissal doesn't need keyboard focus */}
        <div
          class="fixed inset-0 z-40"
          onClick={() => {
            showExamples.value = false;
          }}
        />
      </Show>
    </div>
  );
}
