/** @jsxImportSource @zen/tui */
import { Box, Button, FocusProvider, Text, TextInput, render, signal, useInput } from '@zen/tui';

const name = signal('');
const msg = signal('Press Tab to focus input, then type');

function AppContent() {
  // Only handle Escape to exit - Tab is handled by FocusProvider automatically!
  useInput((_input, key) => {
    if (key.escape) process.exit(0);
  });

  return (
    <Box
      style={{
        flexDirection: 'column',
        padding: 1,
        width: 50,
        borderStyle: 'single',
        borderColor: 'cyan',
      }}
    >
      <Text color="cyan" bold>
        Simple Form Demo
      </Text>
      <Text color="gray">Tab: navigate | Esc: exit</Text>
      <Box style={{ height: 1 }} />
      <Text>Name:</Text>
      <TextInput
        id="name"
        value={name}
        placeholder="Your name"
        width={40}
        onSubmit={(val) => {
          msg.value = `Hello ${val}!`;
        }}
      />
      <Box style={{ height: 1 }} />
      <Button
        id="btn"
        label="Submit"
        width={12}
        onClick={() => {
          msg.value = `Hello ${name.value}!`;
        }}
      />
      <Box style={{ height: 1 }} />
      <Text color="green">{msg}</Text>
    </Box>
  );
}

// Descriptor pattern handles context propagation automatically
await render(() => (
  <FocusProvider>
    <AppContent />
  </FocusProvider>
));
