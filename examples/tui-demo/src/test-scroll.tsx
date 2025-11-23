/** @jsxImportSource @zen/tui */
/**
 * ScrollBox Demo
 *
 * Tests scrollable content with mouse wheel support.
 */

import { signal } from '@zen/signal';
import { Box, ScrollBox, Text, renderToTerminalReactive } from '@zen/tui';

function ScrollDemo() {
  // Generate list of items
  const items = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);

  return (
    <Box style={{ flexDirection: 'column', padding: 1, borderStyle: 'round' }}>
      <Text style={{ bold: true, color: 'cyan' }}>ScrollBox Demo</Text>
      <Text>───────────────────────</Text>
      <Text> </Text>
      <Text style={{ color: 'yellow' }}>Scroll with mouse wheel or arrow keys</Text>
      <Text style={{ color: 'yellow' }}>Use Page Up/Down for faster scrolling</Text>
      <Text> </Text>

      <ScrollBox height={10} contentHeight={items.length} style={{ borderStyle: 'single' }}>
        <Box style={{ flexDirection: 'column' }}>
          {items.map((item) => (
            <Text key={item}>{item}</Text>
          ))}
        </Box>
      </ScrollBox>

      <Text> </Text>
      <Text style={{ dim: true }}>Press 'q' or Ctrl+C to exit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => ScrollDemo(), {
  fps: 10,
  fullscreen: true,
  mouse: true,
});
