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
  const { isFocused } = useFocus(id);

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused) return;

    handleCheckbox(checkedSignal, input, props.onChange);
  });

  // Use reactive functions for rendering
  return Box({
    style: {
      width: props.width,
      borderStyle: () => (isFocused ? 'round' : 'none'),
      borderColor: () => (isFocused ? 'cyan' : undefined),
      paddingX: () => (isFocused ? 1 : 0),
      ...props.style,
    },
    children: () => {
      // This function re-runs when signals change
      const checked = checkedSignal.value;
      const checkboxChar = checked ? '☑' : '☐';

      // Truncate label to fit within width
      let displayLabel = props.label;

      if (props.width && props.label) {
        // Account for: checkbox char(1) + space(1) + padding when focused(2) + borders when focused(2) + safety margin
        const safetyMargin = 20;
        const maxLabelWidth = Math.max(10, props.width - safetyMargin);

        if (props.label.length > maxLabelWidth) {
          displayLabel = `${props.label.slice(0, maxLabelWidth - 3)}...`;
        }
      }

      // WORKAROUND: Concatenate checkbox and label into single Text to avoid flexDirection: 'row' overflow bug
      const combinedText = displayLabel ? `${checkboxChar} ${displayLabel}` : checkboxChar;

      return Text({
        children: combinedText,
        color: checked ? 'green' : 'white',
        bold: isFocused,
      });
    },
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
