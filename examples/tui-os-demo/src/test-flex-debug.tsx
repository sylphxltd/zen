/** @jsxImportSource @rapid/tui */
/**
 * Debug flex layout to understand why text disappears
 */

import { Box, FullscreenLayout, Text, renderApp, useInput } from '@rapid/tui';

function App() {
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width: 50, height: 20 }}>
      <Text style={{ bold: true }}>Flex Layout Debug - ESC to exit</Text>
      <Text> </Text>

      {/* Test 1: Fixed height, no flex */}
      <Box
        style={{
          borderStyle: 'single',
          width: 40,
          height: 3,
          marginBottom: 1,
          flexDirection: 'column',
        }}
      >
        <Box style={{ padding: 1 }}>
          <Text>Test 1: Fixed height</Text>
        </Box>
      </Box>

      {/* Test 2: Fixed height, with flex:1 on inner box */}
      <Box
        style={{
          borderStyle: 'single',
          width: 40,
          height: 3,
          marginBottom: 1,
          flexDirection: 'column',
        }}
      >
        <Box style={{ padding: 1, flex: 1, flexDirection: 'row' }}>
          <Text>Test 2: Flex:1 inner</Text>
        </Box>
      </Box>

      {/* Test 3: Auto height, with flex:1 on inner box */}
      <Box
        style={{
          borderStyle: 'single',
          width: 40,
          height: 5,
          marginBottom: 1,
          flexDirection: 'column',
        }}
      >
        <Text style={{ padding: 1 }}>Title</Text>
        <Box style={{ padding: 1, flex: 1, flexDirection: 'column' }}>
          <Text>Test 3: Content</Text>
        </Box>
      </Box>
    </Box>
  );
}

await renderApp(() => (
  <FullscreenLayout>
    <App />
  </FullscreenLayout>
));
