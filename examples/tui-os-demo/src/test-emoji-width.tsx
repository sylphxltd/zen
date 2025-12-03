/** @jsxImportSource @rapid/tui */
/**
 * Test different emojis to see which ones break
 */

import { Box, FullscreenLayout, Text, renderApp, useInput } from '@rapid/tui';

function App() {
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width: 60, height: 20 }}>
      <Text style={{ bold: true }}>Emoji Width Test - ESC to exit</Text>
      <Text>Check if right borders align</Text>
      <Text> </Text>

      {/* Test different emojis in bordered boxes */}
      <Box style={{ borderStyle: 'single', width: 30, marginBottom: 1 }}>
        <Text>No emoji: ABCD</Text>
      </Box>

      <Box style={{ borderStyle: 'single', width: 30, marginBottom: 1 }}>
        <Text>With 🖥️: ABCD</Text>
      </Box>

      <Box style={{ borderStyle: 'single', width: 30, marginBottom: 1 }}>
        <Text>With 📁: ABCD</Text>
      </Box>

      <Box style={{ borderStyle: 'single', width: 30, marginBottom: 1 }}>
        <Text>With ✕: ABCD</Text>
      </Box>
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <App />
  </FullscreenLayout>
));
