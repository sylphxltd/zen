/**
 * SelectInput component for TUI
 *
 * Dropdown/select input with keyboard navigation.
 */

import { type Signal, signal } from '@zen/runtime';
import { useFocus } from '../focus';
import type { TUINode } from '../types';
import { useInput } from '../useInput';
import { Box } from './Box';
import { Text } from './Text';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface SelectInputProps<T = string> {
  options: SelectOption<T>[];
  value?: Signal<T> | T;
  onChange?: (value: T) => void;
  placeholder?: string;
  width?: number;
  id?: string;
  style?: any;
  isOpen?: Signal<boolean>; // Optional external dropdown state control
  highlightedIndex?: Signal<number>; // Optional external highlight control
}

export function SelectInput<T = string>(props: SelectInputProps<T>): TUINode {
  // Generate unique ID if not provided
  const id = props.id || `select-${Math.random().toString(36).slice(2, 9)}`;

  // Value management
  const valueSignal =
    typeof props.value === 'object' && 'value' in props.value
      ? (props.value as Signal<T>)
      : signal(props.value as T);

  // Dropdown open state (use external if provided, otherwise create internal)
  const isOpen = props.isOpen || signal(false);

  // Highlighted option index (use external if provided, otherwise create internal)
  const highlightedIndex = props.highlightedIndex || signal(0);

  // Focus management
  const { isFocused } = useFocus({
    id,
    onFocus: () => {
      // Reset highlight to current selection
      const currentIndex = props.options.findIndex((opt) => opt.value === valueSignal.value);
      highlightedIndex.value = currentIndex >= 0 ? currentIndex : 0;
    },
    onBlur: () => {
      isOpen.value = false;
    },
  });

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused) return;

    handleSelectInput(isOpen, highlightedIndex, valueSignal, props.options, input, props.onChange);
  });

  const width = props.width || 40;

  // Use reactive functions for rendering
  return Box({
    style: { width },
    children: () => {
      // This function re-runs when signals change
      const opened = isOpen.value;

      // Find selected option
      const selectedOption = props.options.find((opt) => opt.value === valueSignal.value);
      const displayLabel = selectedOption?.label || props.placeholder || 'Select...';

      // Render current selection
      // WORKAROUND: Concatenate label and arrow into single Text to avoid flexDirection: 'row' overflow bug
      const arrow = opened ? '▲' : '▼';
      const combinedText = `${displayLabel} ${arrow}`;

      const selectionDisplay = Box({
        style: {
          width,
          borderStyle: () => (isFocused ? 'round' : 'single'),
          borderColor: () => (isFocused ? 'cyan' : undefined),
          padding: 0,
          paddingX: 1,
          ...props.style,
        },
        children: Text({
          children: combinedText,
          dim: !selectedOption,
          color: 'cyan',
        }),
      });

      // Render dropdown if open
      if (!opened) {
        return selectionDisplay;
      }

      const highlighted = highlightedIndex.value;

      const optionsList = Box({
        style: {
          width,
          borderStyle: 'single',
          padding: 0,
        },
        children: props.options.map((option, index) => {
          const isHighlighted = index === highlighted;
          const isSelected = option.value === valueSignal.value;

          return Box({
            style: {
              backgroundColor: isHighlighted ? 'cyan' : undefined,
              paddingX: 1,
            },
            children: Text({
              children: [isSelected ? '✓ ' : '  ', option.label],
              color: isHighlighted ? 'black' : undefined,
              bold: isSelected,
            }),
          });
        }),
      });

      // Return both selection and dropdown
      return [selectionDisplay, optionsList];
    },
  });
}

/**
 * Input handler for SelectInput
 * Call this from the app's key handler
 */
export function handleSelectInput<T>(
  isOpen: Signal<boolean>,
  highlightedIndex: Signal<number>,
  valueSignal: Signal<T>,
  options: SelectOption<T>[],
  key: string,
  onChange?: (value: T) => void,
): boolean {
  // Enter/Space: toggle dropdown or select option
  if (key === '\r' || key === '\n' || key === ' ') {
    if (!isOpen.value) {
      isOpen.value = true;
    } else {
      // Select highlighted option
      const option = options[highlightedIndex.value];
      if (option) {
        valueSignal.value = option.value;
        onChange?.(option.value);
      }
      isOpen.value = false;
    }
    return true;
  }

  // Escape: close dropdown
  if (key === '\x1b') {
    isOpen.value = false;
    return true;
  }

  // Arrow keys: navigate options (only when open)
  if (isOpen.value) {
    if (key === '\x1b[A') {
      // Up arrow
      highlightedIndex.value = Math.max(0, highlightedIndex.value - 1);
      return true;
    }

    if (key === '\x1b[B') {
      // Down arrow
      highlightedIndex.value = Math.min(options.length - 1, highlightedIndex.value + 1);
      return true;
    }
  } else {
    // When closed, up/down arrows change selection directly
    if (key === '\x1b[A') {
      // Up arrow
      const currentIndex = options.findIndex((opt) => opt.value === valueSignal.value);
      const newIndex = Math.max(0, currentIndex - 1);
      valueSignal.value = options[newIndex].value;
      onChange?.(options[newIndex].value);
      return true;
    }

    if (key === '\x1b[B') {
      // Down arrow
      const currentIndex = options.findIndex((opt) => opt.value === valueSignal.value);
      const newIndex = Math.min(options.length - 1, currentIndex + 1);
      valueSignal.value = options[newIndex].value;
      onChange?.(options[newIndex].value);
      return true;
    }
  }

  return false;
}
