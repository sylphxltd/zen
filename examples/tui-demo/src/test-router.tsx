/** @jsxImportSource @zen/tui */
/**
 * TUI Router Test
 *
 * Test routing between different screens with Router and RouterLink
 */

import { signal } from '@zen/signal';
import {
  Box,
  Text,
  Router,
  RouterLink,
  $router,
  FocusProvider,
  renderToTerminalReactive,
} from '@zen/tui';

// Home Page Component
function HomePage() {
  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text bold color="cyan">🏠 Home Page</Text>
      <Text>Welcome to the TUI Router Demo!</Text>

      <Box style={{ marginTop: 2, flexDirection: 'column', gap: 1 }}>
        <Text>Navigate to:</Text>
        <RouterLink href="/about">→ About Page</RouterLink>
        <RouterLink href="/users/123">→ User Profile (ID: 123)</RouterLink>
        <RouterLink href="/settings">→ Settings</RouterLink>
      </Box>

      <Box style={{ marginTop: 2 }}>
        <Text dim>Use Tab to navigate, Enter/Space to select</Text>
      </Box>
    </Box>
  );
}

// About Page Component
function AboutPage() {
  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text bold color="green">ℹ️  About Page</Text>
      <Text>This is a demo of TUI routing with @zen/tui Router</Text>

      <Box style={{ marginTop: 2 }}>
        <Text>Current route: {() => $router.value.path}</Text>
      </Box>

      <Box style={{ marginTop: 2 }}>
        <RouterLink href="/">← Back to Home</RouterLink>
      </Box>
    </Box>
  );
}

// User Profile Page Component
function UserProfilePage() {
  const userId = () => $router.value.params?.id || 'unknown';

  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text bold color="yellow">👤 User Profile</Text>
      <Text>User ID: {userId}</Text>

      <Box style={{ marginTop: 2 }}>
        <Text>Current route: {() => $router.value.path}</Text>
      </Box>

      <Box style={{ marginTop: 2, flexDirection: 'column', gap: 1 }}>
        <RouterLink href="/users/456">→ View User 456</RouterLink>
        <RouterLink href="/users/789">→ View User 789</RouterLink>
        <RouterLink href="/">← Back to Home</RouterLink>
      </Box>
    </Box>
  );
}

// Settings Page Component
function SettingsPage() {
  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text bold color="magenta">⚙️  Settings</Text>
      <Text>App Settings Page</Text>

      <Box style={{ marginTop: 2 }}>
        <RouterLink href="/">← Back to Home</RouterLink>
      </Box>
    </Box>
  );
}

// 404 Not Found Component
function NotFoundPage() {
  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text bold color="red">❌ 404 - Page Not Found</Text>
      <Text>The page you're looking for doesn't exist.</Text>

      <Box style={{ marginTop: 2 }}>
        <Text>Current route: {() => $router.value.path}</Text>
      </Box>

      <Box style={{ marginTop: 2 }}>
        <RouterLink href="/">← Back to Home</RouterLink>
      </Box>
    </Box>
  );
}

// Main App Component
function App() {
  return (
    <FocusProvider>
      <Box
        style={{
          flex: 1,
          borderStyle: 'round',
          padding: 2,
          flexDirection: 'column',
        }}
      >
        <Text bold color="cyan" style={{ marginBottom: 1 }}>
          🚦 TUI Router Demo
        </Text>

        <Router
          routes={[
            { path: '/', component: () => <HomePage /> },
            { path: '/about', component: () => <AboutPage /> },
            { path: '/users/:id', component: () => <UserProfilePage /> },
            { path: '/settings', component: () => <SettingsPage /> },
          ]}
          fallback={() => <NotFoundPage />}
        />

        <Box style={{ marginTop: 2, borderStyle: 'single', padding: 1 }}>
          <Text dim>
            Press q or Ctrl+C to quit
          </Text>
        </Box>
      </Box>
    </FocusProvider>
  );
}

// Render the app
renderToTerminalReactive(() => <App />, {
  fullscreen: true,
  mouse: true,
  fps: 10,
  onKeyPress: (key) => {
    if (key === 'q' || key === '\x03') {
      process.exit(0);
    }
  },
});
