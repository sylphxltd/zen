#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Debug Tabs - Manual navigation (for debugging layout issues)
 */

import { signal } from '@zen/signal';
import { Box, FocusProvider, Tab, Tabs, Text, renderToTerminalReactive } from '@zen/tui';

const activeTab = signal(0);

function App() {
  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text bold color="cyan" style={{ marginBottom: 1 }}>
        Zen TUI Documentation (Active Tab: {() => activeTab.value})
      </Text>

      <Tabs id="docs" activeTab={activeTab} style={{ marginBottom: 1 }}>
        <Tab name="Overview">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Overview</Text>
            <Text>Zen TUI is a terminal UI framework.</Text>
            <Text>• Component-based architecture</Text>
            <Text>• Reactive signal system</Text>
            <Text>• Ink-compatible API</Text>
          </Box>
        </Tab>

        <Tab name="Components">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Components</Text>
            <Text>• Box, Text, Static</Text>
            <Text>• TextInput, SelectInput</Text>
            <Text>• Radio, Checkbox</Text>
            <Text>• Tabs, Table, Badge</Text>
          </Box>
        </Tab>

        <Tab name="Examples">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Examples</Text>
            <Text color="cyan">$ bun test-radio.tsx</Text>
            <Text color="cyan">$ bun test-multiselect.tsx</Text>
            <Text color="cyan">$ bun test-tabs.tsx</Text>
          </Box>
        </Tab>

        <Tab name="API">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>API Reference</Text>
            <Text>import from '@zen/tui';</Text>
            <Text>render, signal, effect</Text>
          </Box>
        </Tab>
      </Tabs>

      <Text dim style={{ marginTop: 1 }}>
        Use ←→ to navigate • Press Tab {() => activeTab.value} • Ctrl+C to exit
      </Text>
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
