/** @jsxImportSource @zen/tui */
import { renderToTerminalReactive, FocusProvider, useFocusManager } from '@zen/tui';
import { Box, Text } from '@zen/tui';

const TestChild = () => {
  console.log('[TestChild] Executing...');

  try {
    const manager = useFocusManager();
    console.log('[TestChild] SUCCESS! Found FocusManager:', Object.keys(manager));
    return <Text color="green">✓ Context found!</Text>;
  } catch (error) {
    console.log('[TestChild] ERROR:', error.message);
    return <Text color="red">✗ Context not found</Text>;
  }
};

const App = () => {
  return (
    <FocusProvider>
      {/* Manual lazy children - wrap in function */}
      {() => <TestChild />}
    </FocusProvider>
  );
};

const cleanup = await renderToTerminalReactive(() => <App />);

setTimeout(() => {
  cleanup();
  process.exit(0);
}, 1000);
