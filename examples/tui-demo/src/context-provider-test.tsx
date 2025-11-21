import { ContextProvider, createContext, useContext } from '@zen/runtime';
/** @jsxImportSource @zen/tui */
import { FocusProvider, renderToTerminalReactive, useFocusManager } from '@zen/tui';
import { Box, Text } from '@zen/tui';

// Create a test context
const TestContext = createContext<{ message: string } | null>(null);

const TestChild = () => {
  try {
    const ctx = useContext(TestContext);
    if (!ctx) {
      return <Text color="red">✗ Context is null</Text>;
    }
    return <Text color="green">✓ Context works! Message: {ctx.message}</Text>;
  } catch (error: any) {
    return <Text color="red">✗ Error: {error.message}</Text>;
  }
};

const App = () => {
  return (
    <ContextProvider context={TestContext} value={{ message: 'Hello from ContextProvider!' }}>
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>
          ContextProvider Helper Test
        </Text>
        <Text>{''}</Text>
        <TestChild />
        <Text>{''}</Text>
        <Text dimColor>Using ContextProvider helper - pure JSX!</Text>
        <Text dimColor>No manual getters needed</Text>
      </Box>
    </ContextProvider>
  );
};

const cleanup = await renderToTerminalReactive(() => <App />);

setTimeout(() => {
  cleanup();
  process.exit(0);
}, 1000);
