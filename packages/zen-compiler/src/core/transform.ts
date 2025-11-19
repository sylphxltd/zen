/**
 * Core JSX transformer for Zen
 *
 * Transforms:
 * 1. Auto-lazy children: <Show><Child /></Show> → <Show>{() => <Child />}</Show>
 * 2. Signal auto-unwrap: {signal} → {() => signal.value}
 */

import * as babel from '@babel/core';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { CompilerOptions } from './types.js';

const DEFAULT_LAZY_COMPONENTS = [
  'Show',
  'For',
  'Switch',
  'Match',
  'Suspense',
  'ErrorBoundary',
];

export function transformZenJSX(
  code: string,
  filename: string,
  options: CompilerOptions = {},
): { code: string; map: any } | null {
  const {
    autoLazy = true,
    autoUnwrap = true,
    lazyComponents = DEFAULT_LAZY_COMPONENTS,
  } = options;

  const result = babel.transformSync(code, {
    filename,
    sourceMaps: true,
    plugins: [
      '@babel/plugin-syntax-jsx',
      ['@babel/plugin-syntax-typescript', { isTSX: true }],
      // Custom transform plugin
      (): babel.PluginObj => ({
        name: 'zen-jsx-transform',
        visitor: {
          // Transform JSX elements with lazy children
          JSXElement(path: NodePath<t.JSXElement>) {
            if (!autoLazy) return;

            const openingElement = path.node.openingElement;
            const elementName = getJSXElementName(openingElement.name);

            // Check if this component needs lazy children
            if (!elementName || !lazyComponents.includes(elementName)) {
              return;
            }

            // Transform children to be lazy
            const children = path.node.children;
            if (children.length === 0) return;

            // Wrap children in arrow function
            path.node.children = [
              t.jsxExpressionContainer(
                t.arrowFunctionExpression(
                  [],
                  t.jsxFragment(
                    t.jsxOpeningFragment(),
                    t.jsxClosingFragment(),
                    children,
                  ),
                ),
              ),
            ];
          },

          // Transform signal expressions to auto-unwrap
          JSXExpressionContainer(path: NodePath<t.JSXExpressionContainer>) {
            if (!autoUnwrap) return;

            const expression = path.node.expression;

            // Skip if already a function or not an identifier/member expression
            if (
              t.isArrowFunctionExpression(expression) ||
              t.isFunctionExpression(expression) ||
              t.isJSXEmptyExpression(expression)
            ) {
              return;
            }

            // Check if this looks like a signal access
            // Heuristic: identifier or member expression ending in .value
            const isSignalAccess =
              t.isIdentifier(expression) ||
              (t.isMemberExpression(expression) &&
                t.isIdentifier(expression.property) &&
                expression.property.name === 'value');

            if (!isSignalAccess) return;

            // Wrap in arrow function for reactivity
            path.node.expression = t.arrowFunctionExpression([], expression);
          },
        },
      }),
    ],
  });

  if (!result || !result.code) {
    return null;
  }

  return {
    code: result.code,
    map: result.map,
  };
}

function getJSXElementName(name: t.JSXElement['openingElement']['name']): string | null {
  if (t.isJSXIdentifier(name)) {
    return name.name;
  }
  if (t.isJSXMemberExpression(name)) {
    // Handle namespaced components like <Foo.Bar>
    return null; // Skip for now
  }
  return null;
}
