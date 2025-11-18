import * as Babel from '@babel/standalone';
import * as ZenSignal from '@zen/signal';
import { Show, signal } from '@zen/zen';
import * as Zen from '@zen/zen';

export function Playground() {
  const code = signal(`// Create reactive state
const count = signal(0);
const doubled = computed(() => count.value * 2);

// Create component
const app = (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h2>Counter: {count}</h2>
    <p>Doubled: {doubled}</p>
    <div style={{ display: 'flex', gap: '10px' }}>
      <button onClick={() => count.value--}>-</button>
      <button onClick={() => count.value++}>+</button>
      <button onClick={() => count.value = 0}>Reset</button>
    </div>
  </div>
);

// Render to preview
const preview = document.getElementById('preview');
preview.innerHTML = '';
preview.appendChild(app);`);

  const error = signal('');

  const runCode = () => {
    try {
      error.value = '';
      const previewEl = document.getElementById('preview');
      if (!previewEl) return;

      // Clear preview
      previewEl.innerHTML = '';

      // Remove import statements (Zen API is provided via context)
      const codeWithoutImports = code.value.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');

      // Transpile JSX to JavaScript
      const transformed = Babel.transform(codeWithoutImports, {
        presets: [['react', { runtime: 'automatic', importSource: '@zen/zen' }]],
        filename: 'playground.tsx',
      });

      // Create execution context with Zen API
      const zenContext = {
        ...Zen,
        ...ZenSignal,
        document,
        console,
      };

      // Execute transpiled code
      const fn = new Function(...Object.keys(zenContext), transformed.code);
      fn(...Object.values(zenContext));
    } catch (e: unknown) {
      error.value = (e as Error).message || 'Unknown error';
      const previewEl = document.getElementById('preview');
      if (previewEl) {
        previewEl.innerHTML = `<div style="padding: 20px; color: #ef4444; font-family: monospace; white-space: pre-wrap;">${error.value}</div>`;
      }
    }
  };

  return (
    <div class="page-playground">
      <div class="playground-container">
        <div class="playground-header">
          <h1>Interactive Playground</h1>
          <button type="button" onClick={runCode} class="btn btn-primary">
            ▶ Run Code
          </button>
        </div>

        <Show when={error.value !== ''}>
          <div
            class="playground-error"
            style={{
              margin: '1rem 0',
              padding: '1rem',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c33',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        </Show>

        <div class="playground-layout">
          <div class="playground-editor">
            <div class="editor-header">
              <span>Code Editor</span>
              <select class="editor-select">
                <option>Counter</option>
                <option>Todo App</option>
                <option>Form</option>
                <option>Async Data</option>
              </select>
            </div>
            <textarea
              class="code-editor"
              value={code.value}
              onInput={(e) => {
                code.value = (e.target as HTMLTextAreaElement).value;
              }}
              spellcheck={false}
            />
          </div>

          <div class="playground-preview">
            <div class="preview-header">
              <span>Preview</span>
              <button
                type="button"
                class="btn btn-small"
                onClick={() => {
                  document.getElementById('preview').innerHTML = '';
                }}
              >
                Clear
              </button>
            </div>
            <div id="preview" class="preview-content" />
          </div>
        </div>

        <div class="playground-info">
          <h3>💡 Playground Tips</h3>
          <ul>
            <li>Write JSX code using Zen's API</li>
            <li>Click "Run Code" to see your component</li>
            <li>Try modifying the example to see live updates</li>
            <li>All Zen features are available: signal, computed, effect, components</li>
          </ul>
          <p class="note">
            <strong>Note:</strong> This playground uses Babel Standalone for runtime JSX
            transpilation. Your code runs directly in the browser with access to all Zen APIs.
          </p>
        </div>
      </div>
    </div>
  );
}
