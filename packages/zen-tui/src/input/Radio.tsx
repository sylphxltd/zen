/**
 * Radio component for TUI
 *
 * Radio button group - select one option from multiple choices.
 * Matches Ink radio button behavior.
 */

import { type MaybeReactive, type Signal, resolve, signal } from '@zen/runtime';
import type { TUINode, TUIStyle } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';
import { useFocus } from '../utils/focus.js';

export interface RadioOption<T = string> {
  label: string;
  value: T;
}

export interface RadioProps<T = string> {
  /** Radio options - supports MaybeReactive */
  options: MaybeReactive<RadioOption<T>[]>;
  /** Current value - supports Signal or MaybeReactive */
  value?: Signal<T | undefined> | MaybeReactive<T | undefined>;
  /** Called when value changes */
  onChange?: (value: T) => void;
  /** Focus ID for FocusProvider */
  id?: string;
  /** Auto-focus this radio group on mount */
  autoFocus?: boolean;
  /** Custom styles */
  style?: TUIStyle;
  /** External highlight control */
  highlightedIndex?: Signal<number>;
}

export function Radio<T = string>(props: RadioProps<T>): TUINode {
  const id = props.id || `radio-${Math.random().toString(36).slice(2, 9)}`;

  // Helper to resolve options (supports MaybeReactive)
  const getOptions = () => resolve(props.options);

  // Value management
  const valueSignal =
    typeof props.value === 'object' && props.value && 'value' in props.value
      ? (props.value as Signal<T | undefined>)
      : signal<T | undefined>(props.value as T | undefined);

  // Highlighted option index
  const highlightedIndex = props.highlightedIndex || signal(0);

  // Focus management
  const { isFocused } = useFocus({ id, autoFocus: props.autoFocus });

  // Handle keyboard input
  useInput((input, _key) => {
    if (!isFocused.value) return;

    handleRadioInput(input, highlightedIndex, valueSignal, getOptions(), props.onChange);
  });

  return Box({
    style: {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'cyan',
      paddingX: 1,
      ...props.style,
    },
    children: () => {
      const focused = isFocused.value;
      const highlighted = highlightedIndex.value;
      const currentValue = valueSignal.value;
      const options = getOptions();

      return options.map((option, index) => {
        const isHighlighted = focused && highlighted === index;
        const isSelected = currentValue === option.value;
        const indicator = isSelected ? '◉' : '○';
        const prefix = isHighlighted ? '> ' : '  ';

        return Text({
          key: `option-${index}`,
          children: `${prefix}${indicator} ${option.label}`,
          color: isSelected ? 'cyan' : isHighlighted ? 'white' : 'white',
          bold: isHighlighted || isSelected,
          inverse: isHighlighted,
        });
      });
    },
  });
}

/**
 * Input handler for Radio
 */
export function handleRadioInput<T>(
  key: string,
  highlightedIndex: Signal<number>,
  valueSignal: Signal<T | undefined>,
  options: RadioOption<T>[],
  onChange?: (value: T) => void,
): boolean {
  const currentIndex = highlightedIndex.value;

  switch (key) {
    case '\x1b[A': // Up arrow
    case 'k':
      if (currentIndex > 0) {
        highlightedIndex.value = currentIndex - 1;
      }
      return true;

    case '\x1b[B': // Down arrow
    case 'j':
      if (currentIndex < options.length - 1) {
        highlightedIndex.value = currentIndex + 1;
      }
      return true;

    case '\r': // Enter
    case ' ': {
      // Space
      const selected = options[currentIndex];
      if (selected) {
        valueSignal.value = selected.value;
        onChange?.(selected.value);
      }
      return true;
    }

    default:
      return false;
  }
}
