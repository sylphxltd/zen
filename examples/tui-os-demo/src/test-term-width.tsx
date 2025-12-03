/** @jsxImportSource @rapid/tui */
/**
 * Test terminal width detection
 */

import { Box, FullscreenLayout, Text, renderApp, useInput, useTerminalSize } from '@rapid/tui';

function App() {
  const { width, height } = useTerminalSize();

  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width, height }}>
      <Text style={{ bold: true }}>Terminal Size Test - ESC to exit</Text>
      <Text> </Text>
      <Text>Terminal width: {width}</Text>
      <Text>Terminal height: {height}</Text>
      <Text> </Text>
      <Text>Window at x=15, width=45 means right edge at x={15 + 45 - 1}</Text>
      <Text>Window at x=5, width=50 means right edge at x={5 + 50 - 1}</Text>
      <Text> </Text>
      <Text>Ruler (every 10 chars):</Text>
      <Text>0---------1---------2---------3---------4---------5---------6---------7---------</Text>
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <App />
  </FullscreenLayout>
));
