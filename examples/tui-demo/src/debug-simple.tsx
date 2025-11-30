/** @jsxImportSource @zen/tui */
import { Box, Button, FocusProvider, Text, render } from '@zen/tui';

function AppContent() {
  return (
    <Box style={{ flexDirection: 'column', padding: 1, width: 50, borderStyle: 'single' }}>
      <Text color="cyan" bold>
        Debug Form
      </Text>
      <Button id="btn" label="Click me" width={15} onClick={() => {}} />
    </Box>
  );
}

// Descriptor pattern handles context propagation automatically
await render(() => (
  <FocusProvider>
    <AppContent />
  </FocusProvider>
));
