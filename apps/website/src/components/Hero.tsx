export function Hero() {
  return (
    <section class="py-30 px-0 pb-20 text-center bg-gradient-to-b from-bg to-bg-light">
      <div class="max-w-screen-xl mx-auto px-6">
        <div class="flex gap-3 justify-center mb-6">
          <span class="px-4 py-1.5 bg-bg-lighter border border-border rounded-full text-sm text-primary">
            Ultra-fast
          </span>
          <span class="px-4 py-1.5 bg-bg-lighter border border-border rounded-full text-sm text-primary">
            Fine-grained
          </span>
          <span class="px-4 py-1.5 bg-bg-lighter border border-border rounded-full text-sm text-primary">
            No VDOM
          </span>
        </div>

        <h1 class="text-7xl font-extrabold mb-6 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
          Rapid Ecosystem
        </h1>

        <p class="text-2xl text-text-muted mb-12 leading-relaxed">
          <strong class="text-text font-semibold">@rapid/signal</strong> - Ultra-fast reactive
          primitives
          <br />
          <strong class="text-text font-semibold">@rapid/web</strong> - Fine-grained framework with
          no virtual DOM
        </p>

        <div class="flex gap-12 justify-center mb-12">
          <div class="text-center">
            <div class="text-4xl font-bold text-primary mb-2">1.75 KB</div>
            <div class="text-sm text-text-muted uppercase tracking-wider">Signal Core</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-primary mb-2">&lt;5 KB</div>
            <div class="text-sm text-text-muted uppercase tracking-wider">Framework</div>
          </div>
          <div class="text-center">
            <div class="text-4xl font-bold text-primary mb-2">150M+</div>
            <div class="text-sm text-text-muted uppercase tracking-wider">ops/sec</div>
          </div>
        </div>

        <div class="flex gap-4 justify-center">
          <a
            href="#packages"
            class="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-rapid shadow-rapid transition-colors duration-200"
          >
            Explore Packages
          </a>
          <a
            href="https://github.com/SylphxAI/zen"
            target="_blank"
            class="px-8 py-3 bg-bg-lighter hover:bg-bg border border-border text-text font-medium rounded-rapid transition-colors duration-200"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
