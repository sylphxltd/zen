/**
 * Interactive Demo - Phase 3 Components
 *
 * Demonstrates Button, Spinner, and ProgressBar components
 */

import {
  Box, Button, FocusProvider, Fragment, FullscreenLayout, ProgressBar, Spinner, Text, incrementProgress, signal, useFocusManager, useInput, render } from '@zen/tui';

// State
const progress = signal(0);
const isLoading = signal(false);
const message = signal('Click a button to start!');

// Spinner frame indices
const _spinnerFrame1 = signal(0);
const _spinnerFrame2 = signal(0);
const _spinnerFrame3 = signal(0);
const _spinnerFrame4 = signal(0);

function AppContent() {
  const focusContext = useFocusManager();

  // Handle Tab navigation
  useInput((_input, key) => {
    if (key.tab) {
      focusContext.focusNext();
    }
  });

  return (
    <Box
      style={{
        flexDirection: 'column', padding: 2, borderStyle: 'double', borderColor: 'cyan', width: 70}}
    >
      {/* Header */}
      <Text color="cyan" bold={true}>
        Phase 3 Interactive Components Demo
      </Text>
      <Text color="gray">Press Tab to navigate, Enter/Space to activate, Ctrl+C to exit</Text>

      <Box style={{ height: 1 }} />

      {/* Status Message */}
      <Box style={{ borderStyle: 'single', padding: 1, width: 66 }}>
        <Text color={() => (isLoading.value ? 'yellow' : 'green')}>{message}</Text>
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
          width={18}
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
          width={12}
          onClick={() => {
            isLoading.value = false;
            message.value = 'Task stopped.';
          }}
        />
        <Button
          id="reset"
          label="Reset"
          variant="danger"
          width={13}
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

function App() {
  return (
    <FullscreenLayout>
      <FocusProvider>
        <AppContent />
      </FocusProvider>
    </FullscreenLayout>
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

// Button onClick handlers (need to be accessible from outside components)
const _buttonHandlers = {
  start: () => {
    isLoading.value = true;
    message.value = 'Task started! Watch the progress...';
    progress.value = 0;
  }, stop: () => {
    isLoading.value = false;
    message.value = 'Task stopped.';
  }, reset: () => {
    isLoading.value = false;
    progress.value = 0;
    message.value = 'Reset complete. Click Start to begin again.';
  }};

// Global focus context access (will be set during render)
const _focusContext: unknown = null;

// Render
await render(App);
