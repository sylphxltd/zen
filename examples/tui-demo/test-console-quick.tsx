/** @jsxImportSource @rapid/tui */
import { signal } from '@rapid/signal';
import { Static, renderApp } from '@rapid/tui';
import { Box, Text } from '@rapid/tui';

interface LogItem {
  id: number;
  message: string;
}

const staticLogs = signal<LogItem[]>([{ id: 0, message: '[Started] Initial static log' }]);

const ConsoleTest = () => {
  return (
    <>
      <Static items={() => staticLogs.value}>
        {(log) => (
          <Box key={log.id}>
            <Text color="cyan" bold>
              ▸ [STATIC]{' '}
            </Text>
            <Text color="white">{log.message}</Text>
          </Box>
        )}
      </Static>

      <Box borderStyle="round" borderColor="cyan" padding={1} marginTop={1}>
        <Box flexDirection="column">
          <Text bold color="cyan">
            Console.log + Static Test (Quick)
          </Text>
          <Box marginTop={1}>
            <Text>Static logs: </Text>
            <Text bold>{() => staticLogs.value.length}</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const cleanup = await renderApp(() => <ConsoleTest />);

// Test: Add one static log and one console.log
setTimeout(() => {
  staticLogs.value = [...staticLogs.value, { id: 1, message: '[Test] Static log added' }];
}, 200);

// Cleanup after 1 second
setTimeout(() => {
  cleanup();
  process.exit(0);
}, 1000);
