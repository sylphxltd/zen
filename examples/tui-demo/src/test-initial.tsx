/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, Static, Box, Text } from '@zen/tui';

interface LogItem {
  id: number;
  message: string;
}

const staticLogs = signal<LogItem[]>([
  { id: 0, message: '[Started] Initial static log' }
]);

const App = () => (
  <>
    <Static items={() => staticLogs.value}>
      {(log) => (
        <Box key={log.id}>
          <Text color="cyan" bold>▸ [STATIC] </Text>
          <Text color="white">{log.message}</Text>
        </Box>
      )}
    </Static>

    <Box borderStyle="round" borderColor="cyan" padding={1} marginTop={1}>
      <Text bold>Test: Initial Static Log</Text>
      <Text>Static logs: {() => staticLogs.value.length}</Text>
    </Box>
  </>
);

const cleanup = await renderToTerminalReactive(() => <App />);

setTimeout(() => {
  cleanup();
  process.exit(0);
}, 1000);
