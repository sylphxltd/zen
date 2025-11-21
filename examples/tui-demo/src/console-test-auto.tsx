/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, Static } from '@zen/tui';
import { Box, Text } from '@zen/tui';

interface LogItem {
  id: number;
  message: string;
}

const staticLogs = signal<LogItem[]>([]);
let logId = 0;

const ConsoleTest = () => {
  return (
    <>
      {/* Static items */}
      <Static items={() => staticLogs.value}>
        {(log) => (
          <Box key={log.id}>
            <Text color="cyan">▸ </Text>
            <Text>{log.message}</Text>
          </Box>
        )}
      </Static>

      {/* Dynamic UI */}
      <Box borderStyle="round" borderColor="cyan" padding={1} marginTop={1}>
        <Box flexDirection="column">
          <Text bold color="cyan">Console.log + Static Test (Auto)</Text>
          <Box marginTop={1}>
            <Text>Static logs: </Text>
            <Text bold>{() => staticLogs.value.length}</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const cleanup = await renderToTerminalReactive(() => <ConsoleTest />);

// Test: Generate 3 static items
setTimeout(() => {
  logId++;
  staticLogs.value = [...staticLogs.value, { id: logId, message: `Log ${logId}` }];
  console.log('Added log 1');
}, 500);

setTimeout(() => {
  logId++;
  staticLogs.value = [...staticLogs.value, { id: logId, message: `Log ${logId}` }];
  console.log('Added log 2');
}, 1000);

setTimeout(() => {
  logId++;
  staticLogs.value = [...staticLogs.value, { id: logId, message: `Log ${logId}` }];
  console.log('Added log 3');
}, 1500);

setTimeout(() => {
  cleanup();
  process.exit(0);
}, 2000);
