/**
 * Button component for TUI
 *
 * Interactive button with visual feedback and keyboard support.
 */

import { type MaybeReactive, type Signal, resolve, signal } from '@zen/runtime';
import type { TUINode } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';
import { useFocus } from '../utils/focus.js';

export interface ButtonProps {
  /** Button label - supports MaybeReactive */
  label: MaybeReactive<string>;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state - supports MaybeReactive */
  disabled?: MaybeReactive<boolean>;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Fixed width */
  width?: number;
  /** Focus ID for FocusProvider */
  id?: string;
}

export function Button(props: ButtonProps): TUINode {
  const id = props.id || `button-${Math.random().toString(36).slice(2, 9)}`;
  const variant = props.variant || 'primary';
  const width = props.width;

  // Visual pressed state
  const isPressed = signal(false);

  // Helper to get current disabled state (uses resolve for MaybeReactive)
  const getDisabled = () => resolve(props.disabled) || false;

  // Helper to get label (uses resolve for MaybeReactive)
  const getLabel = () => resolve(props.label);

  const { isFocused } = useFocus({
    id,
    isActive: true, // We'll check disabled in the input handler
    onFocus: () => {
      isPressed.value = false;
    },
  });

  // Handle keyboard input for this button
  useInput((input, key) => {
    // Only handle input if this button is focused
    const disabled = getDisabled();
    if (!isFocused.value || disabled) return;

    // Enter or Space to activate
    if (key.return || input === ' ') {
      // Visual feedback: press and release
      isPressed.value = true;
      setTimeout(() => {
        isPressed.value = false;
      }, 100);

      props.onClick?.();
    }
  });

  // Variant colors (computed based on pressed state and disabled)
  const colors = {
    primary: {
      bg: () => {
        const disabled = getDisabled();
        return disabled ? 'gray' : isPressed.value ? 'blue' : 'cyan';
      },
      fg: () => {
        const disabled = getDisabled();
        return disabled ? 'white' : 'black';
      },
      border: 'cyan',
    },
    secondary: {
      bg: () => {
        const disabled = getDisabled();
        return disabled ? 'gray' : isPressed.value ? 'white' : undefined;
      },
      fg: () => {
        const disabled = getDisabled();
        return disabled ? 'white' : isPressed.value ? 'black' : 'white';
      },
      border: () => {
        const disabled = getDisabled();
        return disabled ? 'gray' : 'white';
      },
    },
    danger: {
      bg: () => {
        const disabled = getDisabled();
        return disabled ? 'gray' : isPressed.value ? 'red' : undefined;
      },
      fg: () => {
        const disabled = getDisabled();
        return disabled ? 'white' : 'red';
      },
      border: 'red',
    },
  };

  const colorScheme = colors[variant];

  return (
    <Box
      style={{
        borderStyle: () => (isFocused.value ? 'round' : 'single'),
        borderColor: () => {
          const disabled = getDisabled();
          return disabled ? 'gray' : isFocused.value ? colorScheme.border : undefined;
        },
        backgroundColor: colorScheme.bg,
        paddingX: 2,
        paddingY: 0,
        width,
        justifyContent: 'center',
      }}
      props={{ id, isPressed }}
    >
      <Text
        color={colorScheme.fg}
        bold={() => {
          const disabled = getDisabled();
          return !disabled && isFocused.value;
        }}
      >
        {() => {
          const disabled = getDisabled();
          const label = getLabel();
          return disabled ? `[${label}]` : label;
        }}
      </Text>
    </Box>
  );
}

/**
 * Handle button keyboard input
 * Call this from your app's onKeyPress handler for the focused button
 */
export function handleButton(
  isPressed: Signal<boolean>,
  disabled: boolean,
  key: string,
  onClick?: () => void,
): boolean {
  if (disabled) return false;

  // Enter or Space to activate
  if (key === '\r' || key === '\n' || key === ' ') {
    // Visual feedback: press and release
    isPressed.value = true;
    setTimeout(() => {
      isPressed.value = false;
    }, 100);

    onClick?.();
    return true;
  }

  return false;
}
