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
  declarationEnd: number;
}

interface SignalInfo {
  name: string;
  start: number;
  end: number;
}

export function transformReact(code: string, s: MagicString, _id: string, debug: boolean): void {
  // Step 1: Find all signal variables with their positions
  const signals = findSignalVariablesWithPositions(code);

  if (signals.size === 0) {
    if (debug) {
    }
    return;
  }

  if (debug) {
  }

  // Step 2: Find all .value accesses in JSX children context only
  // Match {signal.value} patterns (similar to Zen transformer)
  const usages = new Map<string, SignalUsage>();

  for (const [signalName, signalInfo] of signals) {
    // Match {signal.value} in JSX (with curly braces)
    const regex = new RegExp(`\\{\\s*(${signalName}\\.value)\\s*\\}`, 'g');
    const positions: number[] = [];
    const matches = code.matchAll(regex);

    for (const match of matches) {
      const fullMatch = match[0];
      const valueExpr = match[1];
      const startPos = match.index;

      // Find the actual position of signal.value within the braces
      const valueStart = startPos + fullMatch.indexOf(valueExpr);

      positions.push(valueStart);
    }

    if (positions.length > 0) {
      usages.set(signalName, { name: signalName, positions, declarationEnd: signalInfo.end });
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

  // Step 4: Group signals by component and find insertion point
  const componentBodies = findComponentBodies(code);

  // For each component, collect all signals and add hooks after the last signal declaration
  const componentSignals = new Map<string, Map<string, SignalUsage>>();

  for (const [signalName, usage] of usages) {
    const componentBody = findContainingComponent(usage.positions[0], componentBodies);

    if (componentBody) {
      const key = `${componentBody.start}-${componentBody.end}`;
      if (!componentSignals.has(key)) {
        componentSignals.set(key, new Map());
      }
      componentSignals.get(key)?.set(signalName, usage);
    }
  }

  // Step 5: Add hooks and replace values
  for (const [_componentKey, signals] of componentSignals) {
    // Find the last signal declaration position
    let lastDeclarationEnd = 0;
    for (const [_signalName, usage] of signals) {
      if (usage.declarationEnd > lastDeclarationEnd) {
        lastDeclarationEnd = usage.declarationEnd;
      }
    }

    // Insert all useStore hooks after the last signal declaration
    let hooksCode = '\n';
    for (const [signalName, usage] of signals) {
      const storeName = `${signalName}$`;
      hooksCode += `  const ${storeName} = useStore(${signalName});\n`;

      // Replace signal.value with signal$ in JSX
      for (const pos of usage.positions) {
        s.overwrite(pos, pos + signalName.length + 6, storeName); // +6 for '.value'
      }
    }

    // Insert hooks after last signal declaration
    s.appendLeft(lastDeclarationEnd, hooksCode);
  }
}

/**
 * Find all signal variable declarations with their positions
 * Matches: const x = signal(...)
 * Returns Map of signal name to { name, start, end }
 */
function findSignalVariablesWithPositions(code: string): Map<string, SignalInfo> {
  const signals = new Map<string, SignalInfo>();
  const regex = /const\s+(\w+)\s*=\s*signal\([^)]*\);?/g;
  const matches = code.matchAll(regex);

  for (const match of matches) {
    const name = match[1];
    const start = match.index;
    const end = start + match[0].length;

    signals.set(name, { name, start, end });
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
