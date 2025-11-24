# @zen/tui Design Document

## Overview

@zen/tui is a **composable** terminal UI framework built on fine-grained reactivity.
Every feature is opt-in through composition - no bloated base components.

## Core Principles

1. **Composable** - Features added through component composition, not prop bloat
2. **Tree-shakable** - Unused features don't increase bundle size
3. **Declarative** - UI is a function of state, no imperative coordination
4. **Single Render API** - One entry point, behavior controlled by components

---

## Architecture

### Render API

```tsx
// ONE render function - that's it
import { render } from '@zen/tui';

// Inline mode (default) - renders at cursor position
render(() => <App />);

// Behavior controlled by COMPONENTS, not render options
render(() => (
  <FullscreenLayout>
    <MouseProvider>
      <App />
    </MouseProvider>
  </FullscreenLayout>
));
```

**NOT this (current anti-pattern):**
```tsx
// ❌ Don't mix concerns in render options
renderToTerminalReactive(() => <App />, {
  fullscreen: true,  // Should be <FullscreenLayout>
  mouse: true,       // Should be <MouseProvider>
});
```

---

## Component Hierarchy

### Layer 1: Primitives (Pure Rendering)

Zero interactivity. Pure layout and styling.

| Component | Purpose |
|-----------|---------|
| `Box` | Flexbox container |
| `Text` | Text with styling |
| `Spacer` | Flexible space |
| `Newline` | Line break |
| `Static` | Non-updating content (logs) |

```tsx
<Box style={{ flexDirection: 'row', gap: 2 }}>
  <Text style={{ color: 'cyan' }}>Hello</Text>
  <Spacer />
  <Text>World</Text>
</Box>
```

### Layer 2: Layout Components

Control screen modes and structure.

| Component | Purpose |
|-----------|---------|
| `FullscreenLayout` | Alternate screen buffer, fills terminal |
| `ScrollBox` | Scrollable container |
| `Divider` | Visual separator |

```tsx
// Fullscreen app
<FullscreenLayout>
  <Box style={{ flex: 1 }}>
    <Text>Full terminal control</Text>
  </Box>
</FullscreenLayout>

// Inline app (default)
<Box>
  <Text>Renders at cursor</Text>
</Box>

// Mixed - inline with scrollable section
<Box>
  <Text>Header</Text>
  <ScrollBox height={10}>
    <Text>Scrollable content...</Text>
  </ScrollBox>
</Box>
```

### Layer 3: Providers (Capabilities)

Enable features through React-style providers.

| Provider | Purpose |
|----------|---------|
| `MouseProvider` | Enable mouse tracking |
| `FocusProvider` | Keyboard focus management |
| `ThemeProvider` | Theming (future) |

```tsx
// Mouse-enabled app
<MouseProvider enabled>
  <Pressable onPress={() => console.log('clicked')}>
    <Box><Text>Click me</Text></Box>
  </Pressable>
</MouseProvider>

// Conditionally enabled
<MouseProvider enabled={() => $settings.value.mouseEnabled}>
  <App />
</MouseProvider>

// Focus management
<FocusProvider>
  <TextInput />
  <Button>Submit</Button>
</FocusProvider>
```

### Layer 4: Interactive Components (Composable Behaviors)

Add interactivity through composition. **Requires MouseProvider ancestor.**

| Component | Purpose |
|-----------|---------|
| `Pressable` | Click/press handling |
| `Draggable` | Drag behavior |
| `Hoverable` | Hover state |
| `Focusable` | Keyboard focus |

```tsx
// Clickable box
<Pressable onPress={() => doSomething()}>
  <Box style={{ borderStyle: 'single' }}>
    <Text>Click me</Text>
  </Box>
</Pressable>

// Draggable window
<Draggable
  onDragStart={() => bringToFront()}
  onDrag={(e) => setPosition(e.x, e.y)}
  onDragEnd={() => snapToGrid()}
>
  <Box style={{ position: 'absolute', left: x, top: y }}>
    <Text>Drag me</Text>
  </Box>
</Draggable>

// Hoverable with style change
<Hoverable>
  {(isHovered) => (
    <Box style={{ backgroundColor: isHovered ? 'blue' : 'gray' }}>
      <Text>Hover me</Text>
    </Box>
  )}
</Hoverable>

// Composed behaviors
<Draggable onDrag={...}>
  <Pressable onPress={...}>
    <Hoverable>
      {(hovered) => (
        <Box style={{ borderColor: hovered ? 'cyan' : 'gray' }}>
          <Text>Interactive!</Text>
        </Box>
      )}
    </Hoverable>
  </Pressable>
</Draggable>
```

