import { Router } from '@zen/router';
import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { NewDocs } from './pages/NewDocs.tsx';
import { NewHome } from './pages/NewHome.tsx';
import { Playground } from './pages/Playground.tsx';
import { TestDescriptor } from './pages/TestDescriptor.tsx';
import { initTheme } from './theme';

export function App() {
  // Initialize theme system
  initTheme();

  return (
    <div class="app">
      <Header />
      <main>
        <Router
          routes={[
            { path: '/', component: () => <NewHome /> },
            { path: '/docs', component: () => <NewDocs /> },
            { path: '/playground', component: () => <Playground /> },
            { path: '/test-descriptor', component: () => <TestDescriptor /> },
          ]}
          fallback={() => (
            <div class="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '72px', marginBottom: '16px' }}>404</h1>
              <p style={{ fontSize: '24px', color: 'var(--text-muted)' }}>Page not found</p>
              <a href="/" class="btn btn-primary" style={{ marginTop: '32px' }}>
                Go home
              </a>
            </div>
          )}
        />
      </main>
      <Footer />
    </div>
  );
}
