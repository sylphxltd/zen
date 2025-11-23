/** @jsxImportSource @zen/tui */
/**
 * ScrollBox with Offset Indicator
 */

import { signal } from '@zen/signal';
import { Box, Text, renderToTerminalReactive, useMouseScroll, useInput, For } from '@zen/tui';

function ScrollWithIndicator() {
  const scrollOffset = signal(0);
  const scrollStep = 1;

  // Handle scrolling manually
  useMouseScroll((direction) => {
    if (direction === 'up') {
      scrollOffset.value = Math.max(0, scrollOffset.value - scrollStep);
    } else {
      scrollOffset.value += scrollStep;
    }
  });

  useInput((_input, key) => {
    if (key.upArrow) {
      scrollOffset.value = Math.max(0, scrollOffset.value - scrollStep);
    } else if (key.downArrow) {
      scrollOffset.value += scrollStep;
    }
  });

  const items = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);
  const viewportHeight = 5;

  // Calculate visible range based on scroll offset
  const startIndex = () => scrollOffset.value;
  const endIndex = () => Math.min(scrollOffset.value + viewportHeight, items.length);
  const visibleItems = () => items.slice(startIndex(), endIndex());

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Manual Scroll Test</Text>
      <Text>─────────────────────</Text>
      <Text> </Text>
      <Text style={{ color: 'yellow' }}>Scroll Offset: {() => scrollOffset.value}</Text>
      <Text style={{ color: 'yellow' }}>Showing lines {() => startIndex() + 1} to {() => endIndex()}</Text>
      <Text> </Text>

      <Box style={{ flexDirection: 'column', borderStyle: 'single', padding: 1, height: viewportHeight + 2 }}>
        {() => visibleItems().map((item) => <Text key={item}>{item}</Text>)}
      </Box>

      <Text> </Text>
      <Text style={{ dim: true }}>Scroll with mouse wheel or arrow keys. Press q to exit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => ScrollWithIndicator(), {
  fps: 10,
  fullscreen: true,
  mouse: true,
});
