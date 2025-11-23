#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Test Persistent Renderer - Borders
 *
 * Tests border rendering with different styles and colors.
 */

import { signal } from '@zen/signal';
import { Box, Text, renderToTerminalPersistent } from '@zen/tui';

const borderType = signal(0);
const borderStyles = ['single', 'double', 'round', 'bold'];
const borderColors = ['cyan', 'magenta', 'green', 'yellow'];

// Auto cycle through border styles every 1000ms
setInterval(() => {
  borderType.value = (borderType.value + 1) % borderStyles.length;
  if (borderType.value === 0) {
    // Completed one full cycle, exit
    setTimeout(() => process.exit(0), 500);
  }
}, 1000);

function App() {
  return Box({
    style: {
      flexDirection: 'column' as const,
      padding: 1,
    },
    children: [
      Text({
        children: 'Persistent Renderer Border Test',
        bold: true,
        color: 'white',
      }),
      Box({
        borderStyle: () => borderStyles[borderType.value],
        borderColor: () => borderColors[borderType.value],
        style: {
          marginTop: 1,
          padding: 1,
        },
        children: [
          Text({
            children: () => `Border Style: ${borderStyles[borderType.value]}`,
            color: () => borderColors[borderType.value],
          }),
          Text({
            children: () => `Color: ${borderColors[borderType.value]}`,
            dim: true,
          }),
        ],
      }),
      Text({
        children: 'Cycling through border styles...',
        dim: true,
        style: { marginTop: 1 },
      }),
    ],
  });
}

await renderToTerminalPersistent(() => App(), {
  fps: 10,
});
