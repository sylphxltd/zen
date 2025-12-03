/** @jsxImportSource @rapid/tui */
/**
 * Test ZenOS-style window with ASCII art
 * This mimics the exact structure from ZenOS
 */

import { Box, Text, renderApp, useInput, useTerminalSize } from '@rapid/tui';

function TerminalContent() {
  return (
    <Box style={{ flexDirection: 'column' }}>
      <Text style={{ color: 'green' }}>$ neofetch</Text>
      <Text style={{ color: 'cyan' }}>███████╗███████╗███╗ ██╗</Text>
      <Text style={{ color: 'cyan' }}>╚══███╔╝██╔════╝████╗ ██║</Text>
      <Text style={{ color: 'cyan' }}> ███╔╝ █████╗ ██╔██╗ ██║</Text>
      <Text style={{ color: 'cyan' }}> ███╔╝ ██╔══╝ ██║╚██╗██║</Text>
      <Text style={{ color: 'cyan' }}>███████╗███████╗██║ ╚████║</Text>
      <Text style={{ color: 'cyan' }}>╚══════╝╚══════╝╚═╝ ╚═══╝</Text>
      <Text style={{ color: 'green' }}>$ _</Text>
    </Box>
  );
}

function App() {
  const { width, height } = useTerminalSize();

  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width, height }}>
      {/* Menu bar */}
      <Box style={{ backgroundColor: 'gray', paddingLeft: 1 }}>
        <Text style={{ color: 'cyan', bold: true }}>🍎 ZenOS - ESC to exit</Text>
      </Box>

      {/* Main area with absolute positioned window */}
      <Box style={{ flex: 1, position: 'relative' }}>
        {/* Terminal Window */}
        <Box
          style={{
            position: 'absolute',
            left: 15,
            top: 3,
            width: 45,
            height: 12,
            zIndex: 1,
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: 'cyan',
          }}
        >
          {/* Title bar */}
          <Box
            style={{
              backgroundColor: 'blue',
              paddingLeft: 1,
              paddingRight: 1,
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: 'white', bold: true }}>🖥️ Terminal</Text>
            <Text style={{ color: 'red' }}>✕</Text>
          </Box>
          {/* Content */}
          <Box style={{ padding: 1, flex: 1 }}>
            <TerminalContent />
          </Box>
        </Box>
      </Box>

      {/* Task bar */}
      <Box style={{ backgroundColor: 'gray', paddingLeft: 1, height: 1 }}>
        <Text style={{ color: 'white', bold: true }}>🚀 Start</Text>
      </Box>
    </Box>
  );
}

await renderApp(() => <App />, { fullscreen: true, mouse: true });
