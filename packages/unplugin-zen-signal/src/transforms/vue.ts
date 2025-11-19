/**
 * Vue transformer
 *
 * Transforms:
 *   const count = signal(0);
 *   <div>{{ count.value }}</div>
 *
 * Into:
 *   import { computed } from 'vue';
 *   const count = signal(0);
 *   const count$ = computed(() => count.value);
 *   <div>{{ count$ }}</div>
 */

import type MagicString from 'magic-string';

interface SignalUsage {
  name: string;
  positions: number[];
}

export function transformVue(code: string, s: MagicString, _id: string, debug: boolean): void {
  // Check if this is a Vue SFC
  const _hasTemplate = code.includes('<template>');
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);

  if (!scriptMatch) {
    if (debug) {
    }
    return;
  }

  const scriptContent = scriptMatch[1];
  const scriptIndex = scriptMatch.index ?? 0;
  const scriptStart = scriptIndex + scriptMatch[0].indexOf('>') + 1;

  // Step 1: Find all signal variables in script
  const signals = findSignalVariables(scriptContent);

  if (signals.size === 0) {
    if (debug) {
    }
    return;
  }

  // Step 2: Find all .value accesses in template {{ }} context only
  const usages = new Map<string, SignalUsage>();

  for (const signalName of signals) {
    // Only match {{ signal.value }} in templates (Vue interpolation syntax)
    const regex = new RegExp(`\\{\\{\\s*(${signalName}\\.value)\\s*\\}\\}`, 'g');
    const positions: number[] = [];
    const matches = code.matchAll(regex);

    for (const match of matches) {
      const fullMatch = match[0];
      const valueExpr = match[1];
      const startPos = match.index;

      // Find position of signal.value within the braces
      const valueStart = startPos + fullMatch.indexOf(valueExpr);
      positions.push(valueStart);
    }

    if (positions.length > 0) {
      usages.set(signalName, { name: signalName, positions });
    }
  }

  if (usages.size === 0) {
    return;
  }

  // Step 3: Add Vue computed import if not present
  if (!scriptContent.includes("from 'vue'") && !scriptContent.includes('from "vue"')) {
    addVueComputedImport(code, s, scriptStart);
  }

  // Step 4: Add computed refs after signal declarations
  for (const [signalName, usage] of usages) {
    const computedName = `${signalName}$`;

    // Find the signal declaration
    const signalDeclaration = new RegExp(`const\\s+${signalName}\\s*=\\s*signal\\([^)]*\\);?`);
    const match = scriptContent.match(signalDeclaration);

    if (match) {
      const declarationPos = scriptStart + scriptContent.indexOf(match[0]) + match[0].length;
      const computedCode = `\n  const ${computedName} = computed(() => ${signalName}.value);`;
      s.appendLeft(declarationPos, computedCode);

      // Replace all signal.value with signal$
      for (const pos of usage.positions) {
        s.overwrite(pos, pos + signalName.length + 6, computedName); // +6 for '.value'
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

/**
 * Add Vue computed import
 */
function addVueComputedImport(code: string, s: MagicString, scriptStart: number): void {
  // Find existing vue import
  const vueImportRegex = /import\s+{([^}]*)}\s+from\s+['"]vue['"]/;
  const match = code.match(vueImportRegex);

  if (match) {
    // Add computed to existing import
    const imports = match[1];
    if (!imports.includes('computed')) {
      const newImports = imports.trim() ? `${imports}, computed` : 'computed';
      const matchIndex = match.index ?? 0;
      s.overwrite(matchIndex + 8, matchIndex + 8 + match[1].length, newImports);
    }
  } else {
    // Add new import at the start of script
    s.appendLeft(scriptStart, "import { computed } from 'vue';\n");
  }
}
