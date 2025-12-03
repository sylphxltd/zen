/** @jsxImportSource @rapid/tui */
/**
 * Debug border rendering
 */

import { Box, FullscreenLayout, Text, renderApp, useInput } from '@rapid/tui';

function App() {
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width: 60, height: 20 }}>
      <Text style={{ bold: true }}>Border Debug - ESC to exit</Text>
      <Text> </Text>

      {/* Test 1: Small box */}
      <Box
        style={{
          width: 20,
          height: 3,
          borderStyle: 'single',
          borderColor: 'cyan',
        }}
      >
        <Text>Test 1</Text>
      </Box>

      <Text> </Text>

      {/* Test 2: Medium box */}
      <Box
        style={{
          width: 40,
          height: 3,
          borderStyle: 'single',
          borderColor: 'green',
        }}
      >
        <Text>Test 2 - Medium</Text>
      </Box>

      <Text> </Text>

      {/* Test 3: Box with background */}
      <Box
        style={{
          width: 30,
          height: 3,
          borderStyle: 'single',
          borderColor: 'yellow',
          backgroundColor: 'blue',
        }}
      >
        <Text style={{ color: 'white' }}>Test 3 - BG</Text>
      </Box>
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <App />
  </FullscreenLayout>
));
