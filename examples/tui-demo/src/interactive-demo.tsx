/**
 * Interactive Demo - Phase 3 Components
 *
 * Demonstrates Button, Spinner, and ProgressBar components
 */

import {
  Box,
  Button,
  Fragment,
  ProgressBar,
  Spinner,
  Text,
  incrementProgress,
  renderToTerminalReactive,
  signal,
  updateSpinner,
} from '@zen/tui';

// State
const progress = signal(0);
const isLoading = signal(false);
const message = signal('Click a button to start!');

// Spinner frame indices
const _spinnerFrame1 = signal(0);
const _spinnerFrame2 = signal(0);
const _spinnerFrame3 = signal(0);
const _spinnerFrame4 = signal(0);

function App() {
  return (
    <Box
      style={{
        flexDirection: 'column',
        padding: 2,
        borderStyle: 'double',
        borderColor: 'cyan',
        width: 70,
      }}
    >
      {/* Header */}
      <Text color="cyan" bold={true}>
        Phase 3 Interactive Components Demo
      </Text>
      <Text color="gray">Press buttons with Enter/Space, Ctrl+C to exit</Text>

      <Box style={{ height: 1 }} />

      {/* Status Message */}
      <Box style={{ borderStyle: 'single', padding: 1, width: 66 }}>
        <Text color={() => (isLoading.value ? 'yellow' : 'green')}>{() => message.value}</Text>
      </Box>

      <Box style={{ height: 1 }} />

      {/* Buttons Section */}
      <Text color="white" bold={true}>
        Buttons:
      </Text>
      <Box style={{ flexDirection: 'row', gap: 2 }}>
        <Button
          id="start"
          label="Start Task"
          variant="primary"
          onClick={() => {
            isLoading.value = true;
            message.value = 'Task started! Watch the progress...';
            progress.value = 0;
          }}
        />
        <Button
          id="stop"
          label="Stop"
          variant="secondary"
          onClick={() => {
            isLoading.value = false;
            message.value = 'Task stopped.';
          }}
        />
        <Button
          id="reset"
          label="Reset"
          variant="danger"
          onClick={() => {
            isLoading.value = false;
            progress.value = 0;
            message.value = 'Reset complete. Click Start to begin again.';
          }}
        />
      </Box>

      <Box style={{ height: 1 }} />

      {/* Spinner Section */}
      <Text color="white" bold={true}>
        Loading Spinner:
      </Text>
      <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {() =>
          isLoading.value ? (
            <>
              <Spinner type="dots" label="Processing" color="cyan" />
              <Spinner type="line" color="yellow" />
              <Spinner type="arc" color="green" />
              <Spinner type="arrow" color="magenta" />
            </>
          ) : (
            <Text color="gray">Not loading...</Text>
          )
        }
      </Box>

      <Box style={{ height: 1 }} />

      {/* Progress Bar Section */}
      <Text color="white" bold={true}>
        Progress:
      </Text>
      <ProgressBar
        value={progress}
        label={() => (progress.value < 100 ? 'Task Progress' : 'Complete!')}
        width={66}
      />
    </Box>
  );
}

// Auto-increment progress when loading
setInterval(() => {
  if (isLoading.value && progress.value < 100) {
    incrementProgress(progress, 2);
  }
  if (progress.value >= 100 && isLoading.value) {
    isLoading.value = false;
    message.value = '✓ Task completed successfully!';
  }
}, 100);

// Track focus for keyboard handling
let focusedButton = 0;
const buttons = ['start', 'stop', 'reset'];

// Render
const cleanup = renderToTerminalReactive(App, {
  onKeyPress: (key) => {
    // Tab navigation
    if (key === '\t') {
      focusedButton = (focusedButton + 1) % buttons.length;
      return;
    }

    if (key === '\x1b[Z') {
      // Shift+Tab
      focusedButton = focusedButton <= 0 ? buttons.length - 1 : focusedButton - 1;
      return;
    }

    // Button activation
    if (key === '\r' || key === '\n' || key === ' ') {
      if (focusedButton === 0) {
        // Start
        isLoading.value = true;
        message.value = 'Task started! Watch the progress...';
        progress.value = 0;
      } else if (focusedButton === 1) {
        // Stop
        isLoading.value = false;
        message.value = 'Task stopped.';
      } else if (focusedButton === 2) {
        // Reset
        isLoading.value = false;
        progress.value = 0;
        message.value = 'Reset complete. Click Start to begin again.';
      }
    }

    // Ctrl+C to exit
    if (key === '\x03') {
      cleanup();
      process.exit(0);
    }
  },
  fps: 30,
});
