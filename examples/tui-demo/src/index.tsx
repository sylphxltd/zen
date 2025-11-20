/**
 * TUI Demo - Reactive Terminal UI
 *
 * Demonstrates:
 * - Reactive signal updates (auto-incrementing counter)
 * - Keyboard interaction (arrow keys, space)
 * - Real-time re-rendering
 */

import { renderToTerminalReactive, signal } from '@zen/tui';
import { Box, Text } from '@zen/tui';

// Create reactive state
const count = signal(0);
const message = signal('Press ↑/↓ or Space');

// Auto-increment counter
setInterval(() => {
  count.value++;
}, 1000);

function App() {
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
        <Text style={{ dim: true, italic: true }}>Platform: Terminal UI | FPS: 10</Text>
      </Box>
    </Box>
  );
}

// Render with reactive updates and keyboard controls
await renderToTerminalReactive(() => <App />, {
  fps: 10,
  onKeyPress: (key) => {
    // Arrow up: increment
    if (key === '\u001b[A') {
      count.value++;
      message.value = '↑ Incremented!';
    }
    // Arrow down: decrement
    else if (key === '\u001b[B') {
      count.value--;
      message.value = '↓ Decremented!';
    }
    // Space: reset
    else if (key === ' ') {
      count.value = 0;
      message.value = '⟳ Reset to 0!';
    }
    // Any other key
    else if (key !== 'q' && key !== 'Q' && key !== '\u0003') {
      message.value = `Key pressed: ${JSON.stringify(key)}`;
    }
  },
});
