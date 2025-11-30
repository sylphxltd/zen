/**
 * Demo: Interactive Input Components
 *
 * Showcases:
 * - FocusProvider for managing focus across components
 * - TextInput with cursor and editing
 * - SelectInput with dropdown navigation
 * - Checkbox components
 * - Tab/Shift+Tab navigation between inputs
 */

import {
  Box,
  Checkbox,
  FocusProvider,
  Newline,
  SelectInput,
  type SelectOption,
  Text,
  TextInput,
  handleCheckbox,
  handleSelectInput,
  handleTextInput,
  render,
  signal,
  useFocusManager,
  useInput,
} from '@zen/tui';

// Form state
const name = signal('');
const email = signal('');
const role = signal<string>('developer');
const subscribe = signal(false);
const terms = signal(false);

// Component-specific state for inputs (needed by handlers)
const nameCursor = signal(0);
const emailCursor = signal(0);
const roleIsOpen = signal(false);
const roleHighlighted = signal(0);

// Track current focus index
const focusIndex = signal(0);
const focusableIds = ['name', 'email', 'role', 'subscribe', 'terms'];

// Select options
const roleOptions: SelectOption<string>[] = [
  { label: 'Developer', value: 'developer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Product Manager', value: 'pm' },
  { label: 'Other', value: 'other' },
];

// Keyboard event handler registry
const inputHandlers = {
  name: (key: string) => handleTextInput(name, nameCursor, key),
  email: (key: string) => handleTextInput(email, emailCursor, key),
  role: (key: string) => handleSelectInput(roleIsOpen, roleHighlighted, role, roleOptions, key),
  subscribe: (key: string) => handleCheckbox(subscribe, key),
  terms: (key: string) => handleCheckbox(terms, key),
};

function Form() {
  const _focusCtx = useFocusManager();

  // Handle keyboard input
  useInput((input, key): boolean | undefined => {
    // Tab navigation
    if (key.tab) {
      if (key.shift) {
        focusIndex.value = focusIndex.value <= 0 ? focusableIds.length - 1 : focusIndex.value - 1;
      } else {
        focusIndex.value = (focusIndex.value + 1) % focusableIds.length;
      }
      return true;
    }

    // Route key events to focused component handler
    const focusedId = focusableIds[focusIndex.value];
    const handler = inputHandlers[focusedId as keyof typeof inputHandlers];

    if (handler) {
      // Convert back to raw key string for handlers
      const rawKey = input || (key.return ? '\r' : key.escape ? '\x1b' : '');
      handler(rawKey);
      return true;
    }
    return undefined;
  });

  return (
    <Box style={{ width: 60, borderStyle: 'round', padding: 1 }}>
      {/* Header */}
      <Box style={{ borderStyle: 'single', padding: 1 }}>
        <Text bold color="cyan">
          📝 User Registration Form
        </Text>
      </Box>

      <Newline count={2} />

      {/* Form fields */}
      <Box>
        <Text bold>Name:</Text>
        <Newline />
        <TextInput
          id="name"
          value={name}
          cursor={nameCursor}
          placeholder="Enter your name"
          width={56}
        />

        <Newline count={2} />

        <Text bold>Email:</Text>
        <Newline />
        <TextInput
          id="email"
          value={email}
          cursor={emailCursor}
          placeholder="you@example.com"
          width={56}
        />

        <Newline count={2} />

        <Text bold>Role:</Text>
        <Newline />
        <SelectInput
          id="role"
          options={roleOptions}
          value={role}
          isOpen={roleIsOpen}
          highlightedIndex={roleHighlighted}
          placeholder="Select your role"
          width={56}
        />

        <Newline count={2} />

        <Checkbox id="subscribe" checked={subscribe} label="Subscribe to newsletter" />

        <Newline />

        <Checkbox id="terms" checked={terms} label="I agree to the terms and conditions" />

        <Newline count={2} />

        {/* Submit hint */}
        <Box style={{ borderStyle: 'single', paddingX: 1 }}>
          <Text dim>
            Press <Text bold>Tab</Text> to navigate • <Text bold>Enter</Text> to submit
          </Text>
        </Box>
      </Box>

      <Newline count={2} />

      {/* Form state display */}
      <Box style={{ borderStyle: 'single', padding: 1 }}>
        <Text bold color="yellow">
          Form Data:
        </Text>
        <Newline />
        <Text dim>
          Name: <Text color="white">{name.value || '(empty)'}</Text>
        </Text>
        <Newline />
        <Text dim>
          Email: <Text color="white">{email.value || '(empty)'}</Text>
        </Text>
        <Newline />
        <Text dim>
          Role: <Text color="white">{role.value}</Text>
        </Text>
        <Newline />
        <Text dim>
          Newsletter:{' '}
          <Text color={subscribe.value ? 'green' : 'red'}>{subscribe.value ? 'Yes' : 'No'}</Text>
        </Text>
        <Newline />
        <Text dim>
          Terms: <Text color={terms.value ? 'green' : 'red'}>{terms.value ? 'Yes' : 'No'}</Text>
        </Text>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <FocusProvider>
      <Form />
    </FocusProvider>
  );
}

await render(App);
