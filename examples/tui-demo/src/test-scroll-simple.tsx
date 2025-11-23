/** @jsxImportSource @zen/tui */
/**
 * Simple ScrollBox Test
 */

import { signal } from '@zen/signal';
import { Box, ScrollBox, Text, renderToTerminalReactive } from '@zen/tui';

function ScrollTest() {
  const _scrollPos = signal(0);

  // Generate 20 items
  const items = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true }}>ScrollBox Test (Height: 5)</Text>
      <Text>Scroll with mouse wheel or arrow keys</Text>
      <Text> </Text>

      <ScrollBox height={5} contentHeight={items.length} style={{ borderStyle: 'single' }}>
        <Box style={{ flexDirection: 'column' }}>
          {items.map((item) => (
            <Text key={item}>{item}</Text>
          ))}
        </Box>
      </ScrollBox>

      <Text> </Text>
      <Text style={{ dim: true }}>Press q to exit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => ScrollTest(), {
  fps: 10,
  fullscreen: true,
  mouse: true,
});
