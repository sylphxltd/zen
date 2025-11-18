import { Link } from '@zen/zen';

export function Header() {
  return (
    <header class="header">
      <div class="container">
        <nav class="nav">
          <a href="#/" class="logo">
            <span class="logo-icon">⚡</span>
            <span class="logo-text">Zen</span>
          </a>
          <div class="nav-links">
            <Link href="/" class="nav-link">Home</Link>
            <Link href="/docs" class="nav-link">Docs</Link>
            <Link href="/examples" class="nav-link">Examples</Link>
            <Link href="/playground" class="nav-link">Playground</Link>
            <a href="https://github.com/SylphxAI/zen" target="_blank" class="nav-link">GitHub</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
