/**
 * React/Preact transformer
 *
 * Transforms:
 *   const count = signal(0);
 *   return <div>{count.value}</div>;
 *
 * Into:
 *   const count = signal(0);
 *   const count$ = useStore(count);
 *   return <div>{count$}</div>;
 */

import type MagicString from 'magic-string';

interface SignalUsage {
  name: string;
  positions: number[];
}

export function transformReact(code: string, s: MagicString, _id: string, debug: boolean): void {
  // Step 1: Find all signal variables
  const signals = findSignalVariables(code);

  if (signals.size === 0) {
    if (debug) {
    }
    return;
  }

  if (debug) {
  }

  // Step 2: Find all .value accesses in JSX
  const usages = new Map<string, SignalUsage>();

  for (const signalName of signals) {
    const regex = new RegExp(`\\b${signalName}\\.value\\b`, 'g');
    const positions: number[] = [];
    const matches = code.matchAll(regex);

    for (const match of matches) {
      positions.push(match.index);
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

  // Step 3: Add useStore import if not present
  if (!code.includes("from '@zen/signal-react'")) {
    addUseStoreImport(code, s);
  }

  // Step 4: Find component function boundaries
  const componentBodies = findComponentBodies(code);

  // Step 5: For each component, add useStore hooks
  for (const [signalName, usage] of usages) {
    const storeName = `${signalName}$`;

    // Find which component this signal is used in
    const componentBody = findContainingComponent(usage.positions[0], componentBodies);

    if (componentBody) {
      // Insert useStore hook at the start of component body
      const hookCode = `  const ${storeName} = useStore(${signalName});\n`;
      s.appendLeft(componentBody.start, hookCode);

      // Replace all signal.value with signal$
      for (const pos of usage.positions) {
        s.overwrite(pos, pos + signalName.length + 6, storeName); // +6 for '.value'
      }
    }
  }
}

/**
 * Find all signal variable declarations
 * Matches: const x = signal(...)
 */
function findSignalVariables(code: string): Set<string> {
  const signals = new Set<string>();
  const regex = /const\s+(\w+)\s*=\s*signal\(/g;
  const matches = code.matchAll(regex);

  for (const match of matches) {
    signals.add(match[1]);
  }

  return signals;
}

/**
 * Add useStore import from @zen/signal-react
 */
function addUseStoreImport(code: string, s: MagicString): void {
  // Find the last import statement
  const importRegex = /import\s+.*?from\s+['"].*?['"];?/g;
  let lastImportEnd = 0;
  const matches = code.matchAll(importRegex);

  for (const match of matches) {
    lastImportEnd = match.index + match[0].length;
  }

  const importStatement = "\nimport { useStore } from '@zen/signal-react';\n";

  if (lastImportEnd > 0) {
    s.appendLeft(lastImportEnd, importStatement);
  } else {
    // No imports found, add at the beginning
    s.prepend(importStatement);
  }
}

/**
 * Find all component function bodies
 * Returns array of { start, end } positions
 */
function findComponentBodies(code: string): Array<{ start: number; end: number }> {
  const bodies: Array<{ start: number; end: number }> = [];

  // Match function components
  // function Component() { ... }
  // const Component = () => { ... }
  const functionRegex =
    /(function\s+[A-Z]\w*\s*\([^)]*\)\s*\{|const\s+[A-Z]\w*\s*=\s*\([^)]*\)\s*=>\s*\{)/g;
  const matches = code.matchAll(functionRegex);

  for (const match of matches) {
    const start = match.index + match[0].length;
    const end = findMatchingBrace(code, start - 1);

    if (end !== -1) {
      bodies.push({ start, end });
    }
  }

  return bodies;
}

/**
 * Find the matching closing brace for an opening brace
 */
function findMatchingBrace(code: string, openPos: number): number {
  let depth = 1;
  for (let i = openPos + 1; i < code.length; i++) {
    if (code[i] === '{') depth++;
    if (code[i] === '}') depth--;
    if (depth === 0) return i;
  }
  return -1;
}

/**
 * Find which component body contains a given position
 */
function findContainingComponent(
  pos: number,
  bodies: Array<{ start: number; end: number }>,
): { start: number; end: number } | null {
  for (const body of bodies) {
    if (pos >= body.start && pos <= body.end) {
      return body;
    }
  }
  return null;
}
