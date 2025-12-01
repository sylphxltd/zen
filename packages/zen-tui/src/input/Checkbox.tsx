/**
 * Checkbox component for TUI
 *
 * Interactive checkbox with keyboard toggle.
 */

import { type MaybeReactive, type Signal, createUniqueId, resolve, signal } from '@zen/runtime';
import type { TUINode, TUIStyle } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';
import { useFocus } from '../utils/focus.js';

export interface CheckboxProps {
  /** Checked state - supports Signal or MaybeReactive */
  checked?: Signal<boolean> | MaybeReactive<boolean>;
  /** Label text - supports MaybeReactive */
  label?: MaybeReactive<string>;
  /** Called when checked changes */
  onChange?: (checked: boolean) => void;
  /** Focus ID for FocusProvider */
  id?: string;
  /** Auto-focus this checkbox on mount */
  autoFocus?: boolean;
  /** Fixed width */
  width?: number;
  /** Custom styles */
  style?: TUIStyle;
}

export function Checkbox(props: CheckboxProps): TUINode {
  // Generate unique ID if not provided
  const id = props.id || `checkbox-${createUniqueId()}`;

  // Checked state management
  const checkedSignal =
    typeof props.checked === 'object' && 'value' in props.checked
      ? props.checked
      : signal(typeof props.checked === 'boolean' ? props.checked : false);

  // Focus management
  const { isFocused } = useFocus({ id, autoFocus: props.autoFocus });

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused.value) return;

    handleCheckbox(checkedSignal, input, props.onChange);
  });

  // Helper to get label (uses resolve for MaybeReactive)
  const getLabel = () => resolve(props.label);

  // Simple text-based checkbox - no box wrapper, just reactive text
  return Text({
    children: () => {
      const checked = checkedSignal.value;
      const label = getLabel();
      const checkboxChar = checked ? '☑' : '☐';
      const combinedText = label ? `${checkboxChar} ${label}` : checkboxChar;

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
