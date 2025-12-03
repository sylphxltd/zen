/** @jsxImportSource @rapid/tui */
/**
 * Minimal test: emoji + flex:1 + border
 * Testing if right border is off by 1 column with emoji
 */

import { Box, FullscreenLayout, Text, renderApp, useInput } from '@rapid/tui';

function App() {
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width: 50, height: 15 }}>
      <Text style={{ bold: true }}>Emoji + Flex + Border Test - ESC to exit</Text>
      <Text> </Text>

      {/* Test 1: No flex, no emoji */}
      <Box style={{ borderStyle: 'single', width: 40, marginBottom: 1 }}>
        <Box style={{ padding: 1 }}>
          <Text>Line 1: No emoji</Text>
        </Box>
      </Box>

      {/* Test 2: With flex:1, no emoji */}
      <Box
        style={{
          borderStyle: 'single',
          width: 40,
          marginBottom: 1,
          height: 3,
          flexDirection: 'column',
        }}
      >
        <Box style={{ padding: 1, flex: 1 }}>
          <Text>Line 2: No emoji + flex:1</Text>
        </Box>
      </Box>

      {/* Test 3: With flex:1, WITH emoji */}
      <Box
        style={{
          borderStyle: 'single',
          width: 40,
          marginBottom: 1,
          height: 3,
          flexDirection: 'column',
        }}
      >
        <Box style={{ padding: 1, flex: 1 }}>
          <Text>Line 3: Emoji 🖥️ + flex:1</Text>
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
