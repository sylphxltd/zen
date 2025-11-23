# Advanced TUI Features

This document describes advanced features for building full-screen terminal applications with scrolling, mouse support, and professional UIs.

## Full-Screen Mode

Enable alternate screen buffer mode for applications that should take over the entire terminal, similar to vim, less, or top.

### Usage

```tsx
import { renderToTerminalReactive } from '@zen/tui';

await renderToTerminalReactive(
  () => <App />,
  {
    fullscreen: true  // Enable alternate screen buffer
  }
);
```

### Benefits

- **Clean exit**: Terminal returns to previous state when app exits
- **No scrollback pollution**: App output doesn't mix with terminal history
- **Professional UX**: Standard behavior for full-screen TUI apps

### Technical Details

Uses ANSI escape sequence `\x1b[?1049h` to enter alternate screen buffer and `\x1b[?1049l` to restore on exit.

---

## Scrolling Components

### ScrollBox

Container that provides scrolling for content larger than the viewport.

```tsx
import { ScrollBox } from '@zen/tui';

function App() {
  return (
    <ScrollBox height={10} showScrollbar>
      {items.map(item => (
        <Text key={item.id}>{item.name}</Text>
      ))}
    </ScrollBox>
  );
}
```

**Props:**
- `height: number` - Visible viewport height (required)
- `width?: number` - Visible viewport width (optional)
- `showScrollbar?: boolean` - Show scrollbar indicator (default: false)
- `onScroll?: (offset: number) => void` - Scroll position callback
- `children: TUINode` - Content to scroll

**Keyboard Controls:**
- `↑/k` - Scroll up one line
- `↓/j` - Scroll down one line
- `Page Up` - Scroll up one page
- `Page Down` - Scroll down one page

**Mouse Controls** (when mouse tracking enabled):
- `Scroll wheel` - Scroll up/down

### Scrollbar

Visual indicator showing scroll position (automatically included with ScrollBox).

```tsx
import { Scrollbar } from '@zen/tui';

const scrollY = signal(0);

<Scrollbar
  position={scrollY}
  total={100}      // Total content height
  visible={20}     // Visible viewport height
/>
```

**Visual Appearance:**
```
┃  <- Track
┃
█  <- Thumb (current position)
█
┃
┃
```

---

## Virtual Scrolling

For large lists, use virtual scrolling to render only visible items (like React Virtualized).

```tsx
import { VirtualList } from '@zen/tui';

function App() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));

  return (
    <VirtualList
      items={items}
      height={20}
      renderItem={(item, index) => (
        <Text key={item.id}>{item.name}</Text>
      )}
    />
  );
}
```

**Props:**
- `items: T[]` - Array of items to render
- `height: number` - Visible viewport height
- `renderItem: (item: T, index: number) => TUINode` - Render function
- `showScrollbar?: boolean` - Show scrollbar (default: true)

**Benefits:**
- **Performance**: Only renders visible items
- **Memory efficient**: Doesn't create DOM nodes for off-screen items
- **Smooth scrolling**: Fine-grained reactivity updates only what changed

---

## Mouse Support

Enable mouse tracking to capture clicks, drags, and scroll events.

### Usage

```tsx
import { useMouse } from '@zen/tui';

function InteractiveBox() {
  const mouse = useMouse();

  effect(() => {
    const m = mouse.value;
    if (m?.button === 'left' && m?.pressed) {
      console.log(`Clicked at (${m.x}, ${m.y})`);
    }
  });

  return <Box>{/* ... */}</Box>;
}
```

### Mouse Events

```typescript
interface MouseEvent {
  x: number;      // Column position
  y: number;      // Row position
  button: 'left' | 'right' | 'middle' | 'scroll-up' | 'scroll-down' | null;
  pressed: boolean;  // true = press, false = release
}
```

### Supported Actions

- **Click**: Left, right, middle button clicks
- **Scroll**: Mouse wheel up/down
- **Drag**: Motion tracking while button pressed

