/**
 * Checkbox component for TUI
 *
 * Interactive checkbox with keyboard toggle.
 */

import { type Signal, signal } from '@zen/runtime';
import { useFocus } from '../focus';
import type { TUINode } from '../types';
import { useInput } from '../useInput';
import { Box } from './Box';
import { Text } from './Text';

export interface CheckboxProps {
  checked?: Signal<boolean> | boolean;
  label?: string;
  onChange?: (checked: boolean) => void;
  id?: string;
  width?: number;
  style?: any;
}

export function Checkbox(props: CheckboxProps): TUINode {
  // Generate unique ID if not provided
  const id = props.id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

  // Checked state management
  const checkedSignal =
    typeof props.checked === 'object' && 'value' in props.checked
      ? props.checked
      : signal(typeof props.checked === 'boolean' ? props.checked : false);

  // Focus management
  const { isFocused } = useFocus({ id });

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused.value) return;

    handleCheckbox(checkedSignal, input, props.onChange);
  });

  // Simple text-based checkbox - no box wrapper, just reactive text
  return Text({
    children: () => {
      const checked = checkedSignal.value;
      const checkboxChar = checked ? '☑' : '☐';
      const combinedText = props.label ? `${checkboxChar} ${props.label}` : checkboxChar;

      // When focused, add visual indicator
      return isFocused.value ? `> ${combinedText}` : `  ${combinedText}`;
    },
    color: () => (checkedSignal.value ? 'green' : 'white'),
    bold: () => isFocused.value,
    ...props.style,
  });
}

/**
 * Input handler for Checkbox
 * Call this from the app's key handler
 */
export function handleCheckbox(
  checkedSignal: Signal<boolean>,
  key: string,
  onChange?: (checked: boolean) => void,
): boolean {
  // Space or Enter: toggle checkbox
  if (key === ' ' || key === '\r' || key === '\n') {
    const newValue = !checkedSignal.value;
    checkedSignal.value = newValue;
    onChange?.(newValue);
    return true;
  }

  return false;
}
