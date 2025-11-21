/**
 * Automated test for Static component
 * Simulates key presses to test Static item accumulation
 */

import { signal } from '@zen/signal';
import { Box, Text, Static, renderToTerminalReactive, dispatchInput } from '@zen/tui';

interface LogEntry {
  id: number;
  message: string;
}

const logs = signal<LogEntry[]>([]);
const counter = signal(0);

function App() {
  return (
    <>
      {/* Static content - should accumulate */}
      <Static items={() => logs.value}>
        {(log) => (
          <Box key={log.id}>
            <Text color="green">✔ </Text>
            <Text>Log {log.id}: {log.message}</Text>
          </Box>
        )}
      </Static>

      {/* Dynamic content */}
      <Box borderStyle="round" borderColor="cyan" padding={1}>
        <Box flexDirection="column">
          <Box>
            <Text bold color="cyan">Static Test (Auto)</Text>
          </Box>
          <Box marginTop={1}>
            <Text>Count: </Text>
            <Text bold>{() => counter.value}</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
}

renderToTerminalReactive(() => <App />);

// Simulate key presses after a short delay
setTimeout(() => {
  counter.value++;
  logs.value = [...logs.value, { id: counter.value, message: 'First log' }];
}, 100);

setTimeout(() => {
  counter.value++;
  logs.value = [...logs.value, { id: counter.value, message: 'Second log' }];
}, 200);

setTimeout(() => {
  counter.value++;
  logs.value = [...logs.value, { id: counter.value, message: 'Third log' }];
}, 300);

setTimeout(() => {
  process.exit(0);
}, 500);
