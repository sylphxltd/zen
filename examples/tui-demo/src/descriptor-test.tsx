/** @jsxImportSource @zen/tui */
import { FocusProvider, renderToTerminalReactive, useFocusManager } from '@zen/tui';
import { Box, Text } from '@zen/tui';

const TestChild = () => {
  try {
    const _manager = useFocusManager();
    return <Text color="green">✓ Context propagation WORKS with descriptor pattern!</Text>;
  } catch (_error: any) {
    return <Text color="red">✗ Context not found</Text>;
  }
};

const App = () => {
  return (
    <FocusProvider>
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>
          Descriptor Pattern Test
        </Text>
        <Text>{''}</Text>
        <TestChild />
        <Text>{''}</Text>
        <Text dimColor>
          This uses standard JSX: &lt;Provider&gt;&lt;Child /&gt;&lt;/Provider&gt;
        </Text>
        <Text dimColor>No manual lazy children needed!</Text>
      </Box>
    </FocusProvider>
  );
};

const cleanup = await renderToTerminalReactive(() => <App />);

// Auto-exit after 1 second
setTimeout(() => {
  cleanup();
  process.exit(0);
}, 1000);
