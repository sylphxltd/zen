import { signal } from '@zen/signal';
import { renderToTerminalReactive } from '@zen/tui';
import { Box, FocusProvider, Text } from '@zen/tui';

const counter = signal(0);

// Increment counter every second, with console output
setInterval(() => {
  counter.value++;
  console.log(`Counter updated to: ${counter.value}`);
}, 1000);

const ConsoleTest = () => {
  return (
    <Box
      style={{
        flexDirection: 'column',
        gap: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        padding: 1,
      }}
    >
      <Text bold color="cyan">
        Console.log Test
      </Text>
      <Text>This tests that console.log appears ABOVE the app (React Ink style)</Text>
      <Text dim>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

      <Text>
        Counter:{' '}
        <Text bold color="green">
          {counter}
        </Text>
      </Text>
      <Text dim>(Increments every second with console.log)</Text>

      <Text dim style={{ marginTop: 1 }}>
        Press Ctrl+C to exit
      </Text>
    </Box>
  );
};

await renderToTerminalReactive(() => (
  <FocusProvider>
    <ConsoleTest />
  </FocusProvider>
));
