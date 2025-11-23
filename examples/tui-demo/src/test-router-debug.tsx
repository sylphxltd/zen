/** @jsxImportSource @zen/tui */
import {
  $router,
  Box,
  FocusProvider,
  Router,
  RouterLink,
  Text,
  open,
  renderToTerminalReactive,
} from '@zen/tui';

function Home() {
  return (
    <Box style={{ padding: 2, flexDirection: 'column', gap: 1 }}>
      <Text bold color="cyan">
        🏠 Home Page
      </Text>
      <Text>Navigate to:</Text>
      <RouterLink href="/about">→ About Page (press Enter)</RouterLink>
      <Text dim style={{ marginTop: 1 }}>Or press '1' for About</Text>
    </Box>
  );
}

function About() {
  return (
    <Box style={{ padding: 2, flexDirection: 'column', gap: 1 }}>
      <Text bold color="green">
        ℹ️  About Page
      </Text>
      <Text>You navigated successfully!</Text>
      <RouterLink href="/">← Back to Home (press Enter)</RouterLink>
      <Text dim style={{ marginTop: 1 }}>Or press '2' for Home</Text>
    </Box>
  );
}

function App() {
  return (
    <FocusProvider>
      <Box style={{ borderStyle: 'single', padding: 1, flexDirection: 'column' }}>
        <Text bold color="cyan">TUI Router Debug</Text>
        <Text>Current path: {() => $router.value.path || '/'}</Text>

        <Box style={{ marginTop: 1 }}>
          <Router
            routes={[
              {
                path: '/',
                component: () => {
                  return <Home />;
                },
              },
              {
                path: '/about',
                component: () => {
                  return <About />;
                },
              },
            ]}
            fallback={() => {
              return <Text color="red">404 Not Found</Text>;
            }}
          />
        </Box>

        <Box style={{ marginTop: 1, borderStyle: 'single', padding: 1 }}>
          <Text dim>Press Tab to focus links, Enter/Space to navigate</Text>
          <Text dim>Press 1 for About, 2 for Home, q to quit</Text>
        </Box>
      </Box>
    </FocusProvider>
  );
}

renderToTerminalReactive(() => <App />, {
  fullscreen: true,
  onKeyPress: (key) => {
    if (key === 'q' || key === '\x03') {
      process.exit(0);
    }
    // Keyboard shortcuts for direct navigation
    if (key === '1') {
      open('/about');
    }
    if (key === '2') {
      open('/');
    }
  },
});
