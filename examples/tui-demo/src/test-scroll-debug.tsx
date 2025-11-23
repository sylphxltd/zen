/** @jsxImportSource @zen/tui */
/**
 * ScrollBox Debug Test
 */

import { signal } from '@zen/signal';
import { Box, Text, renderToTerminalReactive, useMouseScroll, useInput } from '@zen/tui';

function ScrollDebug() {
  const mouseEvents = signal(0);
  const keyEvents = signal(0);
  const lastEvent = signal('None');

  // Test if mouse events are received
  useMouseScroll((direction, x, y) => {
    mouseEvents.value++;
    lastEvent.value = `Mouse ${direction} at (${x}, ${y})`;
  });

  // Test if keyboard events are received
  useInput((input, key) => {
    keyEvents.value++;
    if (key.upArrow) lastEvent.value = 'Key: Up Arrow';
    else if (key.downArrow) lastEvent.value = 'Key: Down Arrow';
    else if (key.pageUp) lastEvent.value = 'Key: Page Up';
    else if (key.pageDown) lastEvent.value = 'Key: Page Down';
    else lastEvent.value = `Key: ${input}`;
  });

  return (
    <Box style={{ flexDirection: 'column', padding: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Scroll Debug Test</Text>
      <Text>─────────────────</Text>
      <Text> </Text>
      <Text style={{ color: 'yellow' }}>Try scrolling with mouse wheel or arrow keys</Text>
      <Text> </Text>
      <Text>Mouse Events: {() => mouseEvents.value}</Text>
      <Text>Keyboard Events: {() => keyEvents.value}</Text>
      <Text>Last Event: {() => lastEvent.value}</Text>
      <Text> </Text>
      <Text style={{ dim: true }}>Press q to exit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => ScrollDebug(), {
  fps: 10,
  fullscreen: true,
  mouse: true,
});
