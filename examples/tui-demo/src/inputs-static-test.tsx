/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, Static } from '@zen/tui';
import {
  Box,
  Text,
  TextInput,
  Button,
  FocusProvider,
} from '@zen/tui';

interface LogItem {
  id: number;
  message: string;
}

// Static logs
const staticLogs = signal<LogItem[]>([
  { id: 0, message: '[Started] Input test with static logs' }
]);
let logId = 1;

// Form state
const username = signal('');
const message = signal('');

// Handle submit
function handleSubmit() {
  if (username.value || message.value) {
    logId++;
    staticLogs.value = [
      ...staticLogs.value,
      {
        id: logId,
        message: `[${new Date().toLocaleTimeString()}] Submitted: ${username.value} - "${message.value}"`
      },
    ];

    // Clear form
    username.value = '';
    message.value = '';
  }
}

const InputsStaticTest = () => {
  return (
    <>
      {/* Static items - form submissions */}
      <Static items={() => staticLogs.value}>
        {(log) => (
          <Box key={log.id}>
            <Text color="cyan" bold>▸ </Text>
            <Text color="white">{log.message}</Text>
          </Box>
        )}
      </Static>

      {/* Dynamic UI - form */}
      <Box borderStyle="round" borderColor="cyan" padding={1} marginTop={1}>
        <Box flexDirection="column">
          <Text bold color="cyan">Input Components + Static Test</Text>

          <Box marginTop={1} flexDirection="column">
            <Text bold>Username:</Text>
            <TextInput
              id="username"
              value={username}
              placeholder="Enter your name"
              width={40}
              onChange={(value) => {
                username.value = value;
              }}
            />
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text bold>Message:</Text>
            <TextInput
              id="message"
              value={message}
              placeholder="Enter a message"
              width={40}
              onChange={(value) => {
                message.value = value;
              }}
            />
          </Box>

          <Box marginTop={1}>
            <Button
              id="submit"
              label="Submit"
              onClick={handleSubmit}
              variant="primary"
              width={15}
            />
          </Box>

          <Box marginTop={1} dimColor>
            <Text>• Type in fields, press Enter on Submit button</Text>
          </Box>
          <Box dimColor>
            <Text>• Submissions appear above as static content</Text>
          </Box>
          <Box dimColor>
            <Text>• Press Ctrl+C to exit</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};

// Render with FocusProvider for Tab navigation
const cleanup = await renderToTerminalReactive(() => (
  <FocusProvider>
    <InputsStaticTest />
  </FocusProvider>
));

// Auto-submit test after 1 second
setTimeout(() => {
  username.value = 'TestUser';
  message.value = 'Auto-generated test message';
  handleSubmit();
}, 1000);

// Cleanup
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
