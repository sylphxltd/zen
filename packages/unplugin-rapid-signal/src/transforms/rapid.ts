/**
 * Rapid framework transformer
 *
 * Transforms:
 *   const count = signal(0);
 *   <div>{count.value}</div>
 *
 * Into:
 *   const count = signal(0);
 *   <div>{() => count.value}</div>
 *
 * Runtime then wraps function in effect for reactive updates.
 */

import type MagicString from 'magic-string';
import { findSignalVariables } from '../utils/common';

interface SignalUsage {
  name: string;
  positions: Array<{ start: number; end: number }>;
}

export function transformRapid(code: string, s: MagicString, _id: string, debug: boolean): void {
  // Step 1: Find all signal variables
  const signals = findSignalVariables(code);

  if (signals.size === 0) {
    if (debug) {
    }
    return;
  }

  if (debug) {
  }

  // Step 2: Find all .value accesses in JSX children context
  // Pattern: {signal.value} in JSX
  const usages = new Map<string, SignalUsage>();

  for (const signalName of signals) {
    // Match {signal.value} in JSX (with curly braces)
    const regex = new RegExp(`\\{\\s*(${signalName}\\.value)\\s*\\}`, 'g');
    const positions: Array<{ start: number; end: number }> = [];
    const matches = code.matchAll(regex);

    for (const match of matches) {
      // match[0] is the full {signal.value}
      // match[1] is signal.value
      const fullMatch = match[0];
      const valueExpr = match[1];
      const startPos = match.index;
      const _endPos = startPos + fullMatch.length;

      // Find the actual position of signal.value within the braces
      const valueStart = startPos + fullMatch.indexOf(valueExpr);
      const valueEnd = valueStart + valueExpr.length;

      positions.push({ start: valueStart, end: valueEnd });
    }

    if (positions.length > 0) {
      usages.set(signalName, { name: signalName, positions });
    }
  }

  if (usages.size === 0) {
    if (debug) {
    }
    return;
  }

  if (debug) {
  }

  // Step 3: Wrap each signal.value in arrow function
  // Process in reverse order to maintain correct positions
  const allPositions: Array<{ start: number; end: number; name: string }> = [];

  for (const [signalName, usage] of usages) {
    for (const pos of usage.positions) {
      allPositions.push({ ...pos, name: signalName });
    }
  }

  // Sort by start position (descending) to process from end to start
  allPositions.sort((a, b) => b.start - a.start);

  for (const { start, end, name } of allPositions) {
    // Wrap signal.value with arrow function
    s.overwrite(start, end, `() => ${name}.value`);
  }
}
