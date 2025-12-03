/** @jsxImportSource @rapid/tui */
/**
 * Test window with same structure as main.tsx - to verify close button fix
 */

import { Box, FullscreenLayout, Text, renderApp, useInput, useTerminalSize } from '@rapid/tui';

function App() {
  const { width, height } = useTerminalSize();

  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width, height }}>
      <Text style={{ bold: true }}>Window Test (like ZenOS main.tsx) - ESC to exit</Text>

      <Box style={{ position: 'relative', flex: 1 }}>
        {/* Window - same structure as main.tsx */}
        <Box
          style={{
            position: 'absolute',
            left: 15,
            top: 3,
            width: 45,
            height: 12,
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: 'cyan',
          }}
        >
          {/* Title bar - WITH flexDirection: 'row' */}
          <Box
            style={{
              backgroundColor: 'blue',
              paddingLeft: 1,
              paddingRight: 1,
              justifyContent: 'space-between',
              flexDirection: 'row',
            }}
          >
            <Text style={{ color: 'white', bold: true }}>🖥️ Terminal</Text>
            <Box style={{ flexDirection: 'row', gap: 1 }}>
              <Text style={{ color: 'red' }}>✕</Text>
            </Box>
          </Box>

          {/* Content */}
          <Box style={{ padding: 1, flex: 1 }}>
            <Box style={{ flexDirection: 'column' }}>
              <Text style={{ color: 'green' }}>$ neofetch</Text>
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
