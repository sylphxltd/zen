# ADR-001: Web vs TUI Architecture Differences

## Status
Accepted

## Context
The Rapid framework provides two rendering targets: `@rapid/web` for browser DOM and `@rapid/tui` for terminal UI. While they share the same reactive runtime (`@rapid/runtime`, `@rapid/signal`), their rendering approaches differ significantly due to platform constraints.

## Decision

### Shared Architecture
Both renderers share:
- **Reactive primitives**: Signals, effects, computed values from `@rapid/signal`
- **Control flow components**: `For`, `Show`, `Switch`, `Match`, `ErrorBoundary`, `Suspense` from `@rapid/runtime`
- **Context system**: `createContext`, `useContext` for state propagation
- **Lifecycle hooks**: `onMount`, `onCleanup` for component lifecycle
- **Descriptor pattern**: Deferred component execution for correct context propagation (ADR-011)

### Web-Specific (`@rapid/web`)
1. **Direct DOM Manipulation**: Creates real DOM nodes via `document.createElement()`
2. **SSR Support**: Server-side rendering with `jsx-runtime-server.ts` generating HTML strings
3. **Hydration**: Client reuses server-rendered DOM nodes, aligning cursors via marker comments
4. **Event Delegation**: Native DOM event listeners with automatic cleanup
5. **Marker Comments**: Uses `<!--signal-->` and `<!--reactive-->` comments to track reactive content positions

### TUI-Specific (`@rapid/tui`)
1. **Virtual Node Tree**: Creates `TUINode` objects describing the UI structure
2. **Layout Engine**: Yoga-based flexbox layout computation
3. **Differential Rendering**: Computes minimal terminal escape sequences for updates
4. **Input Handling**: Keyboard/mouse input via `stdin` with custom parsing
5. **Focus Management**: Tab navigation system for keyboard-only interaction
6. **Static Content**: Special handling for content that shouldn't be cleared on re-render

### Key Differences

| Aspect | @rapid/web | @rapid/tui |
|--------|----------|----------|
| Node type | DOM `Element` | `TUINode` object |
| Rendering | Immediate DOM mutation | Virtual tree → layout → diff → escape sequences |
| SSR | HTML string generation | N/A (terminal is interactive) |
| Hydration | DOM node reuse with markers | N/A |
| Events | Native DOM events | stdin parsing + dispatch |
| Layout | Browser's CSS engine | Yoga flexbox |
| Updates | Fine-grained DOM patches | Full re-render with diff |

## Consequences

### Positive
- Shared reactive model reduces learning curve
- Code sharing via `@rapid/runtime` components
- Platform-optimized rendering for each target
- SSR/hydration enables fast initial page loads on web

### Negative
- Two JSX runtimes to maintain
- Platform-specific components can't be shared (e.g., `<input>` vs `<TextInput>`)
- Testing requires different setups (jsdom vs terminal mocks)

## Related ADRs
- ADR-011: Descriptor Pattern for Context Propagation
- ADR-014: Fine-grained Reactivity
