/**
 * Spinner component for TUI
 *
 * Animated loading spinner with multiple styles.
 */

import { type MaybeReactive, type Signal, onCleanup, resolve, signal } from '@rapid/runtime';
import type { TUINode } from '../core/types.js';
import { Text } from '../primitives/Text.js';

type SpinnerType = 'dots' | 'line' | 'arc' | 'arrow';

export interface SpinnerProps {
  /** Spinner animation type - supports MaybeReactive */
  type?: MaybeReactive<SpinnerType>;
  /** Spinner color - supports MaybeReactive */
  color?: MaybeReactive<string>;
  /** Spinner label - supports MaybeReactive */
  label?: MaybeReactive<string>;
}

const SPINNER_FRAMES = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['|', '/', '-', '\\'],
  arc: ['◜', '◠', '◝', '◞', '◡', '◟'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
};

/**
 * Spinner component - self-animating
 * Animation runs automatically using setInterval
 */
export function Spinner(props: SpinnerProps): TUINode {
  const intervalMs = 80;

  // Self-animating frame index
  const frameIndex = signal(0);

  // Start animation interval
  const interval = setInterval(() => {
    frameIndex.value = (frameIndex.value + 1) % 100; // Prevent overflow
  }, intervalMs);

  // Cleanup interval when component is disposed
  onCleanup(() => clearInterval(interval));

  // Return Text with reactive children
  return Text({
    children: () => {
      const type = resolve(props.type) || 'dots';
      const label = resolve(props.label);
      const frames = SPINNER_FRAMES[type];
      const currentFrame = frames[frameIndex.value % frames.length];
      return label ? `${currentFrame} ${label}` : currentFrame;
    },
    color: () => resolve(props.color) || 'cyan',
  });
}

/**
 * Update spinner frame
 * Call this periodically to animate the spinner
 */
export function updateSpinner(frameIndex: Signal<number>): void {
  frameIndex.value = (frameIndex.value + 1) % 100; // Prevent overflow
}

/**
 * Create an animated spinner that updates automatically
 * Returns cleanup function to stop the animation
 */
export function createAnimatedSpinner(
  props: SpinnerProps,
  intervalMs = 80,
): { node: TUINode; cleanup: () => void; frameIndex: Signal<number> } {
  const frameIndex = signal(0);
  const type = resolve(props.type) || 'dots';
  const frames = SPINNER_FRAMES[type];

  const interval = setInterval(() => {
    frameIndex.value = (frameIndex.value + 1) % frames.length;
  }, intervalMs);

  const cleanup = () => clearInterval(interval);

  const node = Text({
    children: () => {
      const currentFrame = frames[frameIndex.value % frames.length];
      const label = resolve(props.label);
      return label ? `${currentFrame} ${label}` : currentFrame;
    },
    color: () => resolve(props.color) || 'cyan',
  });

  return { node, cleanup, frameIndex };
}
