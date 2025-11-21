/** @jsxImportSource @zen/tui */
import { signal } from '@zen/signal';
import { renderToTerminalReactive, useInput, FocusProvider, useFocus } from '@zen/tui';
import { Box, Text } from '@zen/tui';
import { onMount } from '@zen/runtime';

const log = signal<string[]>([]);

function addLog(msg: string) {
  console.log(msg);
  log.value = [...log.value, msg];
}

const TestComponent = () => {
  addLog('[TestComponent] Rendering...');

  const focusResult = useFocus({ id: 'test', autoFocus: true });
  addLog(`[TestComponent] useFocus returned: ${JSON.stringify(Object.keys(focusResult))}`);

  const { isFocused } = focusResult;
  addLog(`[TestComponent] isFocused type: ${typeof isFocused}`);
  addLog(`[TestComponent] isFocused.value: ${isFocused.value}`);

  onMount(() => {
    addLog('[onMount] Running...');
    addLog(`[onMount] isFocused.value: ${isFocused.value}`);
  });

  useInput((input, key) => {
    addLog(`[useInput] input: "${input}", isFocused.value: ${isFocused.value}`);

    if (!isFocused.value) {
      addLog('[useInput] Blocked by focus check');
      return;
    }

    addLog('[useInput] Passed focus check!');
  });

  return (
    <Box flexDirection="column">
      <Text bold>Focus Debug 2</Text>
      <Box marginTop={1}>
        <Text>isFocused.value: </Text>
        <Text color="yellow">{() => String(isFocused.value)}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        {() => log.value.slice(-10).map((msg, i) => (
          <Text key={i} dim>{msg}</Text>
        ))}
      </Box>
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
