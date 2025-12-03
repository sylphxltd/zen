/** @jsxImportSource @rapid/tui */
import { Box, FullscreenLayout, Text, renderApp, useInput } from '@rapid/tui';

function App() {
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', width: 80, height: 20 }}>
      <Text style={{ bold: true }}>Small Window Test - ESC to exit</Text>
      <Text> </Text>

      {/* Small window */}
      <Box
        style={{
          width: 40,
          height: 8,
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
            flexDirection: 'row',
          }}
        >
          <Text style={{ color: 'white', bold: true }}>Terminal</Text>
          <Text style={{ color: 'red' }}>X</Text>
        </Box>

        {/* Content */}
        <Box style={{ padding: 1, flex: 1 }}>
          <Box style={{ flexDirection: 'column' }}>
            <Text style={{ color: 'green' }}>Line 1: Hello World</Text>
            <Text style={{ color: 'cyan' }}>Line 2: ABC</Text>
            <Text style={{ color: 'yellow' }}>Line 3: 012</Text>
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
