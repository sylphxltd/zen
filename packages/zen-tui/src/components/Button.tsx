/**
 * Button component for TUI
 *
 * Interactive button with visual feedback and keyboard support.
 */

import { type Signal, signal } from '@zen/runtime';
import { useFocus } from '../focus';
import type { TUINode } from '../types';
import { useInput } from '../useInput';
import { Box } from './Box';
import { Text } from './Text';

export interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean | (() => boolean);
  variant?: 'primary' | 'secondary' | 'danger';
  width?: number;
  id?: string;
}

export function Button(props: ButtonProps): TUINode {
  const id = props.id || `button-${Math.random().toString(36).slice(2, 9)}`;
  const variant = props.variant || 'primary';
  const width = props.width;

  // Visual pressed state
  const isPressed = signal(false);

  // Helper to get current disabled state
  const getDisabled = () => {
    return typeof props.disabled === 'function' ? props.disabled() : props.disabled || false;
  };

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
    if (!isFocused || disabled) return;

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
        borderStyle: () => (isFocused ? 'round' : 'single'),
        borderColor: () => {
          const disabled = getDisabled();
          return disabled ? 'gray' : isFocused ? colorScheme.border : undefined;
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
          return !disabled && isFocused;
        }}
      >
        {() => {
          const disabled = getDisabled();
          return disabled ? `[${props.label}]` : props.label;
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
