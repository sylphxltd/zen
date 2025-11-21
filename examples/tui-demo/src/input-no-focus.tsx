/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, useInput, Static } from '@zen/tui';
import { Box, Text } from '@zen/tui';

interface LogItem {
  id: number;
  message: string;
}

const keyLogs = signal<LogItem[]>([
  { id: 0, message: '[Started] Input test WITHOUT FocusProvider' }
]);
let logId = 1;
const inputValue = signal('');

const SimpleInput = () => {
  // Direct keyboard handler (no focus system)
  useInput((input, key) => {
    logId++;

    // Simple text input logic
    if (input.length === 1 && input >= ' ' && input <= '~') {
      inputValue.value += input;
      keyLogs.value = [
        ...keyLogs.value,
        { id: logId, message: `[${new Date().toLocaleTimeString()}] Added: "${input}" - Total: "${inputValue.value}"` }
      ];
    } else if (key.backspace && inputValue.value.length > 0) {
      inputValue.value = inputValue.value.slice(0, -1);
      keyLogs.value = [
        ...keyLogs.value,
        { id: logId, message: `[${new Date().toLocaleTimeString()}] Backspace - Total: "${inputValue.value}"` }
      ];
    }
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
          <Text bold color="cyan">Simple Input (No FocusProvider)</Text>

          <Box marginTop={1}>
            <Text>Current value: </Text>
            <Text bold color="yellow">{() => inputValue.value || '(empty)'}</Text>
          </Box>

          <Box marginTop={1} dimColor>
            <Text>• 直接處理鍵盤輸入，不使用 TextInput 組件</Text>
          </Box>
          <Box dimColor>
            <Text>• 輸入任意文字測試</Text>
          </Box>
          <Box dimColor>
            <Text>• 如果這個能用，說明問題在 Focus 系統</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const cleanup = await renderToTerminalReactive(() => <SimpleInput />);

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