### Layer 5: High-Level Components

Pre-composed components for common patterns.

| Component | Purpose |
|-----------|---------|
| `Button` | Styled pressable |
| `TextInput` | Text entry |
| `SelectInput` | Option selection |
| `Modal` | Overlay dialog |
| `Window` | Draggable window (for OS-like UIs) |

```tsx
// Button = Pressable + Box + Text with styling
<Button onPress={() => submit()}>Submit</Button>

// Window = Draggable + Pressable + Box with title bar
<Window
  title="Settings"
  onClose={() => closeWindow()}
  onFocus={() => bringToFront()}
>
  <SettingsContent />
</Window>
```

---

## Event System

### Event Flow

```
Mouse Click
    ↓
MouseProvider (parses raw input)
    ↓
Hit Test (find element at coordinates)
    ↓
Bubble up to find handler (Pressable/Draggable/etc)
    ↓
Call handler with event
    ↓
Handler can call e.stopPropagation()
```

### Event Types

```tsx
interface PressEvent {
  x: number;           // Screen coordinates
  y: number;
  localX: number;      // Relative to element
  localY: number;
  button: 'left' | 'middle' | 'right';
  modifiers: { ctrl?: boolean; shift?: boolean; meta?: boolean };
  stopPropagation(): void;
}

interface DragEvent extends PressEvent {
  deltaX: number;      // Change since drag start
  deltaY: number;
  startX: number;      // Initial position
  startY: number;
}

interface HoverEvent {
  x: number;
  y: number;
  localX: number;
  localY: number;
}
```

### Event Bubbling

Events bubble up through the component tree:

```tsx
<Pressable onPress={() => console.log('outer')}>
  <Box>
    <Pressable onPress={(e) => {
      console.log('inner');
      e.stopPropagation(); // Prevents 'outer' from firing
    }}>
      <Text>Click me</Text>
    </Pressable>
  </Box>
</Pressable>
```

---

## Complete Example: ZenOS

```tsx
import { render } from '@zen/tui';
import { signal, For } from '@zen/tui';

const $windows = signal<WindowState[]>([]);
const $focused = signal<string | null>(null);

function ZenOS() {
  return (
    <FullscreenLayout>
      <MouseProvider>
        <FocusProvider>
          {/* Menu Bar */}
          <Box style={{ backgroundColor: 'gray' }}>
            <Text bold>🍎 ZenOS</Text>
            <Spacer />
            <Text>🔋 98%</Text>
          </Box>

          <Divider />

          {/* Desktop */}
          <Box style={{ flex: 1, flexDirection: 'row' }}>
            {/* Icons */}
            <Box style={{ width: 12 }}>
              <DesktopIcon icon="🖥️" label="Terminal" onOpen={() => openWindow('terminal')} />
              <DesktopIcon icon="📁" label="Files" onOpen={() => openWindow('files')} />
            </Box>

            {/* Windows Area */}
            <Box style={{ flex: 1, position: 'relative' }}>
              <For each={() => $windows.value}>
                {(win) => (
                  <Window
                    key={win.id}
                    title={win.title}
                    x={win.x}
                    y={win.y}
                    width={win.width}
                    height={win.height}
                    focused={$focused.value === win.id}
                    onFocus={() => focusWindow(win.id)}
                    onMove={(x, y) => moveWindow(win.id, x, y)}
                    onClose={() => closeWindow(win.id)}
                  >
                    {getAppContent(win.app)}
                  </Window>
                )}
              </For>
            </Box>
          </Box>

          {/* Taskbar */}
          <Taskbar windows={$windows} focused={$focused} />
        </FocusProvider>
      </MouseProvider>
    </FullscreenLayout>
  );
}

// Composable desktop icon
function DesktopIcon({ icon, label, onOpen }) {
  return (
    <Pressable onPress={onOpen}>
      <Hoverable>
        {(hovered) => (
          <Box style={{
            alignItems: 'center',
            backgroundColor: hovered ? 'blue' : undefined
          }}>
            <Text>{icon}</Text>
            <Text dim>{label}</Text>
          </Box>
        )}
      </Hoverable>
    </Pressable>
  );
}

// Composable window
function Window({ title, x, y, width, height, focused, onFocus, onMove, onClose, children }) {
  return (
    <Draggable
      onDragStart={onFocus}
      onDrag={(e) => onMove(e.x - e.startX + x, e.y - e.startY + y)}
    >
      <Pressable onPress={onFocus}>
        <Box style={{
          position: 'absolute',
          left: x,
          top: y,
          width,
          height,
          borderStyle: 'single',
          borderColor: focused ? 'cyan' : 'gray',
          flexDirection: 'column',
        }}>
          {/* Title Bar */}
          <Box style={{ backgroundColor: focused ? 'blue' : 'gray' }}>
            <Text bold>{title}</Text>
            <Spacer />
            <Pressable onPress={(e) => { e.stopPropagation(); onClose(); }}>
              <Text color="red">✕</Text>
            </Pressable>
          </Box>

          {/* Content */}
          <Box style={{ flex: 1, padding: 1 }}>
            {children}
          </Box>
        </Box>
      </Pressable>
    </Draggable>
  );
}

// Start app
render(() => <ZenOS />);
```

