# @rapid/tui

> Terminal UI renderer for Rapid - Build beautiful CLI applications with reactive signals

**@rapid/tui** is a modern, high-performance terminal UI library that combines the simplicity of [React Ink](https://github.com/vadimdemedes/ink) with the power of fine-grained reactivity.

## Features

✨ **React Ink Compatible** - Drop-in replacement for most Ink components
⚡ **Fine-Grained Reactivity** - Powered by `@rapid/signal` for precise updates
🎨 **Rich Component Library** - 40+ production-ready components
🖱️ **Mouse Support** - Click, drag, hover, and scroll events
📱 **Responsive Layouts** - Flexbox-based layout with Yoga
🎯 **TypeScript First** - Fully typed API with excellent IDE support
🌐 **Terminal Compatibility** - Automatic emoji width detection for consistent rendering across terminals

## Installation

```bash
npm install @rapid/tui @rapid/signal
# or
bun add @rapid/tui @rapid/signal
```

## Quick Start

```tsx
import { render, Box, Text, signal } from '@rapid/tui';

function App() {
  const count = signal(0);

  setInterval(() => count.value++, 1000);

  return (
    <Box flexDirection="column" padding={2} borderStyle="round">
      <Text color="cyan" bold>Counter Example</Text>
      <Text>Count: {() => count.value}</Text>
    </Box>
  );
}

render(App);
```

## Component Library

### Primitives

Basic building blocks for TUI applications.

| Component | Description |
|-----------|-------------|
| **Box** | Flexbox container with borders, padding, margins |
| **Text** | Styled text with colors, bold, italic, underline |
| **Static** | Content that persists across re-renders |
| **Newline** | Line break component |
| **Spacer** | Flexible spacing element |

### Layout

Components for structuring your application.

| Component | Description |
|-----------|-------------|
| **FullscreenLayout** | Full-screen mode with alternate buffer |
| **ScrollBox** | Scrollable container with keyboard/mouse support |
| **Scrollbar** | Visual scroll position indicator |
| **Divider** | Horizontal line separator |

### Input

Form controls and user input.

| Component | Description |
|-----------|-------------|
| **TextInput** | Text field with validation, suggestions, password mode |
| **SelectInput** | Dropdown selection |
| **MultiSelect** | Multi-selection list with checkboxes |
| **Checkbox** | Single checkbox component |
| **Radio** | Radio button group |
| **Button** | Interactive button with variants (primary, secondary, danger) |
| **Confirmation** | Yes/No confirmation dialog |

### Feedback

User feedback and status indicators.

| Component | Description |
|-----------|-------------|
| **Spinner** | Loading spinner (dots, line, arc, arrow, pulse) |
| **ProgressBar** | Progress indicator with percentage |
| **StatusMessage** | Status with icon (success, error, warning, info) |
| **Badge** | Colored status badge |
| **Toast** | Toast notification system |

### Data Display

Components for displaying structured data.

| Component | Description |
|-----------|-------------|
| **Table** | Tabular data with borders and alignment |
| **TreeView** | Hierarchical tree structure with expand/collapse |
| **Markdown** | Markdown rendering in terminal |

### Navigation

Routing and navigation components.

| Component | Description |
|-----------|-------------|
| **Router** | Client-side routing for TUI apps |
| **RouterLink** | Navigation link component |
| **Link** | Terminal hyperlink (OSC 8) |
| **Tabs** | Tab navigation UI |

### Overlay

Modal dialogs and overlays.

| Component | Description |
|-----------|-------------|
| **Modal** | Modal dialog with backdrop |
| **ConfirmDialog** | Confirmation modal |
| **AlertDialog** | Alert modal |
| **CommandPalette** | Fuzzy-search command palette (like VS Code) |

### Chrome

Application frame components.

| Component | Description |
|-----------|-------------|
| **StatusBar** | Bottom status bar with shortcuts and mode indicator |

### Interactive

Composable interaction behaviors.

| Component | Description |
|-----------|-------------|
| **Pressable** | Click/press event handling |
| **Draggable** | Drag event handling |
| **Hoverable** | Hover state tracking |

### Providers

Capability providers for advanced features.

| Component | Description |
|-----------|-------------|
| **MouseProvider** | Enable mouse tracking for entire app |
| **FocusProvider** | Manage focus navigation |

## Hooks

React-like hooks for terminal functionality.

| Hook | Description |
|------|-------------|
| **useInput** | Capture keyboard input |
| **useMouse** | Mouse event handling |
| **useMouseClick** | Click event handling |
| **useMouseScroll** | Scroll event handling |
| **useMouseDrag** | Drag event handling |
| **useApp** | App lifecycle control (exit, cleanup) |
| **useFocus** | Focus management for component |
| **useFocusManager** | Focus navigation (next, previous, by ID) |
| **useTerminalSize** | Terminal dimensions (columns, rows) |
| **useTerminalResize** | Resize event handling |
| **useStdin** | stdin stream access |
| **useStdout** | stdout stream access |
| **useStderr** | stderr stream access |

## Terminal Compatibility

### Automatic Emoji Width Detection

Rapid TUI automatically detects how your terminal renders emoji with **Variation Selector-16 (VS-16)**. This ensures consistent layout across different terminals.

**Why this matters:**
- Emoji like 🖥️ (U+1F5A5 + U+FE0F) render as **width 1** in macOS Terminal.app but **width 2** in iTerm2
- String width libraries may not match actual terminal rendering
- Mismatched widths cause borders and layouts to shift

**How it works:**
1. Detects terminal type from environment variables (`TERM_PROGRAM`)
2. Uses terminal-specific profiles for known terminals
3. Falls back to conservative default (VS-16 not supported)
4. Caches detection result for performance

**Supported terminals:**

✅ **VS-16 Supported** (emoji with VS-16 rendered as wide):
- iTerm2
- WezTerm
- kitty
- Konsole
- Windows Terminal

❌ **VS-16 Ignored** (emoji with VS-16 stay narrow):
- macOS Terminal.app
- VS Code integrated terminal
- Most other terminals

**Override detection:**

```bash
# Force VS-16 support
TERM_PROGRAM=iTerm.app node app.js

# Force VS-16 ignored
TERM_PROGRAM=Apple_Terminal node app.js
```

**Implementation:**

```typescript
import { terminalWidth } from '@rapid/tui';

// Automatically handles VS-16 based on terminal detection
const width = terminalWidth('🖥️');  // Returns 1 for Terminal.app, may vary for other terminals
```

For more details, see:
- [`emoji-width-detector.ts`](./src/utils/emoji-width-detector.ts) - Terminal detection logic
- [`terminal-width.ts`](./src/utils/terminal-width.ts) - Width calculation with auto-detection

## React Ink Migration

Rapid TUI is designed for easy migration from React Ink. Most components have identical APIs.

### Key Differences

| Feature | React Ink | Rapid TUI |
|---------|-----------|---------|
| **State** | `useState`, `useReducer` | `signal`, `computed` |
| **Reactivity** | Virtual DOM diffing | Fine-grained signals |
| **JSX** | React JSX | Custom JSX (optional) |
| **Runtime** | React reconciler | Direct signal updates |
| **Performance** | Full tree diffing | Only changed nodes update |

### Migration Example

**Before (React Ink):**
```tsx
import React, { useState } from 'react';
import { render, Box, Text } from 'ink';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Box>
      <Text>Count: {count}</Text>
    </Box>
  );
}

render(<App />);
```

**After (Rapid TUI):**
```tsx
import { signal } from '@rapid/signal';
import { render, Box, Text } from '@rapid/tui';

function App() {
  const count = signal(0);

  return (
    <Box>
      <Text>Count: {() => count.value}</Text>
    </Box>
  );
}

render(App);
```

See [INK-COMPATIBILITY.md](./INK-COMPATIBILITY.md) for full migration guide.

## Rendering Modes

Rapid TUI supports two rendering modes, each optimized for different use cases:

### Inline Mode (Default)

Console applications that render within the normal terminal flow. Content can be **arbitrarily long** and the terminal naturally scrolls.

```tsx
import { render, Box, Text } from '@rapid/tui';

// Inline mode - no wrapper needed
// Content can be any height, terminal scrolls naturally
await render(() => (
  <Box flexDirection="column">
    <Text>Question 1: ...</Text>
    <Text>Question 2: ...</Text>
    {/* Can have 100+ lines - no problem! */}
  </Box>
));
```

**Use cases:**
- CLI wizards and questionnaires
- Installation progress (like `npm install`)
- Interactive prompts
- Log viewers

**Characteristics:**
- ✅ Unlimited content height
- ✅ Natural terminal scrolling
- ✅ Content persists in scrollback
- ✅ Mouse support available

### Fullscreen Mode

Applications that take over the entire terminal using the alternate screen buffer.

```tsx
import { render, FullscreenLayout, Box, Text } from '@rapid/tui';

// Fullscreen mode - wrap with FullscreenLayout
await render(() => (
  <FullscreenLayout>
    <Box flexDirection="column" height="100%">
      <Text>Dashboard</Text>
    </Box>
  </FullscreenLayout>
));
```

**Use cases:**
- Dashboards and monitoring tools
- Text editors (like vim)
- File browsers
- Full-screen games

**Characteristics:**
- ✅ Fixed to terminal dimensions
- ✅ Fine-grained updates (efficient)
- ✅ Preserves main screen on exit
- ✅ Mouse support available

### Mixed Mode

Applications can switch between modes at runtime:

```tsx
import { render, FullscreenLayout, Router, Route } from '@rapid/tui';

await render(() => (
  <Router>
    {/* Inline pages */}
    <Route path="/" component={InlineHome} />
    <Route path="/survey" component={Questionnaire} />

    {/* Fullscreen pages - just wrap with FullscreenLayout */}
    <Route path="/dashboard" component={() => (
      <FullscreenLayout>
        <Dashboard />
      </FullscreenLayout>
    )} />
  </Router>
));
```

When navigating from inline to fullscreen:
1. Alternate screen buffer activates
2. Main screen content is preserved
3. On return, main screen is restored

See [ADR-001](./docs/adr/001-dual-renderer-architecture.md) for technical details.

## Advanced Features

### Mouse Support

Enable mouse tracking for clicks, drags, and scroll events.

```tsx
import { MouseProvider, Pressable, Box, Text } from '@rapid/tui';

function App() {
  return (
    <MouseProvider>
      <Pressable onPress={(x, y) => console.log(`Clicked at ${x}, ${y}`)}>
        <Box borderStyle="round" padding={1}>
          <Text>Click me!</Text>
        </Box>
      </Pressable>
    </MouseProvider>
  );
}
```

### Scrolling

Scroll large content with keyboard and mouse.

```tsx
import { ScrollBox, Text } from '@rapid/tui';

function App() {
  const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);

  return (
    <ScrollBox height={20} showScrollbar>
      {items.map(item => (
        <Text key={item}>{item}</Text>
      ))}
    </ScrollBox>
  );
}
```

See [ADVANCED-FEATURES.md](./ADVANCED-FEATURES.md) for more details.

## Architecture

Rapid TUI uses a **dual renderer architecture** with **fragment-based reactivity**:

1. **Dual Renderers**: Separate `InlineRenderer` and `FullscreenRenderer` optimized for each mode
2. **Fragment Nodes**: Transparent containers for reactive content (like React Fragments)
3. **Fine-Grained Reactivity**: Only dirty nodes update on signal changes
4. **Incremental Layout**: Yoga layout calculated incrementally
5. **Persistent Tree**: No virtual DOM, direct node updates

See:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Fragment-based reactivity
- [ADR-001](./docs/adr/001-dual-renderer-architecture.md) - Dual renderer design

## Examples

Check the [examples directory](../../examples/tui-demo) for working examples:

- **Basic**: Counter, Hello World
- **Input**: TextInput, MultiSelect, Confirmation
- **Layout**: Tabs, ScrollBox, Router
- **Advanced**: Command Palette, TreeView, Markdown renderer
- **Full Apps**: Dashboard, File Browser, Chat Interface

## Testing

All components are thoroughly tested:

```bash
# Run all tests
bun test packages/rapid-tui/

# Test coverage: 347 tests across 22 files
# All core components tested
# All hooks tested
# All interactive components tested
```

## Performance

- **Fine-grained updates**: Only changed nodes re-render
- **Incremental layout**: Only affected layout regions recalculated
- **Signal-based**: No virtual DOM overhead
- **Cached detection**: Terminal capabilities detected once

## Resources

- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **React Ink Compatibility**: [INK-COMPATIBILITY.md](./INK-COMPATIBILITY.md)
- **Advanced Features**: [ADVANCED-FEATURES.md](./ADVANCED-FEATURES.md)
- **Rapid Signal**: [@rapid/signal](../rapid-signal)
- **Examples**: [examples/tui-demo](../../examples/tui-demo)

## License

MIT

---

**Built with ❤️ by the Rapid Team**
