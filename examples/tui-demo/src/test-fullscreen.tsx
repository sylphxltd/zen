/** @jsxImportSource @zen/tui */
import { Box, FullscreenLayout, Text, render, useInput } from '@zen/tui';

function App() {
  useInput((input, _key) => {
    // Press q to quit
    if (input === 'q') {
      process.exit(0);
    }
  });

  return (
    <Box borderStyle="round" borderColor="cyan" padding={1}>
      <Box style={{ flexDirection: 'column' }}>
        <Text bold color="cyan">
          Fullscreen Test
        </Text>
        <Text>Press 'q' to quit</Text>
      </Box>
    </Box>
  );
}

await render(() => (
  <FullscreenLayout>
    <App />
  </FullscreenLayout>
));
