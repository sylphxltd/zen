# @rapid/tui-advanced

> Advanced components for professional full-screen TUI applications

**@rapid/tui-advanced** provides essential components for building full-screen terminal applications like file managers, text editors, git UIs, and system monitors.

## Installation

```bash
npm install @rapid/tui @rapid/tui-advanced
```

**Note:** Requires `@rapid/tui` as peer dependency.

## Components

### ✅ Layout Components

#### **List** - General-purpose selectable list
```tsx
import { List } from '@rapid/tui-advanced';

const files = ['README.md', 'package.json', 'src/index.ts'];
const selectedIndex = signal(0);

<List
  items={files}
  selectedIndex={selectedIndex.value}
  onSelect={(file, index) => {
    selectedIndex.value = index;
    console.log('Selected:', file);
  }}
  limit={10}
  showIndicator
/>
```

**Features:**
- Single selection with ↑↓ or j/k navigation
- Page Up/Down, Home/End support
- Custom item rendering with generics
- Scrolling for large lists
- Selection indicator customization

#### **Splitter + Pane** - Resizable split panes
```tsx
import { Splitter, Pane } from '@rapid/tui-advanced';

<Splitter orientation="horizontal" sizes={[30, 70]} resizable>
  <Pane minSize={20}>
    <FileTree />
  </Pane>
  <Pane>
    <Editor />
  </Pane>
</Splitter>
```

**Features:**
- Horizontal/vertical orientation
- Percentage-based sizing
- Keyboard resize with [ and ]
- Tab to cycle focus
- Min/max size constraints
- Nested splitters supported

**⭐ Most important component** - Used by 100% of full-screen apps (ranger, lazygit, vim splits, IDE panels).

### ✅ Input Components

#### **TextArea** - Multi-line text editor
```tsx
import { TextArea } from '@rapid/tui-advanced';

const content = signal('# README\n\nEdit me!');

<TextArea
  value={content.value}
  onChange={(newValue) => content.value = newValue}
  rows={20}
  cols={80}
  showLineNumbers
  placeholder="Enter text..."
/>
```

**Features:**
- Multi-line editing with cursor control
- Arrow keys, Home/End, Page Up/Down
- Backspace/Delete, Enter for newlines
- Line numbers, placeholder, read-only modes
- Auto-scroll to keep cursor visible
- Controlled/uncontrolled modes

### ✅ Navigation Components

#### **MenuBar** - Top menu bar with shortcuts
```tsx
import { MenuBar, type MenuItemConfig } from '@rapid/tui-advanced';

const items: MenuItemConfig[] = [
  { label: 'File', key: 'F1', onSelect: () => openFileMenu() },
  { label: 'Edit', key: 'F2', onSelect: () => openEditMenu() },
  { label: 'View', key: 'F3', onSelect: () => openViewMenu(), separator: true },
  { label: 'Help', key: 'F4', onSelect: () => showHelp() },
];

<MenuBar items={items} />
```

**Features:**
- F1-F12 shortcuts
- Alt+key shortcuts (Alt+F, Alt+E, etc.)
- Arrow key navigation
- Number keys for quick selection
- Visual highlighting, disabled items, separators

### ✅ Window Management

#### **Window** - Floating windows with controls
```tsx
import { Window, openWindow, closeWindow } from '@rapid/tui-advanced';

// Open a window
const windowId = openWindow('terminal', {
  title: 'Terminal',
  icon: '🖥️',
  x: 10,
  y: 5,
  width: 60,
  height: 20,
});

// Render window
<Window windowId={windowId}>
  <Text>Window content</Text>
</Window>
```

**Features:**
- Drag, resize, minimize, maximize
- Multi-window state management
- Z-order management
- Focus tracking

**Note:** Most TUI apps use Splitter instead of floating windows. Windows are useful for desktop-style demos.

## Complete Example

