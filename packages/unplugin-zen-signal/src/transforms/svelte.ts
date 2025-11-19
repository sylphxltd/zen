/**
 * Svelte transformer
 *
 * Transforms:
 *   const count = signal(0);
 *   <div>{count.value}</div>
 *
 * Into:
 *   const count = signal(0);
 *   $: count$ = count.value;
 *   <div>{count$}</div>
 */

import type MagicString from 'magic-string';

interface SignalUsage {
  name: string;
  positions: number[];
}

export function transformSvelte(code: string, s: MagicString, _id: string, debug: boolean): void {
  // Find the script section
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);

  if (!scriptMatch) {
    if (debug) {
    }
    return;
  }

  const scriptContent = scriptMatch[1];
  const scriptIndex = scriptMatch.index ?? 0;
  const scriptStart = scriptIndex + scriptMatch[0].indexOf('>') + 1;

  // Step 1: Find all signal variables
  const signals = findSignalVariables(scriptContent);

  if (signals.size === 0) {
    if (debug) {
    }
    return;
  }

  // Step 2: Find all .value accesses in template {expression} context only
  // Match {signal.value} but exclude event handlers and script section
  const usages = new Map<string, SignalUsage>();

  // Get template section (everything after </script>)
  const scriptEnd = scriptIndex + scriptMatch[0].length;
  const templateSection = code.slice(scriptEnd);

  for (const signalName of signals) {
    // Only match {signal.value} in template (Svelte interpolation syntax)
    // This excludes event handlers like on:click={() => signal.value++}
    const regex = new RegExp(`\\{\\s*(${signalName}\\.value)\\s*\\}`, 'g');
    const positions: number[] = [];
    const matches = templateSection.matchAll(regex);

    for (const match of matches) {
      const fullMatch = match[0];
      const valueExpr = match[1];
      const startPos = match.index;

      // Adjust position to account for script section
      const valueStart = scriptEnd + startPos + fullMatch.indexOf(valueExpr);
      positions.push(valueStart);
    }

    if (positions.length > 0) {
      usages.set(signalName, { name: signalName, positions });
    }
  }

  if (usages.size === 0) {
    return;
  }

  // Step 3: Add reactive statements after signal declarations
  for (const [signalName, usage] of usages) {
    const reactiveName = `${signalName}$`;

    // Find the signal declaration
    const signalDeclaration = new RegExp(`const\\s+${signalName}\\s*=\\s*signal\\([^)]*\\);?`);
    const match = scriptContent.match(signalDeclaration);

    if (match) {
      const declarationPos = scriptStart + scriptContent.indexOf(match[0]) + match[0].length;
      const reactiveCode = `\n  $: ${reactiveName} = ${signalName}.value;`;
      s.appendLeft(declarationPos, reactiveCode);

      // Replace all signal.value with signal$
      for (const pos of usage.positions) {
        s.overwrite(pos, pos + signalName.length + 6, reactiveName); // +6 for '.value'
      }
    }
  }
}

/**
 * Find all signal variable declarations
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
