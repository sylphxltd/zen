# Rapid TUI Architecture

## Fragment-Based Reactive Architecture

### Overview

Rapid TUI uses a **fragment-based architecture** for handling reactive content. This design follows the same pattern as React Fragments, providing a clean, first-class solution for dynamic content.

### Node Types

```typescript
type TUINodeType = 'box' | 'text' | 'component' | 'fragment';
```

- **`box`**: Container with flexbox layout
- **`text`**: Text content node
- **`component`**: Component wrapper
- **`fragment`**: Transparent container for reactive children (like React Fragment)

### Fragment Nodes

Fragment nodes are **transparent containers** that group children without adding a wrapper element. They are used for:

1. **Reactive functions**: `{() => expr}` creates a fragment that updates when signals change
2. **JSX Fragments**: `<></>` creates a fragment for grouping
3. **Dynamic children**: Components returning multiple elements

```tsx
// Reactive function creates a fragment node
<Text>Count: {() => $count.value}</Text>

// JSX Fragment
<>
  <Text>Line 1</Text>
  <Text>Line 2</Text>
</>
```

### How Fragments Work

When a reactive function is encountered in JSX:

```typescript
// jsx-runtime.ts
function handleReactiveFunction(parent: TUINode, fn: () => unknown): void {
  const fragment: TUINode = {
    type: 'fragment',
    props: { _reactive: true },
    children: [],
  };

  parent.children.push(fragment);

  effect(() => {
    const value = fn();
    fragment.children = resolveValue(value);
    scheduleNodeUpdate(fragment, '');
  });
}
```

### Rendering Fragments

Renderers handle fragments by simply iterating their children:

```typescript
// Fragment nodes are transparent - just render children
if (node.type === 'fragment') {
  for (const child of node.children) {
    renderChild(child);
  }
}
```

### Layout Calculation

Yoga layout treats fragments as flex containers:

```typescript
if (childNode.type === 'fragment') {
  const fragmentYogaNode = Yoga.Node.create();
  fragmentYogaNode.setFlexGrow(1);
  fragmentYogaNode.setFlexShrink(1);
  // ... process fragment children
}
```

## Design Principles

### 1. First-Class Fragment Type

Fragments are proper `TUINode` instances with `type: 'fragment'`, not special objects with different structures. This provides:

- **Type safety**: All nodes share the same interface
- **Consistency**: Renderers use the same code path for all nodes
- **Debuggability**: Fragment nodes are visible in the tree

### 2. Transparent Containers

Fragment nodes don't render anything themselves - they just group children. This is the same semantics as React Fragments.

### 3. Backwards Compatibility

Legacy markers (`_type: 'marker'`) are still supported but deprecated. They are handled alongside fragment nodes during a transition period.

### 4. Clean Separation

The reactive system creates fragments, and renderers know how to handle them. No special marker-checking code is needed throughout the codebase.

## Migration from Markers

The previous architecture used "markers" - special objects with `_type: 'marker'`. These have been replaced with proper fragment nodes:

| Before (Marker) | After (Fragment) |
|-----------------|------------------|
| `_type: 'marker'` | `type: 'fragment'` |
| Special object | Standard TUINode |
| Scattered handling | Unified handling |
| Type-unsafe | Type-safe |

## File Changes Summary

| File | Changes |
|------|---------|
| `types.ts` | Added `'fragment'` to `TUINodeType` |
| `jsx-runtime.ts` | Create fragment nodes for reactive functions |
| `layout-renderer.ts` | Handle fragment nodes in rendering |
| `yoga-layout.ts` | Handle fragment nodes in layout |
| `render.ts` | Handle fragment nodes in legacy renderer |
| `tree-builder.ts` | Handle fragment nodes in persistent tree |
| `platform-ops.ts` | Deprecation notice for marker creation |

## Benefits

1. **Cleaner Architecture**: No more marker-checking scattered throughout codebase
2. **Type Safety**: Fragments are proper TUINodes
3. **React Compatibility**: Same Fragment pattern developers know
4. **Maintainability**: Single code path for all node types
5. **Debuggability**: Fragment nodes visible in tree inspection
