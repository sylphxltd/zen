/** @jsxImportSource @rapid/tui */
/**
 * Test with useTerminalSize - does dynamic size break it?
 */

import { Box, FullscreenLayout, Text, renderApp, useInput, useTerminalSize } from '@rapid/tui';

function App() {
  const { width, height } = useTerminalSize();

  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width, height }}>
      <Text style={{ bold: true }}>
        Terminal Size: {width}x{height} - ESC to exit
      </Text>

      {/* Absolute positioned box with ASCII art */}
      <Box style={{ position: 'relative', flex: 1 }}>
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
            <Text style={{ color: 'cyan' }}>███████╗███████╗</Text>
            <Text style={{ color: 'cyan' }}>╚══███╔╝██╔════╝</Text>
            <Text style={{ color: 'cyan' }}> ███╔╝ █████╗</Text>
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
