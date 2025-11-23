/** @jsxImportSource @zen/tui */
/**
 * ScrollBox Offset Debug
 */

import { signal } from '@zen/signal';
import { Box, ScrollBox, Text, renderToTerminalReactive } from '@zen/tui';

function ScrollOffsetDebug() {
  const scrollOffset = signal(0);

  // Manually track scroll for debugging
  const items = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>ScrollBox Offset Debug</Text>
      <Text>─────────────────────────</Text>
      <Text> </Text>
      <Text style={{ color: 'yellow' }}>Scroll with mouse or arrow keys</Text>
      <Text>Current Offset Should Change: {() => scrollOffset.value}</Text>
      <Text> </Text>

      <ScrollBox height={5} style={{ borderStyle: 'single' }}>
        <Box style={{ flexDirection: 'column' }}>
          {items.map((item, i) => (
            <Text key={item} style={{ color: i === 0 ? 'green' : undefined }}>
              {item}
            </Text>
          ))}
        </Box>
      </ScrollBox>

      <Text> </Text>
      <Text style={{ dim: true }}>Press q to exit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => ScrollOffsetDebug(), {
  fps: 10,
  fullscreen: true,
  mouse: true,
});
