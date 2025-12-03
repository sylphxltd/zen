/** @jsxImportSource @rapid/tui */
/**
 * Debug absolute positioning with ASCII art
 */

import { Box, FullscreenLayout, Text, renderApp, useInput } from '@rapid/tui';

function App() {
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width: 80, height: 20 }}>
      <Text style={{ bold: true }}>Absolute Positioning Debug - ESC to exit</Text>

      {/* Test 1: Relative positioned (should work) */}
      <Box style={{ borderStyle: 'single', width: 30, marginTop: 1 }}>
        <Box style={{ flexDirection: 'column', padding: 1 }}>
          <Text style={{ color: 'cyan' }}>Relative:</Text>
          <Text style={{ color: 'cyan' }}>███████╗</Text>
          <Text style={{ color: 'cyan' }}>╚══███╔╝</Text>
        </Box>
      </Box>

      {/* Test 2: Absolute positioned (might break) */}
      <Box style={{ position: 'relative', height: 10 }}>
        <Box
          style={{
            position: 'absolute',
            left: 5,
            top: 2,
            width: 30,
            borderStyle: 'single',
          }}
        >
          <Box style={{ flexDirection: 'column', padding: 1 }}>
            <Text style={{ color: 'cyan' }}>Absolute:</Text>
            <Text style={{ color: 'cyan' }}>███████╗</Text>
            <Text style={{ color: 'cyan' }}>╚══███╔╝</Text>
          </Box>
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
