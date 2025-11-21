import { Show } from '@zen/runtime';
import { signal } from '@zen/runtime';
/** @jsxImportSource @zen/tui */
import { renderToTerminalReactive } from '@zen/tui';
import { Box, Text } from '@zen/tui';

let expensiveChildExecuted = false;

const ExpensiveChild = () => {
  expensiveChildExecuted = true;
  return <Text color="red">Expensive Child Rendered</Text>;
};

const CheapChild = () => {
  return <Text color="green">Cheap Child Rendered</Text>;
};

const App = () => {
  const condition = signal(false);

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>
        Show Lazy Execution Test
      </Text>
      <Text>{''}</Text>

      <Text>Test 1: when=false (ExpensiveChild should NOT execute)</Text>
      <Show when={() => condition.value}>
        <ExpensiveChild />
      </Show>

      <Text>{''}</Text>
      <Text>Test 2: when=true (CheapChild should execute)</Text>
      <Show when={() => true}>
        <CheapChild />
      </Show>

      <Text>{''}</Text>
      {expensiveChildExecuted ? (
        <Text color="red">❌ FAILED: ExpensiveChild executed when when=false!</Text>
      ) : (
        <Text color="green">✅ PASSED: ExpensiveChild did NOT execute!</Text>
      )}
    </Box>
  );
};

const cleanup = await renderToTerminalReactive(() => <App />);

setTimeout(() => {
  if (expensiveChildExecuted) {
  } else {
  }
  cleanup();
  process.exit(expensiveChildExecuted ? 1 : 0);
}, 1000);