---

## Migration Path

### Phase 1: Unified Render API
- [x] Single `render()` function
- [ ] Remove `renderToTerminal`, `renderToTerminalReactive`
- [ ] Remove render options (`fullscreen`, `mouse`)

### Phase 2: Layout Components
- [ ] `FullscreenLayout` - alternate screen buffer
- [ ] Update `ScrollBox` for new architecture

### Phase 3: Providers
- [ ] `MouseProvider` - mouse tracking
- [ ] `FocusProvider` - keyboard focus
- [ ] Provider context system

### Phase 4: Interactive Components
- [ ] `Pressable` - click handling
- [ ] `Draggable` - drag behavior
- [ ] `Hoverable` - hover state
- [ ] Event bubbling with `stopPropagation`

### Phase 5: High-Level Components
- [ ] `Window` - draggable window
- [ ] Update `Button`, `TextInput`, etc.

### Phase 6: Cleanup
- [ ] Remove `onClick` from `Box` (use `Pressable`)
- [ ] Remove `useMouseClick`, `useMouseDrag` (use components)
- [ ] Update all examples

---

## API Reference

### render()

```tsx
function render(app: () => JSX.Element): () => void;
```

Single entry point. Returns cleanup function.

### FullscreenLayout

```tsx
<FullscreenLayout>
  {children}
</FullscreenLayout>
```

Enters alternate screen buffer, hides cursor, fills terminal.

### MouseProvider

```tsx
<MouseProvider enabled={boolean | (() => boolean)}>
  {children}
</MouseProvider>
```

Enables mouse tracking. Required for Pressable/Draggable/Hoverable.

### Pressable

```tsx
<Pressable
  onPress={(e: PressEvent) => void}
  onPressIn={(e: PressEvent) => void}
  onPressOut={(e: PressEvent) => void}
  disabled={boolean}
>
  {children}
</Pressable>
```

### Draggable

```tsx
<Draggable
  onDragStart={(e: DragEvent) => void}
  onDrag={(e: DragEvent) => void}
  onDragEnd={(e: DragEvent) => void}
  disabled={boolean}
>
  {children}
</Draggable>
```

### Hoverable

```tsx
<Hoverable
  onHoverIn={(e: HoverEvent) => void}
  onHoverOut={(e: HoverEvent) => void}
>
  {(isHovered: boolean) => children}
</Hoverable>
```

---

## File Structure

```
packages/zen-tui/src/
├── core/
│   ├── render.ts          # Single render() API
│   ├── types.ts
│   └── ...
├── primitives/
│   ├── Box.tsx            # Pure layout (NO onClick)
│   ├── Text.tsx
│   ├── Spacer.tsx
│   └── Newline.tsx
├── layout/
│   ├── FullscreenLayout.tsx
│   ├── ScrollBox.tsx
│   └── Divider.tsx
├── providers/
│   ├── MouseProvider.tsx
│   ├── FocusProvider.tsx
│   └── context.ts
├── interactive/
│   ├── Pressable.tsx
│   ├── Draggable.tsx
│   └── Hoverable.tsx
├── components/
│   ├── Button.tsx         # = Pressable + Box + Text
│   ├── TextInput.tsx
│   ├── Window.tsx         # = Draggable + Pressable + Box
│   └── ...
└── index.ts
```

---

## Design Decisions

### Why not onClick on Box?

1. **Separation of concerns** - Box is for layout, Pressable is for interaction
2. **Explicit intent** - `<Pressable>` clearly shows this element is interactive
3. **Tree-shakable** - Apps without mouse don't bundle mouse code
4. **Composable** - Can combine Pressable + Draggable + Hoverable

### Why Providers instead of render options?

1. **Composable** - Can have different settings in different subtrees
2. **Reactive** - Can toggle features with signals
3. **Standard pattern** - React developers expect providers
4. **Flexible** - Mixed modes (some areas fullscreen, some inline)

### Why single render() API?

1. **Simple** - One function to learn
2. **Flexible** - Behavior controlled by components
3. **Consistent** - Same API for all use cases
