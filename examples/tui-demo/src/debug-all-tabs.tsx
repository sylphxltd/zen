#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Debug - Show all tabs one by one
 */

import { signal } from '@zen/signal';
import { Box, FocusProvider, Tab, Tabs, Text, renderToTerminalReactive } from '@zen/tui';

const activeTab = signal(0);

function App() {
  // Cycle through tabs: 0 -> 1 -> 2 -> 3 -> exit
  const interval = setInterval(() => {
    const current = activeTab.value;
    if (current < 3) {
      activeTab.value = current + 1;
      console.error(`\n=== Switched to tab ${current + 1} ===\n`);
    } else {
      clearInterval(interval);
      setTimeout(() => process.exit(0), 500);
    }
  }, 1000);

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text bold color="cyan" style={{ marginBottom: 1 }}>
        Zen TUI - Tab Test (Active: {() => activeTab.value})
      </Text>

      <Tabs id="docs" activeTab={activeTab} style={{ marginBottom: 1 }}>
        <Tab name="Tab 0">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Tab 0 Content</Text>
            <Text>Line 1</Text>
            <Text>Line 2</Text>
            <Text>Line 3</Text>
          </Box>
        </Tab>

        <Tab name="Tab 1">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Tab 1 Content</Text>
            <Text>Line A</Text>
            <Text>Line B</Text>
            <Text>Line C</Text>
          </Box>
        </Tab>

        <Tab name="Tab 2">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Tab 2 Content</Text>
            <Text color="cyan">$ command 1</Text>
            <Text color="cyan">$ command 2</Text>
            <Text color="cyan">$ command 3</Text>
          </Box>
        </Tab>

        <Tab name="Tab 3">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Tab 3 Content</Text>
            <Text>API Line 1</Text>
            <Text>API Line 2</Text>
            <Text>API Line 3</Text>
          </Box>
        </Tab>
      </Tabs>

      <Text dim>Current: Tab {() => activeTab.value}</Text>
    </Box>
  );
}

await renderToTerminalReactive(
  () => (
    <FocusProvider>
      <App />
    </FocusProvider>
  ),
  { fps: 10 },
);
