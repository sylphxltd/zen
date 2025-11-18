import { signal } from '@zen/zen';

export function Playground() {
  const code = signal(`import { signal, computed, render } from '@zen/zen';

// Create reactive state
const count = signal(0);
const doubled = computed(() => count.value * 2);

// Render component
render(() => (
  <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
    <h2>Counter: {count.value}</h2>
    <p>Doubled: {doubled.value}</p>
    <div style={{ display: 'flex', gap: '10px' }}>
      <button onClick={() => count.value--}>-</button>
      <button onClick={() => count.value++}>+</button>
      <button onClick={() => count.value = 0}>Reset</button>
    </div>
  </div>
), document.getElementById('preview'));`);

  const runCode = () => {
    try {
      const previewEl = document.getElementById('preview');
      if (previewEl) {
        previewEl.innerHTML = '';
        // In a real playground, you'd transpile and execute the code
        // For now, just show a message
        previewEl.innerHTML = '<div style="padding: 20px; color: #10b981;">Code would run here (requires runtime transpilation)</div>';
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div class="page-playground">
      <div class="playground-container">
        <div class="playground-header">
          <h1>Interactive Playground</h1>
          <button onClick={runCode} class="btn btn-primary">
            ▶ Run Code
          </button>
        </div>

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
              onInput={(e) => code.value = (e.target as HTMLTextAreaElement).value}
              spellcheck={false}
            />
          </div>

          <div class="playground-preview">
            <div class="preview-header">
              <span>Preview</span>
              <button class="btn btn-small" onClick={() => document.getElementById('preview').innerHTML = ''}>
                Clear
              </button>
            </div>
            <div id="preview" class="preview-content"></div>
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
            <strong>Note:</strong> This is a demo playground. A full implementation would require
            runtime transpilation (Babel/SWC) to execute JSX code dynamically.
          </p>
        </div>
      </div>
    </div>
  );
}
