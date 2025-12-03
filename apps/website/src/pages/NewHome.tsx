import { computed, signal } from '@rapid/signal';
import { For, Show } from '@rapid/web';
import { Icon } from '../components/Icon.tsx';

export function NewHome() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <CodeComparisonSection />
      <DemoSection />
      <GetStartedSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section class="relative py-24 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div class="absolute inset-0 bg-gradient-hero" />
      <div class="absolute inset-0 bg-grid opacity-50" />

      {/* Glow effects */}
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

      <div class="relative max-w-6xl mx-auto px-6">
        <div class="text-center max-w-4xl mx-auto">
          {/* Badges */}
          <div class="flex flex-wrap gap-3 justify-center mb-8 animate-in">
            <span class="badge badge-primary">1.75 KB Signal</span>
            <span class="badge badge-primary">&lt;5 KB Framework</span>
            <span class="badge badge-success">150M+ ops/sec</span>
          </div>

          {/* Headline */}
          <h1 class="heading-1 mb-6 animate-in-delay-1">
            <span class="gradient-text">Ultra-fast</span> Reactive Framework
          </h1>

          {/* Subheadline */}
          <p class="text-xl md:text-2xl text-text-muted mb-4 animate-in-delay-2">
            No Virtual DOM. No Compiler. No New Concepts.
          </p>
          <p class="text-lg text-text-subtle mb-10 max-w-2xl mx-auto animate-in-delay-2">
            Fine-grained reactivity that updates only what changed. Build lightning-fast web and
            terminal applications.
          </p>

          {/* CTA Buttons */}
          <div class="flex flex-wrap gap-4 justify-center animate-in-delay-3">
            <a href="/docs" class="btn btn-primary text-lg px-8 py-4">
              <Icon icon="lucide:book-open" width="20" height="20" />
              Get Started
            </a>
            <a href="/playground" class="btn btn-secondary text-lg px-8 py-4">
              <Icon icon="lucide:play" width="20" height="20" />
              Try Playground
            </a>
          </div>

          {/* Quick install */}
          <div class="mt-12 animate-in-delay-3">
            <div class="inline-flex items-center gap-3 px-5 py-3 bg-bg-lighter border border-border rounded-xl font-mono text-sm">
              <span class="text-text-muted">$</span>
              <span class="text-text">npm install @rapid/signal @rapid/web</span>
              <button
                type="button"
                class="p-1.5 hover:bg-bg-dark rounded-lg text-text-muted hover:text-text transition-colors"
                onClick={() =>
                  navigator.clipboard.writeText('npm install @rapid/signal @rapid/web')
                }
              >
                <Icon icon="lucide:code" width="16" height="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: 'lucide:zap',
      title: '150M+ Updates/sec',
      description: 'Blazing fast signal updates with zero overhead.',
    },
    {
      icon: 'lucide:feather',
      title: '1.75 KB Core',
      description: 'Smaller than most utility libraries.',
    },
    {
      icon: 'lucide:target',
      title: 'No Virtual DOM',
      description: 'Direct DOM updates. No diffing needed.',
    },
    {
      icon: 'lucide:brain',
      title: 'Auto-tracking',
      description: 'Dependencies tracked automatically.',
    },
    {
      icon: 'lucide:terminal',
      title: 'Web + TUI',
      description: 'Same API for browser and terminal.',
    },
    {
      icon: 'lucide:code',
      title: 'TypeScript First',
      description: 'Full type inference out of the box.',
    },
  ];

  return (
    <section class="section section-alt">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="heading-2 mb-4">Why Choose Rapid?</h2>
          <p class="text-lg text-text-muted max-w-2xl mx-auto">
            Built for performance, designed for developer experience.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={features}>
            {(feature) => (
              <div class="card card-hover group">
                <div class="w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                  <Icon
                    icon={feature.icon}
                    width="24"
                    height="24"
                    class="text-primary group-hover:text-white transition-colors"
                  />
                </div>
                <h3 class="heading-3 mb-2">{feature.title}</h3>
                <p class="text-text-muted">{feature.description}</p>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}

function CodeComparisonSection() {
  return (
    <section class="section">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="heading-2 mb-4">Simple, Familiar API</h2>
          <p class="text-lg text-text-muted max-w-2xl mx-auto">
            If you know React, you already know Rapid. Same concepts, better performance.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* React */}
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <Icon icon="lucide:atom" width="20" height="20" class="text-blue-400" />
                <span class="font-semibold text-text">React</span>
              </div>
              <span class="badge bg-error/10 text-error border-error/20 text-xs">42 KB</span>
            </div>
            <pre class="code-block text-sm text-text-muted">
              {`const [count, setCount] = useState(0);
const doubled = useMemo(
  () => count * 2,
  [count]
);

// Re-renders entire component
setCount(count + 1);`}
            </pre>
          </div>

          {/* Rapid */}
          <div class="card border-primary/50 shadow-glow">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <Icon icon="lucide:zap" width="20" height="20" class="text-primary" />
                <span class="font-semibold text-text">Rapid</span>
              </div>
              <span class="badge badge-success text-xs">&lt;5 KB</span>
            </div>
            <pre class="code-block text-sm text-text">
              {`const count = signal(0);
const doubled = computed(
  () => count.value * 2
);

// Updates only changed nodes
count.value++;`}
            </pre>
          </div>
        </div>

        {/* Stats */}
        <div class="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div class="p-6">
            <div class="text-3xl md:text-4xl font-bold text-success mb-2">-88%</div>
            <div class="text-sm text-text-muted">Bundle Size</div>
          </div>
          <div class="p-6">
            <div class="text-3xl md:text-4xl font-bold text-success mb-2">3x</div>
            <div class="text-sm text-text-muted">Faster Updates</div>
          </div>
          <div class="p-6">
            <div class="text-3xl md:text-4xl font-bold text-primary mb-2">0</div>
            <div class="text-sm text-text-muted">Dependency Arrays</div>
          </div>
          <div class="p-6">
            <div class="text-3xl md:text-4xl font-bold text-primary mb-2">0</div>
            <div class="text-sm text-text-muted">Re-renders</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  const count = signal(0);
  const doubled = computed(() => count.value * 2);

  return (
    <section class="section section-alt">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="heading-2 mb-4">Try It Live</h2>
          <p class="text-lg text-text-muted max-w-2xl mx-auto">
            Experience fine-grained reactivity. Only the values update, not the component.
          </p>
        </div>

        <div class="max-w-xl mx-auto">
          <div class="card text-center">
            <div class="text-6xl font-bold text-primary mb-2">{count}</div>
            <div class="text-xl text-text-muted mb-6">Doubled: {doubled}</div>

            <div class="flex gap-3 justify-center">
              <button type="button" onClick={() => count.value--} class="btn btn-secondary">
                <Icon icon="lucide:x" width="18" height="18" />
                Decrement
              </button>
              <button type="button" onClick={() => count.value++} class="btn btn-primary">
                <Icon icon="lucide:zap" width="18" height="18" />
                Increment
              </button>
              <button
                type="button"
                onClick={() => {
                  count.value = 0;
                }}
                class="btn btn-ghost"
              >
                Reset
              </button>
            </div>

            <p class="mt-6 text-sm text-text-subtle">
              Notice: The component doesn't re-render. Only the text nodes update.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function GetStartedSection() {
  const steps = [
    {
      step: '1',
      title: 'Install',
      code: 'npm install @rapid/signal @rapid/web',
    },
    {
      step: '2',
      title: 'Configure',
      code: `// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@rapid/web"
  }
}`,
    },
    {
      step: '3',
      title: 'Build',
      code: `import { signal } from '@rapid/signal';
import { render } from '@rapid/web';

const count = signal(0);

render(() => (
  <button onClick={() => count.value++}>
    Count: {count}
  </button>
), document.body);`,
    },
  ];

  return (
    <section class="section">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="heading-2 mb-4">Get Started in Minutes</h2>
          <p class="text-lg text-text-muted max-w-2xl mx-auto">
            Three simple steps to start building with Rapid.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <For each={steps}>
            {(item) => (
              <div class="card">
                <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mb-4">
                  {item.step}
                </div>
                <h3 class="heading-3 mb-4">{item.title}</h3>
                <pre class="code-block text-sm text-text-muted">{item.code}</pre>
              </div>
            )}
          </For>
        </div>

        <div class="text-center">
          <div class="flex flex-wrap gap-4 justify-center">
            <a href="/docs" class="btn btn-primary text-lg px-8 py-4">
              <Icon icon="lucide:book-open" width="20" height="20" />
              Read the Docs
            </a>
            <a href="/examples" class="btn btn-secondary text-lg px-8 py-4">
              <Icon icon="lucide:code" width="20" height="20" />
              View Examples
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
