/**
 * TUI Tree Builder - Build Persistent Virtual Tree
 *
 * Converts TUINode descriptors into persistent TUIElement instances.
 * Similar to React's fiber reconciliation but simpler (no reconciler needed).
 */

import { executeDescriptor, isDescriptor } from '@zen/runtime';
import { createRoot } from '@zen/signal';
import { TUIElement, type TUITextNode, createElement, createTextNode } from './element.js';
import { scheduleNodeUpdate } from '../core/render-context.js';
import type { TUINode } from '../core/types.js';

/**
 * Build persistent tree from TUI node descriptor
 *
 * Creates TUIElement instances that persist across updates.
 * Effects track signal dependencies and update elements directly.
 */
export function buildPersistentTree(
  node: TUINode | string | unknown,
): TUIElement | TUITextNode | null {
  // Handle string (text node)
  if (typeof node === 'string') {
    return createTextNode(node);
  }

  // Handle null/undefined
  if (!node || typeof node !== 'object') {
    return null;
  }

  // Handle descriptor (component) - execute it first
  if (isDescriptor(node)) {
    const executed = executeDescriptor(node);
    return buildPersistentTree(executed);
  }

  // Handle fragment node (reactive container)
  if ('type' in node && (node as any).type === 'fragment') {
    const fragmentNode = node as TUINode;

    // Create a persistent fragment element
    const fragment = new TUIElement('fragment', {}, {});

    // Function to rebuild fragment children
    const rebuildChildren = () => {
      // Clear existing children
      fragment.children = [];

      // Rebuild from fragmentNode.children
      if (fragmentNode.children && fragmentNode.children.length > 0) {
        for (const child of fragmentNode.children) {
          const childElement = buildPersistentTree(child);
          if (childElement) {
            fragment.appendChild(childElement);
          }
        }
      }

      // Mark fragment as dirty to trigger re-render
      fragment.markDirty();
    };

    // Build initial children
    rebuildChildren();

    // Hook into fragment updates: when jsx-runtime effect updates fragment.children,
    // it will call this callback to rebuild our TUIElement tree
    (fragmentNode as any).onUpdate = rebuildChildren;

    return fragment;
  }

  // Handle TUINode (element)
  if ('type' in node && typeof node.type === 'string') {
    const tuiNode = node as TUINode;

    // Extract props and style
    const props = { ...tuiNode.props };
    const style = typeof tuiNode.style === 'function' ? tuiNode.style() : tuiNode.style || {};

    // Create persistent element
    const element = createElement(tuiNode.type, props, style);

    // Process children
    if (tuiNode.children) {
      const childrenArray = Array.isArray(tuiNode.children) ? tuiNode.children : [tuiNode.children];

      for (const child of childrenArray) {
        // Handle function children (reactive)
        if (typeof child === 'function') {
          // Reactive children function
          // Set up effect to rebuild children when signals change
          const childrenContainer = new TUIElement('fragment', {}, {});
          element.appendChild(childrenContainer);

          // Track reactive children
          const eff = createRoot(() => {
            // When this effect runs, rebuild children
            const result = child();
            const resultArray = Array.isArray(result) ? result : [result];

            // Clear existing children
            childrenContainer.children = [];

            // Build new children
            for (const childNode of resultArray) {
              const childElement = buildPersistentTree(childNode);
              if (childElement) {
                childrenContainer.appendChild(childElement);
              }
            }

            // Notify renderer that tree has changed
            scheduleNodeUpdate(childrenContainer, '');
          });

          element.effects.add(eff as any);
        } else {
          // Static child
          const childElement = buildPersistentTree(child);
          if (childElement) {
            element.appendChild(childElement);
          }
        }
      }
    }

    return element;
  }

  // Unknown node type
  return null;
}

/**
 * Mount tree - creates persistent tree and sets up root
 */
export function mountTree(rootNode: TUINode | (() => TUINode)): TUIElement | null {
  // If function, execute it to get root node
  const node = typeof rootNode === 'function' ? rootNode() : rootNode;

  // Build persistent tree
  const root = createRoot(() => {
    return buildPersistentTree(node);
  });

  return root as TUIElement | null;
}

/**
 * Update tree - updates existing persistent tree with new data
 *
 * Note: With fine-grained reactivity, updates happen automatically via effects.
 * This function is mainly for initial setup or forcing full re-build.
 */
export function updateTree(existingElement: TUIElement, newNode: TUINode): void {
  // Extract new props and style
  const newProps = { ...newNode.props };
  const newStyle = typeof newNode.style === 'function' ? newNode.style() : newNode.style || {};

  // Update props (effects will handle reactive ones)
  for (const [key, value] of Object.entries(newProps)) {
    if (typeof value !== 'function') {
      existingElement.setProp(key, value);
    }
  }

  // Update style
  existingElement.setStyle(newStyle);

  // For now, don't update children (effects handle that)
  // Future: Implement key-based child reconciliation if needed
}
