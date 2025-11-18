/**
 * ZenJS Website App
 */

import { Router } from '../../src/index.js';
import { Footer } from './components/Footer.js';
import { Header } from './components/Header.js';
import { Benchmark } from './pages/Benchmark.js';
import { Docs } from './pages/Docs.js';
import { Examples } from './pages/Examples.js';
import { Home } from './pages/Home.js';

export function App() {
  const app = document.createElement('div');
  app.id = 'app';

  // Header
  app.appendChild(Header());

  // Main content with router
  const main = document.createElement('main');
  main.appendChild(
    Router({
      routes: [
        { path: '/', component: () => Home() },
        { path: '/docs', component: () => Docs() },
        { path: '/examples', component: () => Examples() },
        { path: '/benchmark', component: () => Benchmark() },
      ],
      fallback: () => {
        const notFound = document.createElement('div');
        notFound.className = 'container';
        notFound.style.paddingTop = '120px';
        notFound.style.textAlign = 'center';

        const h1 = document.createElement('h1');
        h1.textContent = '404';
        h1.style.fontSize = '72px';
        h1.style.marginBottom = '16px';

        const p = document.createElement('p');
        p.textContent = 'Page not found';
        p.style.fontSize = '24px';
        p.style.color = 'var(--text-muted)';

        const link = document.createElement('a');
        link.href = '#/';
        link.textContent = 'Go home';
        link.className = 'btn btn-primary';
        link.style.marginTop = '32px';
        link.style.display = 'inline-block';

        notFound.appendChild(h1);
        notFound.appendChild(p);
        notFound.appendChild(link);

        return notFound;
      },
    }),
  );
  app.appendChild(main);

  // Footer
  app.appendChild(Footer());

  return app;
}
