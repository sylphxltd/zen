# Architecture

## System Overview

Rapid is a **runtime-first reactive framework** supporting multiple platforms (web, native, TUI). The core philosophy: everything must work at runtime without build tools. Compiler is optional DX optimization only.

## Key Components

- **@rapid/signal** (`packages/rapid-signal/`): Core reactivity system (signals, computed, effects)
- **@rapid/runtime** (`packages/rapid-runtime/`): Platform-agnostic runtime (Context, children() helper, lifecycle)
- **@rapid/compiler** (`packages/rapid-compiler/`): **OPTIONAL** JSX transformer for DX (auto-lazy children, signal unwrap)
- **@rapid/web** (`packages/rapid-web/`): Web DOM renderer
- **@rapid/tui** (`packages/rapid-tui/`): Terminal UI renderer
- **@rapid/native** (`packages/rapid-native/`): React Native renderer

## Design Patterns

### Pattern: Runtime-First with Optional Compiler

**Why:** Zero-build requirement. Users can `bun run app.tsx` directly.

**Implementation:**
- Runtime provides `children()` helper for manual lazy evaluation
- Compiler auto-transforms `props.children` to lazy getter
- Both paths work, compiler is just faster

**Example:**
```tsx
// Runtime approach (always works):
function Provider(props) {
  const c = children(() => props.children);
  setupContext();
  return c();
}

// With compiler (auto-optimized):
// Compiler transforms: children: <Child /> 
// Into: get children() { return <Child /> }
```

**Trade-off:** Manual `children()` calls vs automatic. Chose flexibility over convenience.

### Pattern: Universal Lazy Children

**Why:** Context providers need children to evaluate AFTER setup, not before.

**Where:** `@rapid/runtime/src/components/Context.ts`

**Implementation:** 
- `Provider` uses `children(() => props.children)` internally
- Works at runtime without compiler
- Compiler optimization still compatible

**Trade-off:** Small runtime overhead vs zero-config support.

### Pattern: Descriptor Pattern for JSX

**Why:** JSX eager evaluation breaks Context propagation in fine-grained reactive systems. Need to delay component execution until after parent setup.

**Where:** `@rapid/runtime/src/descriptor.ts`, all platform jsx-runtimes

**Problem:**
```tsx
// Standard JSX transformation
jsx(Provider, { children: jsx(Child, {}) })
// Child executes BEFORE Provider → Context not found ❌
```

**Solution - Two-Phase Execution:**

**Phase 1**: jsx() returns descriptors for components (not executing)
```typescript
{ _jsx: true, type: Component, props: {...} }
```

**Phase 2**: Orchestrator executes descriptors in parent-first order
```typescript
executeDescriptor(desc) // Provider → Child (correct order ✅)
```

**Implementation:**
- Components return descriptors (lightweight, transient)
- Elements create real nodes immediately (no descriptor overhead)
- Lazy props getter: `get children() { return executeDescriptor(desc) }`
- Descriptors discarded after execution (zero runtime memory)

**Trade-off:**
- **Cost**: One object allocation per component (~64 bytes, transient)
- **Benefit**: Context propagation works, zero-config, runtime-first
- **Impact**: <1% overhead, no VDOM, no diffing, no re-renders

**vs React**: React uses VDOM + reconciliation (heavy). Rapid uses transient descriptors (minimal).

See: ADR-011

### Pattern: Platform Adapters

**Why:** Single codebase, multiple targets (web/native/TUI).

**Where:** Each platform package exports `jsx()` + `getPlatformOps()`

**Implementation:**
- Components use `getPlatformOps()` for platform-specific operations
- JSX runtime calls appropriate renderer
- Same reactive core, different output

**Trade-off:** Abstraction layer vs code duplication. Enables true cross-platform.

### Pattern: TUI Fine-Grained Rendering

**Why:** TUI has no persistent "DOM" like browsers. Need virtual persistent layer + fine-grained updates.

**Where:** `@rapid/tui/src/element.ts`, `@rapid/tui/src/render.ts`

**Problem:** Terminal rendering differs from web:
- Web: Persistent real DOM, signals → direct updates
- Terminal: Text output only, no persistent elements

**Solution - Persistent Virtual Nodes + Fine-Grained Effects:**

```typescript
// 1. Create persistent virtual node ONCE (like SolidJS creates real DOM)
const element = new TUIElement('text');

// 2. Set up reactive tracking
effect(() => {
  element.setContent(count.value);  // Direct update
  markDirty(element);  // Schedule re-render
});

// 3. Incremental updates
// Only re-render dirty nodes to terminal buffer
```

**Architecture:**
```
Signal change → Effect on node → Direct update → Mark dirty
                                                     ↓
                                           Render dirty nodes only
                                                     ↓
                                           Yoga layout (dirty regions)
                                                     ↓
                                           Buffer diff → Terminal update
```

**Key Differences from React Ink:**
- React Ink: Top-down re-render → VDOM diff → reconcile
- Rapid TUI: Bottom-up effects → direct node updates (no reconciler)
- Same API as web, better performance

**Trade-off:**
- Persistent node memory vs full re-render overhead
- More complex implementation vs simpler full-render
- **Benefit:** Same API across platforms, no TUI-specific patterns

See: ADR-014

## Architecture Principles

1. **Runtime-first:** Must work without build tools
2. **Compiler-optional:** DX optimization only, never required
3. **Platform-agnostic:** Core in @rapid/runtime, renderers separate
4. **Explicit over magic:** `children()` helper over hidden compiler dependency

## Boundaries

**In scope:**
- Reactive primitives (signals, effects)
- Cross-platform component runtime
- Optional compiler for DX
- Web, Native, TUI renderers

**Out of scope:**
- Server-side rendering (may add later)
- Static site generation
- Build-time optimizations beyond JSX transform
