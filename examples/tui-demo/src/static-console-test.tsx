/**
 * Test: Static component + console.log unified buffer
 * Both should appear above app in order
 */

import { signal } from '@zen/signal';
import { Box, Text, Static, renderToTerminalReactive, useInput } from '@zen/tui';

interface LogEntry {
  id: number;
  message: string;
}

const logs = signal<LogEntry[]>([]);
const counter = signal(0);

function App() {
  return (
    <>
      {/* Static component items */}
      <Static items={() => logs.value}>
        {(log) => (
          <Box key={log.id}>
            <Text color="green">✔ </Text>
            <Text>{log.message}</Text>
          </Box>
        )}
      </Static>

      {/* Dynamic content */}
      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Box flexDirection="column">
          <Box>
            <Text bold color="cyan">
              Static + Console.log Test
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text>Count: </Text>
            <Text bold>{() => counter.value}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press any key</Text>
          </Box>
          <Box>
            <Text dimColor>Ctrl+C to exit</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
}

renderToTerminalReactive(() => <App />);

// Auto test
setTimeout(() => {
  counter.value++;
  logs.value = [...logs.value, { id: counter.value, message: `Static ${counter.value}` }];
  console.log(`[CONSOLE.LOG] Test 1 (count: ${counter.value})`);
}, 100);

setTimeout(() => {
  counter.value++;
  console.log(`[CONSOLE.LOG] Test 2 (count: ${counter.value})`);
  logs.value = [...logs.value, { id: counter.value, message: `Static ${counter.value}` }];
}, 200);

setTimeout(() => {
  counter.value++;
  logs.value = [...logs.value, { id: counter.value, message: `Static ${counter.value}` }];
  console.log(`[CONSOLE.LOG] Test 3 (count: ${counter.value})`);
}, 300);

setTimeout(() => {
  process.exit(0);
}, 500);
