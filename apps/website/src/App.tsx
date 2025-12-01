import { Router } from '@zen/router';
import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { NewDocs } from './pages/NewDocs.tsx';
import { NewHome } from './pages/NewHome.tsx';
import { Playground } from './pages/Playground.tsx';
import { TestDescriptor } from './pages/TestDescriptor.tsx';

export function App() {
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
            <div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
              <h1 class="text-8xl font-bold text-text mb-4">404</h1>
              <p class="text-2xl text-text-muted mb-8">Page not found</p>
              <a
                href="/"
                class="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-zen shadow-zen transition-all hover:scale-105"
              >
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
