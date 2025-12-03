export function GetStarted() {
  return (
    <section class="py-16 px-0 bg-bg-light">
      <div class="max-w-screen-xl mx-auto px-6">
        <h2 class="text-5xl font-bold text-center mb-16 text-text">Get Started</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div class="bg-bg border border-border rounded-rapid p-8 relative">
            <div class="absolute -top-4 left-8 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
              1
            </div>
            <h3 class="text-2xl font-semibold mb-4 text-text mt-4">Install</h3>
            <pre class="bg-bg-lighter border border-border rounded-rapid p-4 text-sm text-primary font-mono mb-4 overflow-x-auto">
              npm install @rapid/signal @rapid/web
            </pre>
            <p class="text-text-muted">Or use your favorite package manager (bun, pnpm, yarn)</p>
          </div>
          <div class="bg-bg border border-border rounded-rapid p-8 relative">
            <div class="absolute -top-4 left-8 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
              2
            </div>
            <h3 class="text-2xl font-semibold mb-4 text-text mt-4">Configure</h3>
            <pre class="bg-bg-lighter border border-border rounded-rapid p-4 text-sm text-text-muted font-mono overflow-x-auto">{`// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@rapid/web"
  }
}`}</pre>
          </div>
          <div class="bg-bg border border-border rounded-rapid p-8 relative">
            <div class="absolute -top-4 left-8 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
              3
            </div>
            <h3 class="text-2xl font-semibold mb-4 text-text mt-4">Build</h3>
            <pre class="bg-bg-lighter border border-border rounded-rapid p-4 text-sm text-text-muted font-mono overflow-x-auto">{`import { signal, render } from '@rapid/web';

const count = signal(0);

render(() => (
  <div>
    <p>Count: {count}</p>
    <button onClick={() => count.value++}>
      Increment
    </button>
  </div>
), document.getElementById('app'));`}</pre>
          </div>
        </div>
        <div class="flex gap-4 justify-center">
          <a
            href="/docs"
            class="px-10 py-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-rapid shadow-rapid transition-colors text-lg"
          >
            Read the Docs
          </a>
          <a
            href="/examples"
            class="px-10 py-4 bg-secondary hover:bg-secondary/80 text-white font-medium rounded-rapid shadow-rapid transition-colors text-lg"
          >
            View Examples
          </a>
        </div>
      </div>
    </section>
  );
}
