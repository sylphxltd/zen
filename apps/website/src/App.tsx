import { Router } from '@zen/zen';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Docs } from './pages/Docs';
import { Examples } from './pages/Examples';
import { Playground } from './pages/Playground';

export function App() {
  return (
    <div class="app">
      <Header />
      <main>
        <Router
          routes={[
            { path: '/', component: () => <Home /> },
            { path: '/docs', component: () => <Docs /> },
            { path: '/examples', component: () => <Examples /> },
            { path: '/playground', component: () => <Playground /> },
          ]}
          fallback={() => (
            <div class="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
              <h1 style={{ fontSize: '72px', marginBottom: '16px' }}>404</h1>
              <p style={{ fontSize: '24px', color: 'var(--text-muted)' }}>Page not found</p>
              <a href="#/" class="btn btn-primary" style={{ marginTop: '32px' }}>Go home</a>
            </div>
          )}
        />
      </main>
      <Footer />
    </div>
  );
}
