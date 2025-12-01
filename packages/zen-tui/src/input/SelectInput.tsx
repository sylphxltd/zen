/**
 * SelectInput component for TUI
 *
 * Dropdown/select input with keyboard navigation.
 */

import { type MaybeReactive, type Signal, resolve, signal } from '@zen/runtime';
import type { TUINode, TUIStyle } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';
import { useFocus } from '../utils/focus.js';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface SelectInputProps<T = string> {
  /** Select options - supports MaybeReactive */
  options: MaybeReactive<SelectOption<T>[]>;
  /** Current value - supports Signal or MaybeReactive */
  value?: Signal<T> | MaybeReactive<T>;
  /** Called when value changes */
  onChange?: (value: T) => void;
  /** Placeholder text - supports MaybeReactive */
  placeholder?: MaybeReactive<string>;
  /** Input width - supports MaybeReactive */
  width?: MaybeReactive<number>;
  /** Focus ID for FocusProvider */
  id?: string;
  /** Auto-focus this select on mount */
  autoFocus?: boolean;
  /** Custom styles */
  style?: TUIStyle;
  /** External dropdown state control */
  isOpen?: Signal<boolean>;
  /** External highlight control */
  highlightedIndex?: Signal<number>;
}

export function SelectInput<T = string>(props: SelectInputProps<T>): TUINode {
  // Generate unique ID if not provided
  const id = props.id || `select-${Math.random().toString(36).slice(2, 9)}`;

  // Helpers to resolve MaybeReactive props
  const getOptions = () => resolve(props.options);
  const getWidth = () => resolve(props.width) || 40;
  const getPlaceholder = () => resolve(props.placeholder);

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
    autoFocus: props.autoFocus,
    onFocus: () => {
      // Reset highlight to current selection
      const options = getOptions();
      const currentIndex = options.findIndex((opt) => opt.value === valueSignal.value);
      highlightedIndex.value = currentIndex >= 0 ? currentIndex : 0;
    },
    onBlur: () => {
      isOpen.value = false;
    },
  });

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused.value) return;

    handleSelectInput(isOpen, highlightedIndex, valueSignal, getOptions(), input, props.onChange);
  });

  // Use reactive functions for rendering
  return Box({
    style: { width: () => getWidth() },
    children: () => {
      // This function re-runs when signals change
      const opened = isOpen.value;
      const options = getOptions();
      const width = getWidth();
      const placeholder = getPlaceholder();

      // Find selected option
      const selectedOption = options.find((opt) => opt.value === valueSignal.value);
      const displayLabel = selectedOption?.label || placeholder || 'Select...';

      // Render current selection
      // WORKAROUND: Concatenate label and arrow into single Text to avoid flexDirection: 'row' overflow bug
      const arrow = opened ? '▲' : '▼';
      const combinedText = `${displayLabel} ${arrow}`;

      const selectionDisplay = Box({
        style: {
          width,
          borderStyle: () => (isFocused.value ? 'round' : 'single'),
          borderColor: () => (isFocused.value ? 'cyan' : undefined),
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
        children: options.map((option, index) => {
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
