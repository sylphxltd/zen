/** @jsxImportSource @zen/tui */
/**
 * Simple Mouse Test
 */

import { signal } from '@zen/signal';
import { renderToTerminalReactive, useMouseClick, useMouseScroll } from '@zen/tui';
import { Box, Text } from '@zen/tui';

function App() {
  const clicks = signal(0);
  const scrolls = signal(0);

  useMouseClick(() => {
    clicks.value++;
  });

  useMouseScroll(() => {
    scrolls.value++;
  });

  return (
    <Box style={{ padding: 1 }}>
      <Text>Clicks: {() => clicks.value} | Scrolls: {() => scrolls.value}</Text>
      <Text>Press q to quit</Text>
    </Box>
  );
}

await renderToTerminalReactive(() => App(), {
  fps: 10,
  fullscreen: true,
  mouse: true
});
