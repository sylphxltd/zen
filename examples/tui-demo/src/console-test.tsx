/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, useInput, Static } from '@zen/tui';
import { Box, Text } from '@zen/tui';

interface LogItem {
  id: number;
  message: string;
}

const staticLogs = signal<LogItem[]>([
  { id: 0, message: '[Started] Waiting for logs...' }
]);
const keyCount = signal(0);
let logId = 1;

const ConsoleTest = () => {
  // 按鍵 = console.log
  useInput((input, _key) => {
    keyCount.value++;
    const keyName = input === ' ' ? 'space' : input === '\r' ? 'enter' : input;
    console.log(`Key: "${keyName}"`);
  });

  return (
    <>
      {/* Static items - 每秒自動生成 */}
      <Static items={() => staticLogs.value}>
        {(log) => (
          <Box key={log.id}>
            <Text color="cyan" bold>▸ [STATIC] </Text>
            <Text color="white">{log.message}</Text>
          </Box>
        )}
      </Static>

      {/* Dynamic UI */}
      <Box borderStyle="round" borderColor="cyan" padding={1} marginTop={1}>
        <Box flexDirection="column">
          <Text bold color="cyan">Console.log + Static Test</Text>
          <Box marginTop={1}>
            <Text>Keys pressed: </Text>
            <Text bold>{() => keyCount.value}</Text>
          </Box>
          <Box marginTop={1}>
            <Text>Static logs: </Text>
            <Text bold>{() => staticLogs.value.length}</Text>
          </Box>
          <Box marginTop={1} dimColor>
            <Text>• Press any key → console.log</Text>
          </Box>
          <Box dimColor>
            <Text>• Auto log every 1s → Static item</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};

const cleanup = await renderToTerminalReactive(() => <ConsoleTest />);

// 每秒生成一個 random Static log item
const interval = setInterval(() => {
  logId++;
  const messages = [
    'Processing task...',
    'Database query completed',
    'Cache updated',
    'Request received',
    'Response sent',
    'Background job running',
  ];
  const randomMsg = messages[Math.floor(Math.random() * messages.length)];

  staticLogs.value = [
    ...staticLogs.value,
    { id: logId, message: `[${new Date().toLocaleTimeString()}] ${randomMsg}` },
  ];
}, 1000);

// Cleanup
process.on('SIGINT', () => {
  clearInterval(interval);
  cleanup();
  process.exit(0);
});
