/**
 * TextInput component for TUI
 *
 * Interactive text input with cursor, editing, and keyboard navigation.
 */

import { type Signal, onCleanup, signal } from '@zen/runtime';
import { useFocus } from '../focus';
import type { TUINode } from '../types';
import { Box } from './Box';
import { Text } from './Text';

export interface TextInputProps {
  value?: Signal<string> | string;
  placeholder?: string;
  onChange?: (value: string) => void;
  width?: number;
  id?: string;
  style?: any;
  cursor?: Signal<number>; // Optional external cursor control
}

export function TextInput(props: TextInputProps): TUINode {
  // Generate unique ID if not provided
  const id = props.id || `input-${Math.random().toString(36).slice(2, 9)}`;

  // Value management
  const valueSignal =
    typeof props.value === 'object' && 'value' in props.value
      ? props.value
      : signal(typeof props.value === 'string' ? props.value : '');

  // Cursor position (use external if provided, otherwise create internal)
  const cursorPos = props.cursor || signal(valueSignal.value.length);

  // Focus management
  const { isFocused } = useFocus(id, {
    onFocus: () => {
      // Reset cursor to end on focus
      cursorPos.value = valueSignal.value.length;
    },
    onBlur: () => {
      // Could trigger validation here
    },
  });

  const width = props.width || 40;
  const focused = isFocused;

  // Render input content
  const currentValue = valueSignal.value;
  const showPlaceholder = currentValue.length === 0 && props.placeholder;

  let displayText: TUINode;

  if (showPlaceholder) {
    // Show placeholder
    displayText = Text({
      children: props.placeholder,
      dim: true,
      style: { flexDirection: 'row' },
    });
  } else {
    // Show value with cursor
    const pos = Math.min(cursorPos.value, currentValue.length);

    if (focused) {
      // Render with cursor
      const before = currentValue.slice(0, pos);
      const cursorChar = pos < currentValue.length ? currentValue[pos] : ' ';
      const after = currentValue.slice(pos + 1);

      displayText = Text({
        style: { flexDirection: 'row' },
        children: [
          before,
          Text({
            children: cursorChar,
            backgroundColor: 'white',
            color: 'black',
          }),
          after,
        ],
      });
    } else {
      // Render without cursor
      displayText = Text({
        children: currentValue || ' ',
        style: { flexDirection: 'row' },
      });
    }
  }

  // Container box
  return Box({
    style: {
      width,
      borderStyle: focused ? 'round' : 'single',
      borderColor: focused ? 'cyan' : undefined,
      padding: 0,
      paddingX: 1,
      ...props.style,
    },
    children: displayText,
  });
}

/**
 * Input handler for TextInput
 * Call this from the app's key handler
 */
export function handleTextInput(
  valueSignal: Signal<string>,
  cursorPos: Signal<number>,
  key: string,
): boolean {
  const value = valueSignal.value;
  const pos = cursorPos.value;

  // Character input (printable characters)
  if (key.length === 1 && key >= ' ' && key <= '~') {
    // Insert character at cursor
    valueSignal.value = value.slice(0, pos) + key + value.slice(pos);
    cursorPos.value = pos + 1;
    return true;
  }

  // Special keys
  switch (key) {
    case '\x7F': // Backspace
    case '\b':
      if (pos > 0) {
        valueSignal.value = value.slice(0, pos - 1) + value.slice(pos);
        cursorPos.value = pos - 1;
      }
      return true;

    case '\x1b[3~': // Delete
      if (pos < value.length) {
        valueSignal.value = value.slice(0, pos) + value.slice(pos + 1);
      }
      return true;

    case '\x1b[D': // Left arrow
      if (pos > 0) {
        cursorPos.value = pos - 1;
      }
      return true;

    case '\x1b[C': // Right arrow
      if (pos < value.length) {
        cursorPos.value = pos + 1;
      }
      return true;

    case '\x1b[H': // Home
    case '\x01': // Ctrl+A
      cursorPos.value = 0;
      return true;

    case '\x1b[F': // End
    case '\x05': // Ctrl+E
      cursorPos.value = value.length;
      return true;

    default:
      return false;
  }
}
