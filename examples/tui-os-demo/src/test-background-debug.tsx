/** @jsxImportSource @rapid/tui */
/**
 * Debug background color rendering
 */

import { Box, FullscreenLayout, Text, renderApp, useInput } from '@rapid/tui';

function App() {
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width: 60, height: 15 }}>
      <Text style={{ bold: true }}>Background Debug - ESC to exit</Text>
      <Text> </Text>

      {/* Test 1: Simple box with background */}
      <Box style={{ backgroundColor: 'blue', width: 40, height: 1, marginBottom: 1 }}>
        <Text style={{ color: 'white' }}>Test 1: Simple text</Text>
      </Box>

      {/* Test 2: Box with flexDirection row and space-between */}
      <Box
        style={{
          backgroundColor: 'blue',
          width: 40,
          height: 1,
          marginBottom: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingLeft: 1,
          paddingRight: 1,
        }}
      >
        <Text style={{ color: 'white' }}>Left</Text>
        <Text style={{ color: 'red' }}>Right</Text>
      </Box>

      {/* Test 3: Same but with emoji */}
      <Box
        style={{
          backgroundColor: 'blue',
          width: 40,
          height: 1,
          marginBottom: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingLeft: 1,
          paddingRight: 1,
        }}
      >
        <Text style={{ color: 'white' }}>🖥️ Left</Text>
        <Text style={{ color: 'red' }}>✕</Text>
      </Box>
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <App />
  </FullscreenLayout>
));
