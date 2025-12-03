/** @jsxImportSource @rapid/tui */
/**
 * Simple ASCII art test - run this and check if it renders correctly
 * Press ESC to exit
 */

import { Box, FullscreenLayout, Text, renderApp, useInput } from '@rapid/tui';

function App() {
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width: 50, height: 15 }}>
      <Text style={{ bold: true }}>Simple ASCII Test - Press ESC to exit</Text>
      <Text> </Text>

      {/* Test 1: Plain box drawing */}
      <Text style={{ color: 'cyan' }}>Test 1 - Plain:</Text>
      <Text style={{ color: 'cyan' }}>███████╗</Text>
      <Text style={{ color: 'cyan' }}>╚══███╔╝</Text>
      <Text style={{ color: 'cyan' }}> ███╔╝</Text>
      <Text> </Text>

      {/* Test 2: Inside a bordered box */}
      <Text style={{ color: 'green' }}>Test 2 - In Box:</Text>
      <Box style={{ borderStyle: 'single', borderColor: 'cyan', width: 30 }}>
        <Box style={{ flexDirection: 'column', padding: 1 }}>
          <Text style={{ color: 'cyan' }}>███████╗</Text>
          <Text style={{ color: 'cyan' }}>╚══███╔╝</Text>
          <Text style={{ color: 'cyan' }}> ███╔╝</Text>
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
