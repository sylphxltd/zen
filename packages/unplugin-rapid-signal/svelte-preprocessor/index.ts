/**
 * Rapid Signal - Svelte Preprocessor
 *
 * Runtime-first signal integration for Svelte.
 * Auto-detects and unwraps Rapid signals using preprocessor + runtime helpers.
 *
 * Usage:
 * ```svelte
 * <script>
 * import { signal } from '@rapid/signal-core';
 *
 * const count = signal(0);
 * </script>
 *
 * <p>{count}</p>  <!-- Automatically reactive! -->
 * ```
 */

import MagicString from 'magic-string';
import type { PreprocessorGroup, Processed } from 'svelte/types/compiler/preprocess';

// ============================================================================
// RUNTIME HELPER
// ============================================================================

/**
 * Runtime helper function that unwraps signals
 * This is injected into the Svelte component at build time
 */
const UNWRAP_HELPER = `
function __zenUnwrap(value) {
  // Check if it's a Rapid signal
  if (value !== null && typeof value === 'object' && '_kind' in value) {
    return value.value;
  }
  return value;
}
`;

// ============================================================================
// PREPROCESSOR
// ============================================================================

interface SignalVariable {
  name: string;
  start: number;
  end: number;
}

/**
 * Find all signal variable declarations in script
 */
function findSignalVariables(scriptContent: string): Set<string> {
  const signals = new Set<string>();
  const regex = /const\s+(\w+)\s*=\s*signal\(/g;
  const matches = scriptContent.matchAll(regex);

  for (const match of matches) {
    signals.add(match[1]);
  }

  return signals;
}

/**
 * Find all reactive statements ($:) in script
 */
function findReactiveStatements(scriptContent: string): SignalVariable[] {
  const reactiveVars: SignalVariable[] = [];
  const regex = /\$:\s+(\w+)\s*=/g;
  const matches = scriptContent.matchAll(regex);

  for (const match of matches) {
    const name = match[1];
    const start = match.index ?? 0;
    const end = start + match[0].length;
    reactiveVars.push({ name, start, end });
  }

  return reactiveVars;
}

/**
 * Transform template expressions to unwrap signals
 */
function transformTemplate(
  template: string,
  signals: Set<string>,
  reactiveVars: Set<string>,
): string {
  const s = new MagicString(template);

  // Find all template expressions {variable}
  const allVars = new Set([...signals, ...reactiveVars]);

  for (const varName of allVars) {
    // Match {variable} but not {variable.property} or {function(variable)}
    // This is a simple pattern - only wrap standalone variables
    const regex = new RegExp(`\\{\\s*(${varName})\\s*\\}`, 'g');
    const matches = template.matchAll(regex);

    for (const match of matches) {
      const fullMatch = match[0];
      const variable = match[1];
      const startPos = match.index ?? 0;
      const exprStart = startPos + fullMatch.indexOf(variable);
      const exprEnd = exprStart + variable.length;

      // Wrap in unwrap helper
      s.overwrite(exprStart, exprEnd, `__zenUnwrap(${variable})`);
    }
  }

  return s.toString();
}

/**
 * Svelte preprocessor that auto-unwraps Rapid signals
 */
export function zenSignalPreprocessor(): PreprocessorGroup {
  return {
    name: 'rapid-signal-preprocessor',

    markup({ content, filename }): Processed | undefined {
      // Skip non-.svelte files
      if (!filename?.endsWith('.svelte')) {
        return;
      }

      // Check if file uses signals
      if (!content.includes('signal(')) {
        return;
      }

      // Extract script section
      const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      if (!scriptMatch) {
        return;
      }

      const scriptContent = scriptMatch[1];
      const scriptIndex = scriptMatch.index ?? 0;
      const _scriptStart = scriptIndex + scriptMatch[0].indexOf('>') + 1;
      const scriptEnd = scriptIndex + scriptMatch[0].length;

      // Find all signal variables
      const signals = findSignalVariables(scriptContent);

      if (signals.size === 0) {
        return;
      }

      // Find all reactive statements ($: var = ...)
      const reactiveStatements = findReactiveStatements(scriptContent);
      const reactiveVars = new Set(reactiveStatements.map((v) => v.name));

      // Transform template section
      const templateSection = content.slice(scriptEnd);
      const transformedTemplate = transformTemplate(templateSection, signals, reactiveVars);

      // Build final code
      const s = new MagicString(content);

      // Inject unwrap helper at the end of script
      s.appendLeft(scriptEnd - '</script>'.length, UNWRAP_HELPER);

      // Replace template
      s.overwrite(scriptEnd, content.length, transformedTemplate);

      return {
        code: s.toString(),
        map: s.generateMap({ source: filename, includeContent: true }),
      };
    },
  };
}

export default zenSignalPreprocessor;
