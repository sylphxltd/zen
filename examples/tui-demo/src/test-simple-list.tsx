/** @jsxImportSource @zen/tui */
/**
 * Simple List Test
 */

import { Box, Text, renderToTerminalReactive, For } from '@zen/tui';

function SimpleList() {
  const items = ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5'];

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true }}>Simple List Test</Text>
      <Text>─────────────────</Text>
      <Text> </Text>

      <Box style={{ flexDirection: 'column', borderStyle: 'single', padding: 1 }}>
        <Text>Using direct map:</Text>
        {items.map((item) => (
          <Text key={item}>{item}</Text>
        ))}
      </Box>

      <Text> </Text>

      <Box style={{ flexDirection: 'column', borderStyle: 'single', padding: 1 }}>
        <Text>Using For component:</Text>
        <For each={items}>
          {(item) => <Text>{item}</Text>}
        </For>
      </Box>

      <Text> </Text>
      <Text style={{ dim: true }}>Press q to exit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => SimpleList(), {
  fps: 10,
  fullscreen: true,
});
