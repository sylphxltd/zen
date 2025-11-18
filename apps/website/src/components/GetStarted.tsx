export function GetStarted() {
  return (
    <section class="get-started">
      <div class="container">
        <h2 class="section-title">Get Started</h2>
        <div class="get-started-grid">
          <div class="get-started-card">
            <div class="step-number">1</div>
            <h3>Install</h3>
            <pre class="code-block">npm install @zen/signal @zen/zen</pre>
            <p>Or use your favorite package manager (bun, pnpm, yarn)</p>
          </div>
          <div class="get-started-card">
            <div class="step-number">2</div>
            <h3>Configure</h3>
            <pre class="code-block">{`// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@zen/zen"
  }
}`}</pre>
          </div>
          <div class="get-started-card">
            <div class="step-number">3</div>
            <h3>Build</h3>
            <pre class="code-block">{`import { signal, render } from '@zen/zen';

const count = signal(0);

render(() => (
  <div>
    <p>Count: {count.value}</p>
    <button onClick={() => count.value++}>
      Increment
    </button>
  </div>
), document.getElementById('app'));`}</pre>
          </div>
        </div>
        <div class="get-started-actions">
          <a href="#/docs" class="btn btn-primary btn-large">
            Read the Docs
          </a>
          <a href="#/examples" class="btn btn-secondary btn-large">
            View Examples
          </a>
        </div>
      </div>
    </section>
  );
}
