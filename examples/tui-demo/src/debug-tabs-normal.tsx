#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Test Tabs with normal renderer (not persistent)
 */

import { signal } from '@zen/signal';
import { Box, FocusProvider, Tab, Tabs, Text, render } from '@zen/tui';

const activeTab = signal(0);

function App() {
  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text bold color="cyan" style={{ marginBottom: 1 }}>
        Zen TUI Documentation (Tab: {() => activeTab.value})
      </Text>

      <Tabs id="docs" activeTab={activeTab} style={{ marginBottom: 1 }}>
        <Tab name="Overview">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Overview</Text>
            <Text>Zen TUI framework</Text>
          </Box>
        </Tab>

        <Tab name="Components">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Components</Text>
            <Text>• Box, Text</Text>
          </Box>
        </Tab>

        <Tab name="Examples">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Examples</Text>
            <Text color="cyan">$ bun test</Text>
          </Box>
        </Tab>
      </Tabs>

      <Text dim>Use ←→ or 1-3 • Ctrl+C to exit</Text>
    </Box>
  );
}

// Use NORMAL renderer (not persistent reactive)
render(
  <FocusProvider>
    <App />
  </FocusProvider>
);
