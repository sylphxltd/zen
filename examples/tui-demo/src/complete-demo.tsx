/**
 * Complete Interactive Demo - All Components
 *
 * Demonstrates:
 * - Buttons (primary, secondary, danger)
 * - TextInput
 * - SelectInput
 * - Checkbox
 * - Tab navigation with new Ink-compatible API
 */

import {
  Box,
  Button,
  Checkbox,
  FocusProvider,
  SelectInput,
  Text,
  TextInput,
  dispatchInput,
  renderToTerminalReactive,
  signal,
  useFocusManager,
  useInput,
} from '@zen/tui';

// State
const name = signal('');
const email = signal('');
const framework = signal<string | null>(null);
const agreed = signal(false);
const message = signal('Fill in the form and press Submit');

const frameworkOptions = [
  { value: 'solidjs', label: 'SolidJS' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
];

function AppContent() {
  const { focusNext, focusPrevious } = useFocusManager();

  // Handle Tab navigation
  useInput((_input, key) => {
    if (key.tab) {
      if (key.shift) {
        focusPrevious();
      } else {
        focusNext();
      }
    }
  });

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
        Complete Interactive Components Demo
      </Text>
      <Text color="gray">Tab: navigate | Shift+Tab: back | Enter: submit | Ctrl+C: exit</Text>

      <Box style={{ height: 1 }} />

      {/* Form Section */}
      <Text color="white" bold={true}>
        Registration Form
      </Text>

      <Box style={{ height: 1 }} />

      {/* Name Input */}
      <Box style={{ flexDirection: 'column' }}>
        <Text color="gray">Name:</Text>
        <TextInput id="name-input" value={name} placeholder="Enter your name" width={60} />
      </Box>

      <Box style={{ height: 1 }} />

      {/* Email Input */}
      <Box style={{ flexDirection: 'column' }}>
        <Text color="gray">Email:</Text>
        <TextInput id="email-input" value={email} placeholder="your@email.com" width={60} />
      </Box>

      <Box style={{ height: 1 }} />

      {/* Framework Select */}
      <Box style={{ flexDirection: 'column' }}>
        <Text color="gray">Favorite Framework:</Text>
        <SelectInput
          id="framework-select"
          options={frameworkOptions}
          value={framework}
          placeholder="Choose a framework"
          width={60}
        />
      </Box>

      <Box style={{ height: 1 }} />

      {/* Checkbox */}
      <Checkbox
        id="agree-checkbox"
        label="I agree to the terms and conditions"
        checked={agreed}
        width={60}
        onChange={(checked) => {
          agreed.value = checked;
        }}
      />

      <Box style={{ height: 1 }} />

      {/* Buttons */}
      <Box style={{ flexDirection: 'row', gap: 2 }}>
        <Button
          id="submit-btn"
          label="Submit"
          variant="primary"
          width={15}
          disabled={() => !name.value || !email.value || !framework.value || !agreed.value}
          onClick={() => {
            message.value = `✓ Submitted! Name: ${name.value}, Email: ${email.value}, Framework: ${
              frameworkOptions.find((f) => f.value === framework.value)?.label
            }`;
          }}
        />
        <Button
          id="clear-btn"
          label="Clear"
          variant="secondary"
          width={12}
          onClick={() => {
            name.value = '';
            email.value = '';
            framework.value = null;
            agreed.value = false;
            message.value = 'Form cleared. Fill in again.';
          }}
        />
        <Button
          id="cancel-btn"
          label="Cancel"
          variant="danger"
          width={12}
          onClick={() => {
            message.value = 'Cancelled!';
          }}
        />
      </Box>

      <Box style={{ height: 1 }} />

      {/* Status Message */}
      <Box style={{ borderStyle: 'single', padding: 1, width: 66 }}>
        <Text color="green">{message}</Text>
      </Box>
    </Box>
  );
}

function App() {
  return <FocusProvider>{() => <AppContent />}</FocusProvider>;
}

// Render
// Note: renderToTerminalReactive already handles Ctrl+C and dispatches to useInput handlers
const _cleanup = await renderToTerminalReactive(() => App(), {
  fps: 30,
});
