export function NewHero() {
  return (
    <section class="relative py-20 px-0 overflow-hidden bg-gradient-to-br from-bg via-bg to-bg-light">
      {/* Background effects */}
      <div class="absolute inset-0 opacity-20">
        <div class="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div class="relative max-w-screen-xl mx-auto px-6">
        {/* Tags */}
        <div class="flex gap-3 justify-center mb-8">
          <span class="px-4 py-1.5 bg-bg-lighter border border-primary/30 rounded-full text-sm text-primary font-medium">
            1.75 KB Signal
          </span>
          <span class="px-4 py-1.5 bg-bg-lighter border border-primary/30 rounded-full text-sm text-primary font-medium">
            &lt;5 KB Framework
          </span>
          <span class="px-4 py-1.5 bg-bg-lighter border border-primary/30 rounded-full text-sm text-primary font-medium">
            150M+ ops/sec
          </span>
        </div>

        {/* Main headline */}
        <h1 class="text-6xl md:text-7xl font-extrabold text-center mb-6 leading-tight">
          <span class="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            World's Lightest
          </span>
          <br />
          <span class="text-text">Fine-grained Framework</span>
        </h1>

        {/* Subheadline */}
        <p class="text-xl md:text-2xl text-center text-text-muted mb-4 max-w-3xl mx-auto leading-relaxed">
          No Compiler · No VDOM · No New Concepts
        </p>

        <p class="text-lg text-center text-text-muted mb-12 max-w-2xl mx-auto">
          Use Signal standalone, or migrate seamlessly from any framework
        </p>

        {/* CTA Buttons */}
        <div class="flex flex-wrap gap-4 justify-center mb-16">
          <a
            href="/docs"
            class="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-zen shadow-zen transition-all hover:scale-105 text-lg"
          >
            Get Started
          </a>
          <a
            href="/playground"
            class="px-8 py-4 bg-bg-lighter hover:bg-bg border border-border text-text font-semibold rounded-zen transition-all hover:scale-105 text-lg"
          >
            5-Min Tutorial
          </a>
          <a
            href="/migration"
            class="px-8 py-4 bg-bg-lighter hover:bg-bg border border-primary/50 text-primary font-semibold rounded-zen transition-all hover:scale-105 text-lg"
          >
            Migrate from React
          </a>
        </div>

        {/* Code comparison */}
        <div class="max-w-5xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* React example */}
            <div class="bg-bg-light border border-border rounded-zen overflow-hidden">
              <div class="bg-bg-lighter border-b border-border px-4 py-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-text font-medium">React</span>
                  <span class="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">42 KB</span>
                </div>
                <span class="text-text-muted text-sm">Re-renders entire component</span>
              </div>
              <pre class="p-4 text-sm text-text-muted font-mono overflow-x-auto">
                {`const [count, setCount] = useState(0)
const doubled = useMemo(
  () => count * 2,
  [count]
)

function Counter() {
  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
    </div>
  )
}`}
              </pre>
            </div>

            {/* Zen example */}
            <div class="bg-bg-light border-2 border-primary/50 rounded-zen overflow-hidden relative">
              <div class="absolute top-2 right-2 px-2 py-1 bg-primary text-white text-xs font-bold rounded">
                Recommended
              </div>
              <div class="bg-bg-lighter border-b border-primary/30 px-4 py-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-text font-medium">Zen</span>
                  <span class="px-2 py-0.5 bg-success/20 text-success text-xs rounded">
                    &lt;5 KB
                  </span>
                </div>
                <span class="text-primary text-sm font-medium">Updates only changed nodes</span>
              </div>
              <pre class="p-4 text-sm text-text font-mono overflow-x-auto">
                {`const count = signal(0)
const doubled = computed(
  () => count.value * 2
)

function Counter() {
  return (
    <div>
      <p>Count: {count.value}</p>
      <p>Doubled: {doubled.value}</p>
      <button onClick={() => count.value++}>
        +1
      </button>
    </div>
  )
}`}
              </pre>
            </div>
          </div>

          {/* Benefits summary */}
          <div class="mt-6 flex flex-wrap gap-6 justify-center text-center">
            <div>
              <div class="text-3xl font-bold text-success mb-1">-88%</div>
              <div class="text-sm text-text-muted">Bundle Size</div>
            </div>
            <div class="w-px bg-border" />
            <div>
              <div class="text-3xl font-bold text-success mb-1">-50%</div>
              <div class="text-sm text-text-muted">Code Size</div>
            </div>
            <div class="w-px bg-border" />
            <div>
              <div class="text-3xl font-bold text-success mb-1">3x</div>
              <div class="text-sm text-text-muted">Faster Performance</div>
            </div>
            <div class="w-px bg-border" />
            <div>
              <div class="text-3xl font-bold text-primary mb-1">0</div>
              <div class="text-sm text-text-muted">Learning Curve</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
