/**
 * Zen Compiler Plugin for Babel
 *
 * Performs static dependency analysis and optimizations:
 * 1. Detects zen() and computed() calls
 * 2. Builds dependency graph at compile time
 * 3. Generates optimized runtime code
 *
 * Example transformation:
 *
 * // Before (user code):
 * const a = zen(1);
 * const b = zen(2);
 * const c = computed(() => a.value + b.value);
 *
 * // After (optimized):
 * const __zenGraph = {
 *   signals: [1, 2],
 *   computed: [{ deps: [0, 1], fn: (a, b) => a + b }]
 * };
 * const a = __zenGraph.signals[0];
 * const b = __zenGraph.signals[1];
 * const c = __zenGraph.computed[0];
 */

import type { PluginObj, PluginPass } from '@babel/core';
import * as t from '@babel/types';

interface ZenCompilerOptions {
  /**
   * Enable static dependency analysis
   * @default true
   */
  staticAnalysis?: boolean;

  /**
   * Inline pure computed values
   * @default true
   */
  inlineComputed?: boolean;

  /**
   * Generate dev-time warnings for non-optimizable patterns
   * @default true
   */
  warnings?: boolean;

  /**
   * Module name to detect zen imports from
   * @default '@sylphx/zen'
   */
  moduleName?: string;
}

interface SignalInfo {
  id: number;
  name: string;
  node: t.VariableDeclarator;
  initialValue: t.Expression;
}

interface ComputedInfo {
  id: number;
  name: string;
  node: t.VariableDeclarator;
  deps: Set<string>;
  fn: t.ArrowFunctionExpression | t.FunctionExpression;
}

interface GraphState {
  signals: Map<string, SignalInfo>;
  computed: Map<string, ComputedInfo>;
  nextId: number;
}

/**
 * Topological sort for dependency graph
 * Returns execution order (signals first, then computed in dependency order)
 */
function topologicalSort(
  signals: Map<string, SignalInfo>,
  computed: Map<string, ComputedInfo>
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  // Helper function for DFS
  function visit(name: string) {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      console.warn(`[zen-compiler] Circular dependency detected involving: ${name}`);
      return;
    }

    visiting.add(name);

    // If it's a computed, visit its dependencies first
    const comp = computed.get(name);
    if (comp) {
      for (const dep of comp.deps) {
        visit(dep);
      }
    }

    visiting.delete(name);
    visited.add(name);
    result.push(name);
  }

  // Visit all signals first (they have no dependencies)
  for (const signalName of signals.keys()) {
    visit(signalName);
  }

  // Visit all computed values
  for (const computedName of computed.keys()) {
    visit(computedName);
  }

  return result;
}

/**
 * Generate optimized graph code
 */
function generateGraphCode(
  signals: Map<string, SignalInfo>,
  computed: Map<string, ComputedInfo>,
  executionOrder: string[]
): t.VariableDeclaration | null {
  if (signals.size === 0 && computed.size === 0) return null;

  // Build name-to-id mapping
  const nameToId = new Map<string, number>();
  let currentId = 0;

  for (const name of executionOrder) {
    nameToId.set(name, currentId++);
  }

  // Generate signals array
  const signalsArray = t.arrayExpression(
    Array.from(signals.values())
      .sort((a, b) => nameToId.get(a.name)! - nameToId.get(b.name)!)
      .map((sig) =>
        t.objectExpression([
          t.objectProperty(t.identifier('id'), t.numericLiteral(nameToId.get(sig.name)!)),
          t.objectProperty(t.identifier('value'), sig.initialValue),
        ])
      )
  );

  // Generate computed array
  const computedArray = t.arrayExpression(
    Array.from(computed.values())
      .sort((a, b) => nameToId.get(a.name)! - nameToId.get(b.name)!)
      .map((comp) => {
        // Convert dep names to IDs
        const depIds = Array.from(comp.deps).map((depName) => nameToId.get(depName)!);

        return t.objectExpression([
          t.objectProperty(t.identifier('id'), t.numericLiteral(nameToId.get(comp.name)!)),
          t.objectProperty(
            t.identifier('deps'),
            t.arrayExpression(depIds.map((id) => t.numericLiteral(id)))
          ),
          t.objectProperty(t.identifier('fn'), comp.fn),
        ]);
      })
  );

  // Generate execution order array
  const executionOrderArray = t.arrayExpression(
    executionOrder.map((name) => t.numericLiteral(nameToId.get(name)!))
  );

  // Generate: const __zenGraph = { signals, computed, executionOrder }
  const graphObject = t.objectExpression([
    t.objectProperty(t.identifier('signals'), signalsArray),
    t.objectProperty(t.identifier('computed'), computedArray),
    t.objectProperty(t.identifier('executionOrder'), executionOrderArray),
  ]);

  return t.variableDeclaration('const', [
    t.variableDeclarator(t.identifier('__zenCompiledGraph'), graphObject),
  ]);
}

