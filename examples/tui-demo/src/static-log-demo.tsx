/**
 * Demo: Static Component with Accumulating Logs (React Ink style)
 *
 * Demonstrates:
 * - Static items that accumulate and persist in terminal scrollback
 * - New items append above the dynamic UI
 * - Dynamic UI updates in-place below static content
 * - Similar to React Ink's <Static> behavior
 */

import { signal } from '@zen/signal';
import { Box, Text, Static, renderToTerminalReactive, useInput } from '@zen/tui';

interface LogEntry {
  id: number;
  message: string;
  timestamp: string;
}

const logs = signal<LogEntry[]>([]);
const counter = signal(0);

function App() {
  useInput((input, _key) => {
    counter.value++;

    // Add new log entry (accumulates)
    const newLog: LogEntry = {
      id: counter.value,
      message: `Key pressed: "${input}"`,
      timestamp: new Date().toLocaleTimeString(),
    };

    logs.value = [...logs.value, newLog];
  });

  return (
    <>
      {/* Static content - accumulates and persists in terminal history */}
      <Static items={() => logs.value}>
        {(log) => (
          <Box key={log.id}>
            <Text color="green">✔ </Text>
            <Text color="gray">[{log.timestamp}]</Text>
            <Text> {log.message}</Text>
          </Box>
        )}
      </Static>

      {/* Dynamic content - updates in-place below static items */}
      <Box borderStyle="round" borderColor="cyan" padding={1} marginTop={1}>
        <Box flexDirection="column">
          <Box>
            <Text bold color="cyan">
              Static Component Demo
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text>Total keys pressed: </Text>
            <Text bold>{() => counter.value}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press any key to add a log entry above</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press Ctrl+C to exit</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
}

renderToTerminalReactive(() => <App />);
