#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Debug Tabs - Auto switch to tab 2 (Examples)
 */

import { signal, effect } from '@zen/signal';
import { Box, FocusProvider, Tab, Tabs, Text, renderToTerminalReactive } from '@zen/tui';

const activeTab = signal(0);

function App() {
  // Auto switch to tab 2 after render
  effect(() => {
    setTimeout(() => {
      activeTab.value = 2;
    }, 200);
  });

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
          </Box>
        </Tab>

        <Tab name="Components">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Components</Text>
            <Text>• Box, Text, Static</Text>
          </Box>
        </Tab>

        <Tab name="Examples">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>Examples</Text>
            <Text color="cyan">$ bun examples/tui-demo/src/test-radio.tsx</Text>
            <Text color="cyan">$ bun examples/tui-demo/src/test-multiselect.tsx</Text>
            <Text color="cyan">$ bun examples/tui-demo/src/test-tabs.tsx</Text>
          </Box>
        </Tab>

        <Tab name="API">
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text bold>API Reference</Text>
            <Text>import from '@zen/tui';</Text>
          </Box>
        </Tab>
      </Tabs>

      <Text dim>Tab {() => activeTab.value} selected</Text>
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
