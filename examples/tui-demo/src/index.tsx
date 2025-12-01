/** @jsxImportSource @zen/tui */
/**
 * TUI Demo - Reactive Terminal UI
 *
 * Demonstrates:
 * - Reactive signal updates (auto-incrementing counter)
 * - Keyboard interaction (arrow keys, space)
 * - Real-time re-rendering
 */

import { FullscreenLayout, render, signal, useInput } from '@zen/tui';
import { Box, Text } from '@zen/tui';

// Create reactive state
const count = signal(0);
const message = signal('Press ↑/↓ or Space');

// Auto-increment counter
setInterval(() => {
  count.value++;
}, 1000);

function App() {
  // Handle keyboard input
  useInput((input, key): boolean | undefined => {
    // Arrow up: increment
    if (key.upArrow) {
      count.value++;
      message.value = '↑ Incremented!';
      return true;
    }
    // Arrow down: decrement
    if (key.downArrow) {
      count.value--;
      message.value = '↓ Decremented!';
      return true;
    }
    // Space: reset
    if (input === ' ') {
      count.value = 0;
      message.value = '⟳ Reset to 0!';
      return true;
    }
    // Any other key (except quit keys)
    if (input && input !== 'q' && input !== 'Q') {
      message.value = `Key pressed: ${JSON.stringify(input)}`;
      return true;
    }
    return undefined;
  });

  return (
    <Box
      style={{
        width: 60,
        height: 18,
        padding: 2,
        borderStyle: 'round',
        borderColor: 'cyan',
      }}
    >
      <Text style={{ bold: true, color: 'green' }}>🎯 Zen TUI - Reactive Demo</Text>

      <Box style={{ padding: 1 }}>
        <Text>Counter: </Text>
        <Text style={{ bold: true, color: 'yellow' }}>{count}</Text>
        <Text style={{ dim: true }}> (auto-incrementing)</Text>
      </Box>

      <Box style={{ padding: 1 }}>
        <Text style={{ color: 'magenta' }}>{message}</Text>
      </Box>

      <Box>
        <Text style={{ underline: true }}>Controls:</Text>
      </Box>

      <Box>
        <Text style={{ color: 'blue' }}>• ↑ - Increment (+1)</Text>
      </Box>

      <Box>
        <Text style={{ color: 'blue' }}>• ↓ - Decrement (-1)</Text>
      </Box>

      <Box>
        <Text style={{ color: 'blue' }}>• Space - Reset to 0</Text>
      </Box>

      <Box>
        <Text style={{ color: 'red' }}>• q or Ctrl+C - Quit</Text>
      </Box>

      <Box style={{ padding: 1 }}>
        <Text style={{ dim: true, italic: true }}>Platform: Terminal UI</Text>
      </Box>
    </Box>
  );
}

// Render with reactive updates
await render(() => (
  <FullscreenLayout>
    <App />
  </FullscreenLayout>
));