```tsx
import { FullscreenLayout, Text, render, signal, MouseProvider } from '@rapid/tui';
import { List, MenuBar, Pane, Splitter, TextArea } from '@rapid/tui-advanced';

function FileEditor() {
  const files = ['README.md', 'package.json', 'src/index.ts'];
  const selectedIndex = signal(0);
  const fileContent = signal('# README\n\nSelect a file to edit...');

  const menuItems = [
    { label: 'File', key: 'F1', onSelect: () => console.log('File menu') },
    { label: 'Edit', key: 'F2', onSelect: () => console.log('Edit menu') },
  ];

  return (
    <FullscreenLayout>
      <MouseProvider>
        <MenuBar items={menuItems} />

        <Splitter orientation="horizontal" sizes={[30, 70]} resizable>
          <Pane minSize={20}>
            <Text bold color="cyan">Files</Text>
            <List
              items={files}
              selectedIndex={selectedIndex.value}
              onSelect={(file, index) => {
                selectedIndex.value = index;
                fileContent.value = `# ${file}\n\nContent here...`;
              }}
            />
          </Pane>

          <Pane>
            <Text bold color="cyan">Editor</Text>
            <TextArea
              value={fileContent.value}
              onChange={(val) => fileContent.value = val}
              rows={20}
              showLineNumbers
            />
          </Pane>
        </Splitter>
      </MouseProvider>
    </FullscreenLayout>
  );
}

await render(FileEditor);
```

## Examples

See `examples/tui-demo/src/test-advanced-demo.tsx` for a complete working example.

## Use Cases

Use **@rapid/tui-advanced** when building:

- ✅ **File managers** (ranger, midnight commander) - Splitter + List
- ✅ **Text editors** (nano, vim splits) - TextArea + Splitter + MenuBar
- ✅ **Git UIs** (lazygit, tig) - Splitter + List + TextArea
- ✅ **System monitors** (htop, bottom) - List + MenuBar
- ✅ **IDEs** - Splitter + TextArea + List
- ✅ **Email clients** (mutt) - List + TextArea + MenuBar

For simple CLI tools and prompts, use **@rapid/tui** instead (smaller bundle, 90% of use cases).

## Package Split Strategy

```
@rapid/tui (core, ~200KB)
├─ Box, Text, TextInput
├─ Checkbox, Radio, Select
├─ Spinner, ProgressBar
└─ For 90% of CLI apps

@rapid/tui-advanced (~83KB)
├─ List, Splitter, TextArea, MenuBar
├─ Window management
└─ For full-screen TUI apps
```

## Performance

- **Fine-grained reactivity** - Only changed components re-render
- **Signal-based** - No virtual DOM overhead
- **Optimized layout** - Yoga for efficient flexbox
- **Bundle size** - 82.75 KB for all components

## Requirements

- Node.js 18+
- `@rapid/tui` >= 0.0.0
- Terminal with 256 color support

## API Reference

### List

```typescript
interface ListProps<T = unknown> {
  items: T[];
  selectedIndex?: number;
  onSelect?: (item: T, index: number) => void;
  renderItem?: (item: T, index: number, isSelected: boolean) => any;
  limit?: number;
  showIndicator?: boolean;
  indicator?: string;
  isFocused?: boolean;
}
```

### Splitter

```typescript
interface SplitterProps {
  orientation?: 'horizontal' | 'vertical';
  sizes?: number[];
  showDivider?: boolean;
  dividerChar?: string;
  resizable?: boolean;
  focusedPane?: number;
  children?: any;
}

interface PaneProps {
  minSize?: number;
  maxSize?: number;
  children?: any;
}
```

### TextArea

```typescript
interface TextAreaProps {
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  cols?: number;
  placeholder?: string;
  showLineNumbers?: boolean;
  wrap?: boolean;
  readOnly?: boolean;
  isFocused?: boolean;
  border?: boolean;
}
```

### MenuBar

```typescript
interface MenuItemConfig {
  label: string;
  key?: string; // 'F1', 'F2', or character for Alt+key
  onSelect?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface MenuBarProps {
  items: MenuItemConfig[];
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  bgColor?: string;
  textColor?: string;
  isFocused?: boolean;
}
```

## License

MIT

---

**Built with ❤️ by the Rapid Team**
