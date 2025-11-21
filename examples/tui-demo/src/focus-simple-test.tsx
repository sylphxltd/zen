/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, useInput, FocusProvider, useFocus } from '@zen/tui';
import { Box, Text } from '@zen/tui';

const keyLog = signal('No keys pressed yet');

const TestComponent = () => {
  const { isFocused } = useFocus({ id: 'test', autoFocus: true });

  // Log focus state on every render
  console.log('Component render - isFocused.value:', isFocused.value);

  useInput((input, key) => {
    console.log('useInput triggered - input:', input, 'isFocused.value:', isFocused.value);

    if (!isFocused.value) {
      console.log('Blocked by focus check');
      return;
    }

    console.log('Passed focus check!');
    keyLog.value = `Key: "${input}" at ${new Date().toLocaleTimeString()}`;
  });

  return (
    <Box flexDirection="column">
      <Text bold>Focus Simple Test</Text>
      <Box marginTop={1}>
        <Text>Focus state: </Text>
        <Text color="yellow" bold>{() => isFocused.value ? 'FOCUSED ✓' : 'not focused ✗'}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>Last key: </Text>
        <Text color="cyan">{() => keyLog.value}</Text>
      </Box>
      <Box marginTop={1} dimColor>
        <Text>• Check console for debug output</Text>
      </Box>
      <Box dimColor>
        <Text>• Press any key to test</Text>
      </Box>
    </Box>
  );
};

const cleanup = await renderToTerminalReactive(() => (
  <FocusProvider>
    <TestComponent />
  </FocusProvider>
));

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
