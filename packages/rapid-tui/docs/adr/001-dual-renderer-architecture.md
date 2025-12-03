# ADR-001: Dual Renderer Architecture

## Status

Accepted

## Context

Rapid TUI needs to support two fundamentally different rendering modes:

1. **Inline Mode**: Console applications that render within the normal terminal flow, like `npm install` progress bars, questionnaire forms, or CLI wizards. Content can be arbitrarily long and the terminal naturally scrolls.

2. **Fullscreen Mode**: Applications that take over the entire terminal using the alternate screen buffer, like `vim`, `htop`, or dashboard applications. Content is constrained to terminal dimensions.

Additionally, we need to support **Mixed Mode** where an application can switch between inline and fullscreen modes at runtime (e.g., pressing a button to open fullscreen settings, then returning to inline mode).

### Current Problem

The current implementation uses a single rendering approach with a fixed-size buffer:

```typescript
let terminalHeight = process.stdout.rows || 24;
const currentBuffer = new TerminalBuffer(terminalWidth, terminalHeight);
```

This causes several issues:

1. **Buffer truncation**: A 39-line questionnaire gets truncated to 24 lines in the buffer
2. **Re-render corruption**: Re-renders only clear/rewrite buffer-sized content, leaving orphaned lines
3. **Exit positioning**: Cursor positioning calculations are incorrect for content larger than terminal height
4. **Mode coupling**: Fullscreen optimizations (fine-grained diffing) are applied to inline mode where they don't make sense

### Requirements

| Requirement | Inline Mode | Fullscreen Mode |
|-------------|-------------|-----------------|
| Content height | **Unlimited** | = Terminal height |
| Screen buffer | Main screen | Alternate screen |
| Natural scroll | Yes | No |
| Re-render strategy | Clear all + rewrite | Fine-grained diff |
| Mouse support | Yes | Yes |
| Performance priority | Correctness | Efficiency |

## Decision

Implement a **Dual Renderer Architecture** with separate rendering strategies for inline and fullscreen modes, coordinated by a Screen Manager.

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    render()                          │
│  ┌─────────────────────────────────────────────────┐│
│  │              Screen Manager                      ││
│  │                                                  ││
│  │  ┌───────────────────┐  ┌─────────────────────┐ ││
│  │  │  InlineRenderer   │  │ FullscreenRenderer  │ ││
│  │  │                   │  │                     │ ││
│  │  │ • Dynamic height  │  │ • Fixed buffer      │ ││
│  │  │ • No buffer limit │  │ • Alt screen        │ ││
│  │  │ • Clear+rewrite   │  │ • Fine-grained diff │ ││
│  │  │ • Main screen     │  │ • Terminal height   │ ││
│  │  └───────────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │          Mouse Manager (independent)             ││
│  │          • Reference counting                    ││
│  │          • Works in BOTH modes                   ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │          Input Handler (shared)                  ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### Component Design

#### 1. InlineRenderer

Handles rendering for console applications in the main screen buffer.

```typescript
interface InlineRenderer {
  // Render content to terminal (no size limit)
  render(content: string): void;

  // Clean up and position cursor at end
  cleanup(): void;

  // Pause rendering (before switching to fullscreen)
  pause(): void;

  // Resume rendering (after returning from fullscreen)
  resume(): void;
}
```

**Key characteristics:**
- **Dynamic content height**: Tracks actual rendered lines, not buffer size
- **Clear + rewrite**: Each render clears previous content and rewrites entirely
- **No buffer limit**: Content can be any height, terminal scrolls naturally
- **Cursor management**: Maintains cursor at top of content for re-renders, moves to bottom on cleanup

**Implementation approach:**
```typescript
class InlineRenderer {
  private contentHeight = 0;
  private cursorAtTop = true;

  render(content: string) {
    const lines = content.split('\n');

    // Clear previous content (all of it, regardless of height)
    if (this.contentHeight > 0 && this.cursorAtTop) {
      this.clearLines(this.contentHeight);
    }

    // Write new content
    process.stdout.write(content);
    this.contentHeight = lines.length;

    // Move cursor back to top for next render
    this.moveCursorUp(lines.length - 1);
    this.cursorAtTop = true;
  }

  cleanup() {
    // Move to bottom of content
    if (this.cursorAtTop) {
      this.moveCursorDown(this.contentHeight - 1);
    }
    process.stdout.write('\n');
  }
}
```

#### 2. FullscreenRenderer

Handles rendering for fullscreen applications using the alternate screen buffer.

```typescript
interface FullscreenRenderer {
  // Enter alternate screen and start rendering
  enter(): void;

  // Render with fine-grained diffing
  render(node: TUINode, layoutMap: LayoutMap): void;

  // Exit alternate screen
  exit(): void;
}
```

**Key characteristics:**
- **Fixed buffer size**: Buffer dimensions = terminal dimensions
- **Alternate screen**: Uses `\x1b[?1049h` to preserve main screen
- **Fine-grained diffing**: Only updates changed lines for efficiency
- **Terminal-constrained**: Content cannot exceed terminal bounds

