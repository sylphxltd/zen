/** @jsxImportSource @zen/tui */
import {
  Box,
  FocusProvider,
  Text,
  render,
  signal,
  useFocus,
  useFocusManager,
  useInput,
} from '@zen/tui';

const focusedId = signal('none');

function DebugInput(props: { id: string; label: string }) {
  const { isFocused } = useFocus({ id: props.id });

  return (
    <Box
      style={{
        borderStyle: isFocused.value ? 'double' : 'single',
        borderColor: isFocused.value ? 'green' : 'gray',
        padding: 1,
        width: 30,
      }}
    >
      <Text color={isFocused.value ? 'green' : 'white'}>
        {props.label} {isFocused.value ? '(FOCUSED)' : ''}
      </Text>
    </Box>
  );
}

function AppContent() {
  const manager = useFocusManager();

  useInput((_input, key) => {
    if (key.tab) {
      key.shift ? manager.focusPrevious() : manager.focusNext();
      // Update debug display
      setTimeout(() => {
        focusedId.value = manager.activeId?.value || 'none';
      }, 10);
    }
    if (key.escape) process.exit(0);
  });

  return (
    <Box style={{ flexDirection: 'column', padding: 1, gap: 1 }}>
      <Text color="cyan" bold>
        Focus Debug Test
      </Text>
      <Text color="gray">Press Tab to cycle focus</Text>
      <Text color="yellow">Current focus: {focusedId}</Text>
      <Box style={{ height: 1 }} />
      <DebugInput id="input-1" label="Input 1" />
      <DebugInput id="input-2" label="Input 2" />
      <DebugInput id="input-3" label="Input 3" />
    </Box>
  );
}

await render(() => (
  <FocusProvider>
    <AppContent />
  </FocusProvider>
));
