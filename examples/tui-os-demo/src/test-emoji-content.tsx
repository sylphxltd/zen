/** @jsxImportSource @rapid/tui */
/**
 * Test emoji in content only (not in title)
 */

import { Box, FullscreenLayout, Text, renderApp, useInput, useTerminalSize } from '@rapid/tui';

function App() {
  const { width, height } = useTerminalSize();

  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width, height }}>
      <Text style={{ bold: true }}>Emoji in Content Only - ESC to exit</Text>

      <Box style={{ position: 'relative', flex: 1 }}>
        <Box
          style={{
            position: 'absolute',
            left: 5,
            top: 2,
            width: 45,
            height: 12,
            flexDirection: 'column',
            borderStyle: 'single',
          }}
        >
          {/* Title bar WITHOUT emoji */}
          <Box
            style={{
              backgroundColor: 'blue',
              paddingLeft: 1,
              paddingRight: 1,
            }}
          >
            <Text style={{ color: 'white', bold: true }}>Terminal</Text>
          </Box>

          {/* Content WITH emoji */}
          <Box style={{ padding: 1, flex: 1 }}>
            <Box style={{ flexDirection: 'column' }}>
              <Text style={{ color: 'green' }}>$ neofetch 🖥️</Text>
              <Text style={{ color: 'cyan' }}>███████╗███████╗███╗ ██╗</Text>
              <Text style={{ color: 'cyan' }}>╚══███╔╝██╔════╝████╗ ██║</Text>
              <Text style={{ color: 'cyan' }}> ███╔╝ █████╗ ██╔██╗ ██║</Text>
            </Box>
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
