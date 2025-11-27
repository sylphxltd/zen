/**
 * ProgressBar component for TUI
 *
 * Visual progress indicator with percentage display.
 */

import { type MaybeReactive, type Signal, resolve, signal } from '@zen/runtime';
import type { TUINode } from '../core/types.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';

export interface ProgressBarProps {
  /** Progress value 0-100 - supports Signal or MaybeReactive */
  value: Signal<number> | MaybeReactive<number>;
  /** Progress bar width - supports MaybeReactive */
  width?: MaybeReactive<number>;
  /** Show percentage text - supports MaybeReactive */
  showPercentage?: MaybeReactive<boolean>;
  /** Progress bar color - supports MaybeReactive */
  color?: MaybeReactive<string>;
  /** Color when completed - supports MaybeReactive */
  completedColor?: MaybeReactive<string>;
  /** Label text - supports MaybeReactive */
  label?: MaybeReactive<string>;
  /** Fill character - supports MaybeReactive */
  char?: MaybeReactive<string>;
}

export function ProgressBar(props: ProgressBarProps): TUINode {
  // Value management
  const valueSignal =
    typeof props.value === 'object' && 'value' in props.value
      ? props.value
      : signal(typeof props.value === 'number' ? props.value : 0);

  return Box({
    style: {
      flexDirection: 'column',
      width: () => resolve(props.width) || 40,
    },
    children: () => {
      const width = resolve(props.width) || 40;
      const showPercentage = resolve(props.showPercentage) !== false; // default true
      const color = resolve(props.color) || 'cyan';
      const completedColor = resolve(props.completedColor) || 'green';
      const char = resolve(props.char) || '█';
      const labelText = resolve(props.label);

      const value = Math.min(100, Math.max(0, valueSignal.value)); // Clamp 0-100
      const isComplete = value >= 100;

      // Calculate bar segments
      const barWidth = showPercentage ? width - 7 : width - 2; // Account for borders and percentage
      const filledWidth = Math.round((value / 100) * barWidth);
      const emptyWidth = barWidth - filledWidth;

      const filledBar = char.repeat(filledWidth);
      const emptyBar = '░'.repeat(emptyWidth);

      const percentageText = showPercentage ? ` ${value.toFixed(0)}%` : '';

      const barContent = `${filledBar}${emptyBar}${percentageText}`;

      return [
        // Label (if provided)
        labelText
          ? Text({
              children: labelText,
              color: isComplete ? completedColor : color,
              bold: true,
            })
          : null,

        // Progress bar
        Box({
          style: {
            borderStyle: 'single',
            borderColor: isComplete ? completedColor : color,
            width: width,
          },
          children: Text({
            children: barContent,
            color: isComplete ? completedColor : color,
          }),
        }),
      ].filter(Boolean);
    },
  });
}

/**
 * Increment progress value
 * Helper function to update progress
 */
export function incrementProgress(valueSignal: Signal<number>, amount = 1): void {
  valueSignal.value = Math.min(100, valueSignal.value + amount);
}

/**
 * Set progress value
 * Helper function to set progress to a specific value
 */
export function setProgress(valueSignal: Signal<number>, value: number): void {
  valueSignal.value = Math.min(100, Math.max(0, value));
}

/**
 * Reset progress to zero
 */
export function resetProgress(valueSignal: Signal<number>): void {
  valueSignal.value = 0;
}