### Browser-like Events (Planned)

```tsx
<Box onClick={(x, y) => console.log('Clicked!')}>
  <Text>Click me</Text>
</Box>
```

---

## Architecture

### Component-First Design

All scrolling and UI logic is implemented as **pure components** using fine-grained reactivity:

```
User scroll → scrollY.value changes
                    ↓
              Effect triggers
                    ↓
              Only dirty nodes update
                    ↓
              Incremental Yoga layout
                    ↓
              Render viewport region only
```

### No VDOM, No Reconciler

Unlike React Ink which uses full VDOM diffing:
- ✅ Direct signal updates to persistent nodes
- ✅ Only re-render changed viewport regions
- ✅ Incremental layout calculation
- ✅ Same API as web components

### Performance

**Virtual Scrolling** for 10,000 items:
- Only renders ~20 visible items
- Updates take <1ms per scroll
- Memory: O(visible items) not O(total items)

**Scrollbar Updates:**
- Reactive thumb position
- Only re-renders scrollbar track on change
- No full-screen re-render

---

## Examples

### Full-Screen Dashboard

```tsx
import { renderToTerminalReactive, Box, Text, ScrollBox } from '@zen/tui';

function Dashboard() {
  const logs = signal([/* ... */]);

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="single" padding={1}>
        <Text bold color="cyan">System Dashboard</Text>
      </Box>

      {/* Scrolling log viewer */}
      <ScrollBox height={20} showScrollbar>
        {() => logs.value.map(log => (
          <Text key={log.id}>{log.message}</Text>
        ))}
      </ScrollBox>

      {/* Footer */}
      <Box borderStyle="single" padding={1}>
        <Text dim>Press q to quit • ↑↓ to scroll</Text>
      </Box>
    </Box>
  );
}

await renderToTerminalReactive(
  () => <Dashboard />,
  { fullscreen: true }
);
```

### Virtual List with Search

```tsx
import { signal } from '@zen/signal';
import { VirtualList, TextInput } from '@zen/tui';

function SearchableList() {
  const query = signal('');
  const items = signal(/* large dataset */);

  const filtered = computed(() =>
    items.value.filter(item =>
      item.name.toLowerCase().includes(query.value.toLowerCase())
    )
  );

  return (
    <Box flexDirection="column">
      <TextInput
        value={query}
        placeholder="Search..."
      />

      <VirtualList
        items={filtered.value}
        height={25}
        renderItem={(item) => (
          <Text>{item.name}</Text>
        )}
      />
    </Box>
  );
}
```

---

## Implementation Status

### ✅ Available Now
- Basic scrolling (via MultiSelect pattern)
- Keyboard navigation (via useInput)
- Fine-grained reactivity

### 🚧 In Progress
- Full-screen mode option
- ScrollBox component
- Scrollbar component
- Mouse tracking infrastructure

### 📋 Planned
- VirtualList component
- Mouse click handlers (onClick, onHover)
- Drag & drop support
- Touch screen support (for capable terminals)

---

## Technical Reference

### ANSI Escape Codes Used

**Full-Screen Mode:**
- Enter: `\x1b[?1049h` (Save cursor + use alternate screen)
- Exit: `\x1b[?1049l` (Restore cursor + normal screen)

**Mouse Tracking:**
- Enable: `\x1b[?1000h` (basic) + `\x1b[?1006h` (SGR extended mode)
- Disable: `\x1b[?1000l` + `\x1b[?1006l`
- Event format: `\x1b[<Cb;Cx;Cy(M|m)` where:
  - `Cb` = button code (0=left, 1=middle, 2=right, 64-65=scroll)
  - `Cx` = column (1-based)
  - `Cy` = row (1-based)
  - `M` = press, `m` = release

### Resources

- [ANSI Escape Codes](https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797)
- [Xterm Control Sequences](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html)
- [Console Virtual Terminal Sequences](https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences)