**Implementation approach:**
```typescript
class FullscreenRenderer {
  private buffer: TerminalBuffer;
  private previousBuffer: TerminalBuffer;

  enter() {
    const { columns, rows } = process.stdout;
    this.buffer = new TerminalBuffer(columns, rows);
    this.previousBuffer = new TerminalBuffer(columns, rows);

    process.stdout.write('\x1b[?1049h'); // Enter alternate screen
    process.stdout.write('\x1b[2J');     // Clear screen
    process.stdout.write('\x1b[H');      // Move to top-left
  }

  render(node: TUINode, layoutMap: LayoutMap) {
    renderToBuffer(node, this.buffer, layoutMap);

    // Fine-grained diff - only output changed lines
    const changes = this.buffer.diff(this.previousBuffer);
    for (const change of changes) {
      process.stdout.write(`\x1b[${change.y + 1};1H\x1b[2K${change.line}`);
    }

    // Update previous buffer with changes only
    for (const change of changes) {
      this.previousBuffer.setLine(change.y, change.line);
    }
  }

  exit() {
    process.stdout.write('\x1b[?1049l'); // Exit alternate screen
  }
}
```

#### 3. ScreenManager

Coordinates between renderers and handles mode switching.

```typescript
interface ScreenManager {
  // Get current mode
  readonly mode: 'inline' | 'fullscreen';

  // Switch to fullscreen (called by FullscreenLayout onMount)
  enterFullscreen(): void;

  // Return to inline (called by FullscreenLayout onCleanup)
  exitFullscreen(): void;

  // Render current content
  render(node: TUINode, layoutMap: LayoutMap): void;

  // Clean up on app exit
  cleanup(): void;
}
```

**Mode switching flow:**

```
[Inline Mode]
    │
    ├─ FullscreenLayout mounts
    │      │
    │      ▼
    │  screenManager.enterFullscreen()
    │      │
    │      ├─ inlineRenderer.pause()
    │      ├─ stdout.write('\x1b[?1049h')  // Enter alt screen
    │      └─ fullscreenRenderer.enter()
    │
    ▼
[Fullscreen Mode]
    │
    ├─ FullscreenLayout unmounts
    │      │
    │      ▼
    │  screenManager.exitFullscreen()
    │      │
    │      ├─ fullscreenRenderer.exit()
    │      ├─ stdout.write('\x1b[?1049l')  // Exit alt screen
    │      └─ inlineRenderer.resume()
    │
    ▼
[Inline Mode]  (previous content preserved!)
```

### API Design

The public API remains simple and unchanged:

```tsx
// Simple inline app (unlimited height)
await render(() => <Questionnaire />);

// Simple fullscreen app
await render(() => (
  <FullscreenLayout>
    <Dashboard />
  </FullscreenLayout>
));

// Mixed mode - switch between inline and fullscreen
await render(() => (
  <Router>
    {/* Inline pages */}
    <Route path="/" component={InlineHome} />
    <Route path="/survey" component={Questionnaire} />

    {/* Fullscreen pages */}
    <Route path="/dashboard" component={() => (
      <FullscreenLayout>
        <Dashboard />
      </FullscreenLayout>
    )} />
  </Router>
));

// Mouse works in both modes
await render(() => (
  <MouseProvider>
    <App />
  </MouseProvider>
));
```

### Mouse Handling

Mouse support is **independent of rendering mode**:

- MouseProvider enables mouse tracking via reference counting
- Works identically in inline and fullscreen modes
- No changes needed to existing MouseProvider implementation

### Layout Calculation

Layout calculation behavior differs by mode:

| Aspect | Inline Mode | Fullscreen Mode |
|--------|-------------|-----------------|
| Width constraint | Terminal width | Terminal width |
| Height constraint | **None** (content determines) | Terminal height |
| Overflow | Natural scroll | Clipped or ScrollBox |

The `computeLayout()` function receives different height constraints based on current mode.

## Consequences

### Positive

1. **Correct inline behavior**: Questionnaires, forms, and wizards work correctly regardless of height
2. **Efficient fullscreen**: Fine-grained updates preserved for performance
3. **Clean mode switching**: Alternate screen preserves main screen content
4. **Mouse everywhere**: Mouse support works in both modes without changes
5. **Simple API**: Users don't need to understand the complexity
6. **Type safety**: Strong typing throughout the architecture

### Negative

1. **Implementation complexity**: Two renderers to maintain instead of one
2. **Testing surface**: Need to test both modes and transitions
3. **Memory**: Small overhead from having two renderer instances

### Neutral

1. **Breaking change**: Internal refactor, but public API unchanged
2. **Migration**: Existing apps continue to work without changes

## Implementation Plan

1. Create `InlineRenderer` class with dynamic height tracking
2. Create `FullscreenRenderer` class (refactor from existing buffer logic)
3. Create `ScreenManager` to coordinate renderers
4. Refactor `render()` to use `ScreenManager`
5. Update `FullscreenLayout` to signal mode changes
6. Test all modes: inline, fullscreen, mixed
7. Update documentation

## References

- [React Ink](https://github.com/vadimdemedes/ink) - Inline rendering reference
- [Alternate Screen Buffer](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html) - Terminal escape sequences
- [ANSI Escape Codes](https://en.wikipedia.org/wiki/ANSI_escape_code) - Cursor control
