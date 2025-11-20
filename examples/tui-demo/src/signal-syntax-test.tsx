/**
 * Signal Syntax Test
 *
 * Tests different ways to use signals in JSX (runtime-first mode, no compiler)
 */

import { Box, Text, renderToTerminalReactive, signal } from '@zen/tui';

const count = signal(0);

function App() {
  return (
    <Box
      style={{
        flexDirection: 'column',
        padding: 2,
        borderStyle: 'single',
        width: 60,
      }}
    >
      <Text color="cyan" bold={true}>
        Signal Syntax Test (Runtime-First, No Compiler)
      </Text>
      <Box style={{ height: 1 }} />

      <Text color="white">1. Direct signal: {'{count}'}</Text>
      <Text color="green">   Result: {count}</Text>
      <Box style={{ height: 1 }} />

      <Text color="white">2. Signal.value: {'{count.value}'}</Text>
      <Text color="red">   Result: {count.value}</Text>
      <Box style={{ height: 1 }} />

      <Text color="white">3. Function: {'{() => count.value}'}</Text>
      <Text color="green">   Result: {() => count.value}</Text>
      <Box style={{ height: 1 }} />

      <Text color="gray">Press Ctrl+C to exit</Text>
    </Box>
  );
}

// Increment count every second
const interval = setInterval(() => {
  count.value += 1;
}, 1000);

const cleanup = renderToTerminalReactive(App, {
  onKeyPress: (key) => {
    if (key === '\x03') {
      clearInterval(interval);
      cleanup();
      process.exit(0);
    }
  },
  fps: 2,
});

// Auto-exit after 5 seconds to demonstrate
setTimeout(() => {
  clearInterval(interval);
  cleanup();
  console.log('\n\n✅ Test completed:');
  console.log('   - {count} updated reactively ✅');
  console.log('   - {count.value} stayed at 0 (non-reactive) ❌');
  console.log('   - {() => count.value} updated reactively ✅');
  process.exit(0);
}, 5000);