export default function zenCompilerPlugin(
  _babel: any,
  options: ZenCompilerOptions = {}
): PluginObj<PluginPass & { zenGraph: GraphState }> {
  const {
    staticAnalysis = true,
    inlineComputed = true,
    warnings = true,
    moduleName = '@sylphx/zen',
  } = options;

  return {
    name: 'zen-compiler',

    visitor: {
      Program: {
        enter(path, state) {
          // Initialize graph state
          state.zenGraph = {
            signals: new Map(),
            computed: new Map(),
            nextId: 0,
          };
        },

        exit(path, state) {
          if (!staticAnalysis) return;

          const { signals, computed } = state.zenGraph;

          // Skip if no zen calls detected
          if (signals.size === 0 && computed.size === 0) return;

          // Perform topological sort
          const executionOrder = topologicalSort(signals, computed);

          // Log analysis results
          if (warnings && process.env.NODE_ENV === 'development') {
            console.log('\n[zen-compiler] ===== Analysis Results =====');
            console.log(`Signals: ${signals.size}`);
            console.log(`Computed: ${computed.size}`);
            console.log('\nDependency Graph:');

            for (const comp of computed.values()) {
              const depsArray = Array.from(comp.deps);
              console.log(`  ${comp.name} → [${depsArray.join(', ')}]`);
            }

            console.log('\nExecution Order:');
            executionOrder.forEach((name, idx) => {
              const isSignal = signals.has(name);
              const type = isSignal ? 'signal' : 'computed';
              console.log(`  ${idx}. ${name} (${type})`);
            });

            console.log('==========================================\n');
          }

          // Generate optimized runtime code
          const graphCode = generateGraphCode(signals, computed, executionOrder);

          // Inject at the top of the program
          if (graphCode) {
            path.node.body.unshift(graphCode);

            if (warnings && process.env.NODE_ENV === 'development') {
              console.log('[zen-compiler] Generated optimized graph code\n');
            }
          }
        },
      },

      // Detect: import { zen, computed } from '@sylphx/zen'
      ImportDeclaration(path, state) {
        if (path.node.source.value !== moduleName) return;

        // Track imported identifiers (zen, computed, etc.)
        // This helps us identify zen() and computed() calls later
      },

      // Detect: const x = zen(value)
      VariableDeclarator(path, state) {
        if (!staticAnalysis) return;

        const { init, id } = path.node;

        // Must be: const name = ...
        if (!t.isIdentifier(id)) return;
        if (!init) return;

        // Check if it's a zen() call
        if (t.isCallExpression(init) && t.isIdentifier(init.callee)) {
          const funcName = init.callee.name;

          if (funcName === 'zen') {
            // Register signal
            const signalInfo: SignalInfo = {
              id: state.zenGraph.nextId++,
              name: id.name,
              node: path.node,
              initialValue: init.arguments[0] as t.Expression,
            };

            state.zenGraph.signals.set(id.name, signalInfo);

            if (warnings && process.env.NODE_ENV === 'development') {
              console.log(`[zen-compiler] Detected signal: ${id.name}`);
            }
          } else if (funcName === 'computed') {
            // Analyze computed function to detect dependencies
            const computedFn = init.arguments[0];

            if (
              !t.isArrowFunctionExpression(computedFn) &&
              !t.isFunctionExpression(computedFn)
            ) {
              if (warnings) {
                console.warn(
                  `[zen-compiler] Warning: computed() with non-function argument at ${id.name}`
                );
              }
              return;
            }

            // TODO: Analyze function body to detect .value accesses
            // This would build the dependency graph

            const computedInfo: ComputedInfo = {
              id: state.zenGraph.nextId++,
              name: id.name,
              node: path.node,
              deps: new Set(),
              fn: computedFn,
            };

            state.zenGraph.computed.set(id.name, computedInfo);

            if (warnings && process.env.NODE_ENV === 'development') {
              console.log(`[zen-compiler] Detected computed: ${id.name}`);
            }
          }
        }
      },

      // Detect: signal.value accesses within computed functions
      MemberExpression(path, state) {
        if (!staticAnalysis) return;

        // Check if this is a .value access
        if (!t.isIdentifier(path.node.property)) return;
        if (path.node.property.name !== 'value') return;

        // Check if the object is a known signal or computed
        if (!t.isIdentifier(path.node.object)) return;

        const signalName = path.node.object.name;

        // Find if we're inside a computed function
        let currentComputed: ComputedInfo | null = null;
        let currentPath = path.parentPath;

        // Traverse up to find the computed we're inside
        while (currentPath) {
          // Check if we're inside a function that's part of a computed() call
          if (
            (t.isArrowFunctionExpression(currentPath.node) ||
              t.isFunctionExpression(currentPath.node)) &&
            currentPath.parentPath &&
            t.isCallExpression(currentPath.parentPath.node)
          ) {
            const callExpr = currentPath.parentPath.node;
            if (
              t.isIdentifier(callExpr.callee) &&
              callExpr.callee.name === 'computed'
            ) {
              // Found the computed call, now find which computed this is
              const varDeclarator = currentPath.parentPath.parentPath;
              if (varDeclarator && t.isVariableDeclarator(varDeclarator.node)) {
                const computedId = varDeclarator.node.id;
                if (t.isIdentifier(computedId)) {
                  currentComputed = state.zenGraph.computed.get(computedId.name) || null;
                  break;
                }
              }
            }
          }
          currentPath = currentPath.parentPath;
        }

        // If we found a computed context and the signal is known
        if (currentComputed) {
          const isKnownSignal = state.zenGraph.signals.has(signalName);
          const isKnownComputed = state.zenGraph.computed.has(signalName);

          if (isKnownSignal || isKnownComputed) {
            currentComputed.deps.add(signalName);

            if (warnings && process.env.NODE_ENV === 'development') {
              console.log(
                `[zen-compiler] Detected dependency: ${currentComputed.name} depends on ${signalName}`
              );
            }
          }
        }
      },
    },
  };
}
