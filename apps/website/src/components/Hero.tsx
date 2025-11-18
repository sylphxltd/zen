import { signal } from '@zen/zen';

export function Hero() {
  return (
    <section class="hero">
      <div class="container">
        <div class="hero-badge">
          <span class="badge">Ultra-fast</span>
          <span class="badge">Fine-grained</span>
          <span class="badge">No VDOM</span>
        </div>

        <h1 class="hero-title">
          Zen Ecosystem
        </h1>

        <p class="hero-subtitle">
          <strong>@zen/signal</strong> - Ultra-fast reactive primitives<br/>
          <strong>@zen/zen</strong> - Fine-grained framework with no virtual DOM
        </p>

        <div class="hero-stats">
          <div class="stat">
            <div class="stat-value">1.75 KB</div>
            <div class="stat-label">Signal Core</div>
          </div>
          <div class="stat">
            <div class="stat-value">&lt;5 KB</div>
            <div class="stat-label">Framework</div>
          </div>
          <div class="stat">
            <div class="stat-value">150M+</div>
            <div class="stat-label">ops/sec</div>
          </div>
        </div>

        <div class="hero-actions">
          <a href="#packages" class="btn btn-primary">
            Explore Packages
          </a>
          <a href="https://github.com/SylphxAI/zen" target="_blank" class="btn btn-secondary">
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
