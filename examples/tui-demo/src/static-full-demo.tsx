/** @jsxImportSource @zen/tui */
/**
 * Full Demo: Static Component with console.log, stdio, various styles
 */

import { signal } from '@zen/signal';
import { Box, Static, Text, render } from '@zen/tui';

interface LogEntry {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'box' | 'multiline' | 'fancy';
  message: string;
  timestamp: string;
}

const logs = signal<LogEntry[]>([]);
const progress = signal(0);
const status = signal('Starting...');

function App() {
  return (
    <Box style={{ flexDirection: 'column' }}>
      {/* Static content - accumulates in terminal scrollback */}
      <Static items={() => logs.value}>
        {(log) => {
          switch (log.type) {
            case 'info':
              return (
                <Box key={log.id}>
                  <Text color="blue">ℹ </Text>
                  <Text dim>[{log.timestamp}]</Text>
                  <Text> {log.message}</Text>
                </Box>
              );

            case 'success':
              return (
                <Box key={log.id}>
                  <Text color="green">✔ </Text>
                  <Text dim>[{log.timestamp}]</Text>
                  <Text color="green"> {log.message}</Text>
                </Box>
              );

            case 'warning':
              return (
                <Box key={log.id}>
                  <Text color="yellow">⚠ </Text>
                  <Text dim>[{log.timestamp}]</Text>
                  <Text color="yellow"> {log.message}</Text>
                </Box>
              );

            case 'error':
              return (
                <Box key={log.id}>
                  <Text color="red">✖ </Text>
                  <Text dim>[{log.timestamp}]</Text>
                  <Text color="red" bold>
                    {' '}
                    {log.message}
                  </Text>
                </Box>
              );

            case 'box':
              return (
                <Box
                  key={log.id}
                  borderStyle="round"
                  borderColor="cyan"
                  paddingLeft={1}
                  paddingRight={1}
                >
                  <Text color="cyan" bold>
                    {log.message}
                  </Text>
                </Box>
              );

            case 'multiline':
              return (
                <Box key={log.id} flexDirection="column">
                  <Text color="magenta">┌─ {log.message}</Text>
                  <Text color="magenta">│ Line 2: More details here</Text>
                  <Text color="magenta">└─ Line 3: End of block</Text>
                </Box>
              );

            case 'fancy':
              return (
                <Box
                  key={log.id}
                  borderStyle="double"
                  borderColor="yellow"
                  flexDirection="column"
                  paddingLeft={1}
                  paddingRight={1}
                >
                  <Text color="yellow" bold>
                    ★ {log.message} ★
                  </Text>
                  <Text dim> Timestamp: {log.timestamp}</Text>
                </Box>
              );

            default:
              return <Text key={log.id}>{log.message}</Text>;
          }
        }}
      </Static>

      {/* Dynamic UI - updates in place */}
      <Box borderStyle="round" borderColor="cyan" padding={1} marginTop={1}>
        <Box flexDirection="column">
          <Box>
            <Text bold color="cyan">
              📊 Static Component Demo
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text>
              Status: <Text color="yellow">{() => status.value}</Text>
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text>
              Progress: <Text color="green">[</Text>
              <Text color="green">{() => '█'.repeat(progress.value)}</Text>
              <Text dim>{() => '░'.repeat(20 - progress.value)}</Text>
              <Text color="green">]</Text> {() => Math.round((progress.value / 20) * 100)}%
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text>
              Logs: <Text bold>{() => logs.value.length}</Text>
              <Text dim> items in scrollback</Text>
            </Text>
          </Box>

          <Box marginTop={1}>
            <Text dim>Watch the logs accumulate above ↑</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// Helper to get timestamp
const getTime = () => new Date().toLocaleTimeString();

// Helper to add log
const addLog = (type: LogEntry['type'], message: string) => {
  const id = logs.value.length + 1;
  logs.value = [...logs.value, { id, type, message, timestamp: getTime() }];
};

const cleanup = await render(() => <App />);

// Simulate various log types
const demo = async () => {
  await sleep(500);
  status.value = 'Initializing...';
  addLog('info', 'Application starting');
  progress.value = 2;

  await sleep(400);
  addLog('info', 'Loading configuration');
  progress.value = 4;

  await sleep(400);
  addLog('success', 'Configuration loaded successfully');
  progress.value = 6;
  status.value = 'Connecting...';

  await sleep(400);
  process.stdout.write('[stdout] Direct stdout write\n');
  addLog('info', 'Connecting to database');
  progress.value = 8;

  await sleep(400);
  addLog('warning', 'Connection timeout, retrying...');
  progress.value = 10;

  await sleep(400);
  addLog('success', 'Database connected');
  progress.value = 12;
  status.value = 'Processing...';

  await sleep(400);
  addLog('box', 'MILESTONE: Database Ready!');
  progress.value = 13;

  await sleep(400);
  addLog('info', 'Starting data migration');
  progress.value = 14;

  await sleep(400);
  addLog('multiline', 'Migration Details');
  progress.value = 15;

  await sleep(400);
  addLog('success', 'Migrated 1000 records');
  progress.value = 16;

  await sleep(400);
  addLog('error', 'Failed to migrate 3 records (skipped)');
  progress.value = 17;

  await sleep(400);
  addLog('warning', 'Review skipped records manually');
  progress.value = 18;

  await sleep(400);
  addLog('fancy', 'DEPLOYMENT COMPLETE');
  progress.value = 19;
  status.value = 'Finalizing...';

  await sleep(400);
  addLog('success', 'All tasks completed!');
  progress.value = 20;
  status.value = 'Done!';

  await sleep(1000);
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

await demo();

cleanup();
process.exit(0);
