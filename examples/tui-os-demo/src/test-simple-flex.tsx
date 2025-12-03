/** @jsxImportSource @rapid/tui */
/**
 * Simplest possible flex test
 */

import { Box, FullscreenLayout, Text, renderApp, useInput } from '@rapid/tui';

function App() {
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width: 50, height: 10 }}>
      <Text>Outside box</Text>

      <Box style={{ borderStyle: 'single', width: 40, height: 5, flexDirection: 'column' }}>
        <Text style={{ padding: 1 }}>Direct child text</Text>

        <Box style={{ flex: 1, flexDirection: 'row', paddingLeft: 1 }}>
          <Text>Text in flex:1 box</Text>
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
