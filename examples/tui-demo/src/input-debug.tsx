/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, useInput, Static } from '@zen/tui';
import { Box, Text } from '@zen/tui';

interface LogItem {
  id: number;
  message: string;
}

const keyLogs = signal<LogItem[]>([
  { id: 0, message: '[Started] Press any key to test keyboard input' }
]);
let logId = 1;

const InputDebug = () => {
  // Log ALL keyboard input
  useInput((input, key) => {
    logId++;
    const keyInfo = `Key: "${input}" (code: ${input.charCodeAt(0)}) - Tab:${key.tab} Enter:${key.return} Backspace:${key.backspace}`;
    keyLogs.value = [
      ...keyLogs.value,
      { id: logId, message: `[${new Date().toLocaleTimeString()}] ${keyInfo}` }
    ];
  });

  return (
    <>
      {/* Static logs */}
      <Static items={() => keyLogs.value}>
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
          <Text bold color="cyan">Keyboard Input Debug</Text>
          <Box marginTop={1}>
            <Text>Total keys pressed: </Text>
            <Text bold>{() => keyLogs.value.length - 1}</Text>
          </Box>
          <Box marginTop={1} dimColor>
            <Text>• Press any key to see debug info</Text>
          </Box>
          <Box dimColor>
            <Text>• Press Ctrl+C to exit</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const cleanup = await renderToTerminalReactive(() => <InputDebug />);

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
