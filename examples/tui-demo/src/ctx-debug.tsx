/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, FocusProvider, useFocusManager } from '@zen/tui';
import { Box, Text } from '@zen/tui';
import { useContext, createContext } from '@zen/runtime';

const log = signal<string[]>([]);

function addLog(msg: string) {
  console.log(msg);
  log.value = [...log.value, msg];
}

// Try to access the focus context directly
const FocusContext = createContext(null);

const TestComponent = () => {
  addLog('[TestComponent] Starting...');

  try {
    const manager = useFocusManager();
    addLog('[TestComponent] useFocusManager success!');
    addLog(`[TestComponent] manager keys: ${Object.keys(manager).join(', ')}`);
  } catch (error) {
    addLog(`[TestComponent] useFocusManager ERROR: ${error.message}`);
  }

  return (
    <Box flexDirection="column">
      <Text bold>Context Debug</Text>
      {() => log.value.slice(-10).map((msg, i) => (
        <Text key={i} dim>{msg}</Text>
      ))}
    </Box>
  );
};

const cleanup = await renderToTerminalReactive(() => (
  <FocusProvider>
    <TestComponent />
  </FocusProvider>
));

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
