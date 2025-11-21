/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, useInput, Static } from '@zen/tui';
import { Box, Text, TextInput, FocusProvider } from '@zen/tui';

interface LogItem {
  id: number;
  message: string;
}

const debugLogs = signal<LogItem[]>([
  { id: 0, message: '[Started] Focus debug test' }
]);
let logId = 1;

const username = signal('');
const inputFocused = signal(false);

const FocusDebug = () => {
  // Log all keyboard input
  useInput((input, key) => {
    logId++;
    const keyInfo = `Key: "${input}" - Input focused: ${inputFocused.value}`;
    debugLogs.value = [
      ...debugLogs.value,
      { id: logId, message: `[${new Date().toLocaleTimeString()}] ${keyInfo}` }
    ];
  });

  return (
    <>
      {/* Static logs */}
      <Static items={() => debugLogs.value}>
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
          <Text bold color="cyan">Focus Debug</Text>

          <Box marginTop={1}>
            <Text>Input focused: </Text>
            <Text bold color="yellow">{() => inputFocused.value ? 'YES' : 'NO'}</Text>
          </Box>

          <Box marginTop={1}>
            <Text>Current value: </Text>
            <Text bold>{() => username.value || '(empty)'}</Text>
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text bold>Test Input:</Text>
            <TextInput
              id="test-input"
              value={username}
              placeholder="Type here..."
              width={40}
              onChange={(value) => {
                username.value = value;
                logId++;
                debugLogs.value = [
                  ...debugLogs.value,
                  { id: logId, message: `[${new Date().toLocaleTimeString()}] Input changed: "${value}"` }
                ];
              }}
            />
          </Box>

          <Box marginTop={1} dimColor>
            <Text>• 第一個輸入框應該自動 focus（藍色邊框）</Text>
          </Box>
          <Box dimColor>
            <Text>• 輸入文字應該出現在框內</Text>
          </Box>
          <Box dimColor>
            <Text>• 按任意鍵查看 focus ID 和 key info</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const cleanup = await renderToTerminalReactive(() => (
  <FocusProvider>
    <FocusDebug />
  </FocusProvider>
));

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
