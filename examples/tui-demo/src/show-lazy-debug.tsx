/** @jsxImportSource @zen/tui */
import { renderToTerminalReactive } from '@zen/tui';
import { Box, Text } from '@zen/tui';
import { Show } from '@zen/runtime';
import { signal } from '@zen/runtime';

console.log('=== Show Lazy Debug Test ===\n');

let step = 1;
const log = (msg: string) => console.log(`[Step ${step++}] ${msg}`);

const ExpensiveChild = () => {
  log('❌ ExpensiveChild EXECUTED!');
  return <Text color="red">Expensive</Text>;
};

const App = () => {
  log('App started');
  const condition = signal(false);

  log(`Creating Show with when=${condition.value}`);

  const result = (
    <Box flexDirection="column" padding={1}>
      <Show when={() => {
        log(`Show.when() called, returning ${condition.value}`);
        return condition.value;
      }}>
        <ExpensiveChild />
      </Show>
    </Box>
  );

  log('App finished, returning JSX');
  return result;
};

log('Starting render...');
const cleanup = await renderToTerminalReactive(() => <App />);

setTimeout(() => {
  log('Cleaning up...');
  cleanup();
  process.exit(0);
}, 1000);
