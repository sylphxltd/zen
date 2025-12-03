/**
 * @rapid/babel-plugin-jsx
 *
 * Babel plugin that transforms JSX children into lazy getters for proper
 * reactive evaluation order.
 *
 * Solves the "eager JSX evaluation" problem where children evaluate before
 * parent components run, breaking Context.Provider and similar patterns.
 *
 * Transform:
 * ```jsx
 * <Provider value={x}>
 *   <Child />
 * </Provider>
 * ```
 *
 * Into (conceptually):
 * ```js
 * jsx(Provider, {
 *   value: x,
 *   get children() { return jsx(Child, {}) }
 * })
 * ```
 */

import type * as BabelCore from '@babel/core';
import type * as t from '@babel/types';

export default function zenJsxPlugin(babel: typeof BabelCore): BabelCore.PluginObj {
  const { types: t } = babel;

  return {
    name: 'rapid-jsx-lazy-children',
    visitor: {
      JSXElement(path) {
        // Get the opening element
        const openingElement = path.node.openingElement;

        // Skip if no children
        if (path.node.children.length === 0) {
          return;
        }

        // Check if this is a component (starts with uppercase or member expression)
        const name = openingElement.name;
        let isComponent = false;

        if (t.isJSXIdentifier(name)) {
          // Check if starts with uppercase (React convention for components)
          isComponent = /^[A-Z]/.test(name.name);
        } else if (t.isJSXMemberExpression(name)) {
          // Member expressions like Context.Provider are components
          isComponent = true;
        }

        // Only transform component children (not DOM elements)
        if (!isComponent) {
          return;
        }

        // This transform is handled at the JSX transform level by the JSX runtime
        // We need to modify how the JSX pragma handles children
        // For now, mark this for runtime handling by adding a special prop

        // Actually, we need a different approach:
        // Transform at the JSX() call level, not JSX syntax level
      },

      // Transform the actual jsx() calls
      CallExpression(path) {
        const callee = path.node.callee;

        // Check if this is a jsx/jsxs/jsxDEV call
        if (!t.isIdentifier(callee)) {
          return;
        }

        if (!['jsx', 'jsxs', 'jsxDEV', '_jsx', '_jsxs'].includes(callee.name)) {
          return;
        }

        // jsx(type, props)
        const [_type, propsArg] = path.node.arguments;

        if (!propsArg || !t.isObjectExpression(propsArg)) {
          return;
        }

        // Find the children property
        const childrenPropIndex = propsArg.properties.findIndex(
          (prop) =>
            t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'children',
        );

        if (childrenPropIndex === -1) {
          return;
        }

        const childrenProp = propsArg.properties[childrenPropIndex];

        if (!t.isObjectProperty(childrenProp)) {
          return;
        }

        // Skip if children is already a function
        if (
          t.isArrowFunctionExpression(childrenProp.value) ||
          t.isFunctionExpression(childrenProp.value)
        ) {
          return;
        }

        // Transform: children: value
        // Into: get children() { return value }
        const getter = t.objectMethod(
          'get',
          t.identifier('children'),
          [],
          t.blockStatement([t.returnStatement(childrenProp.value as t.Expression)]),
        );

        // Replace the property with the getter
        propsArg.properties[childrenPropIndex] = getter;
      },
    },
  };
}
