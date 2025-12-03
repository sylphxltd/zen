# @rapid/tui Roadmap - Ink Feature Parity

## Overview

Build comprehensive TUI component library matching Ink ecosystem capabilities, using Rapid's reactive primitives.

## Architecture

```
@rapid/tui (core)
├── Rendering engine
├── Basic components (Box, Text, Static)
├── Platform ops (stdin/stdout, ANSI)
└── Layout system (Flexbox)

@rapid/tui-inputs (separate)
├── TextInput
├── SelectInput
├── MultiSelect
├── Checkbox, Radio
└── Focus management

@rapid/tui-components (separate)
├── Spinner, ProgressBar
├── Table, Divider, Tabs
├── Badge, StatusMessage
└── UI utilities

@rapid/tui-markdown (separate)
├── Markdown rendering
└── Syntax highlighting

@rapid/tui-visual (separate)
├── Gradient
├── BigText
└── Charts/Sparkline
```

**Rationale:**
- **@rapid/tui**: Minimal core for text-only apps (display/logging)
- **@rapid/tui-inputs**: Optional, only for interactive apps
- **@rapid/tui-components**: Optional, for rich UI elements
- **@rapid/tui-markdown**: Optional, for documentation/help screens
- **@rapid/tui-visual**: Optional, for fancy effects

## Phase 1: Core Package (@rapid/tui) (Priority P0)

### Current Status
- ✅ Box component (borders, padding, auto-sizing)
- ✅ Text component (colors, styles)
- ✅ Basic rendering engine
- ✅ Diff-based updates (fine-grained reactivity)
- ✅ Reactive signal integration

### To Add

#### Static Component
```tsx
<Static items={logLines}>
  {(line, index) => <Text key={index}>{line}</Text>}
</Static>
```
- Render static content that doesn't update
- For logs, output history
- Performant for large lists

#### Newline Component
```tsx
<Newline count={2} />
```

#### Spacer Component
```tsx
<Spacer />  {/* flexible space */}
```

#### Layout Engine Improvements
- [ ] Flexbox-style layout (currently only vertical stacking)
- [ ] Width/height constraints
- [ ] Alignment (left, center, right)
- [ ] Padding improvements (separate left/right/top/bottom)

**Refs:**
- Ink focus: https://github.com/vadimdemedes/ink#usefocus
- Ink input: https://github.com/vadimdemedes/ink#useinput

---

---

## Phase 2: Input Package (@rapid/tui-inputs) (Priority P0)

### Infrastructure

#### Keyboard & Input Handling
- [ ] stdin raw mode management
- [ ] Key event system (arrow keys, enter, tab, ctrl combinations)
- [ ] Input buffer for text editing
- [ ] Cursor position tracking
- [ ] useInput hook

#### Focus Management
- [ ] Focus system (which component receives input)
- [ ] Tab navigation between components
- [ ] useFocus hook
- [ ] FocusContext

### Components

### TextInput
```tsx
<TextInput
  value={text}
  onChange={setText}
  placeholder="Enter text..."
  onSubmit={handleSubmit}
  showCursor={true}
  mask={false}  // for passwords
/>
```

**Features:**
- Cursor navigation (arrow left/right, home/end)
- Text selection (shift + arrows)
- Copy/paste support
- Placeholder text
- Password masking
- Validation

**Refs:**
- ink-text-input: https://github.com/vadimdemedes/ink-text-input
- @inkjs/ui TextInput: https://github.com/vadimdemedes/ink-ui

### SelectInput
```tsx
<SelectInput
  items={[
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' }
  ]}
  onSelect={handleSelect}
  initialIndex={0}
/>
```

**Features:**
- Arrow up/down or j/k navigation
- Search/filter items
- Multi-column display
- Item indicators (✓ ✗ →)

**Refs:**
- ink-select-input: https://github.com/vadimdemedes/ink-select-input

### MultiSelect
```tsx
<MultiSelect
  items={items}
  onSubmit={handleSubmit}
  limit={10}  // max visible items
/>
```

**Features:**
- Space to toggle selection
- Multiple selected items
- Select all/none
- Checkboxes/indicators

### Checkbox
```tsx
<Checkbox
  label="Accept terms"
  checked={accepted}
  onChange={setAccepted}
/>
```

### Radio
```tsx
<Radio
  options={options}
  value={selected}
  onChange={setSelected}
/>
```

---

---

## Phase 3: Components Package (@rapid/tui-components) (Priority P1)

### Spinner
```tsx
<Spinner type="dots" label="Loading..." />
```

**Types:**
- dots, line, arrow, bouncingBar, etc.
- Custom frames support

**Refs:**
- ink-spinner: https://github.com/sindresorhus/ink-spinner

### ProgressBar
```tsx
<ProgressBar
  percent={progress}
  columns={50}
  character="█"
  left={<Text>Downloading...</Text>}
  right={<Text>{progress}%</Text>}
/>
```

**Features:**
- Customizable characters
- Percentage display
- ETA calculation
- Custom left/right content

**Refs:**
- ink-progress-bar: https://github.com/brigand/ink-progress-bar
- @inkjs/ui ProgressBar

### Table
```tsx
<Table
  data={rows}
  columns={[
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Value', key: 'value', width: 10 }
  ]}
  border={true}
/>
```

**Features:**
- Auto-sizing columns
- Borders (single, double, rounded)
- Header row
- Cell alignment
- Truncation/wrapping

**Refs:**
- ink-table: https://github.com/maticzav/ink-table

### Divider
```tsx
<Divider character="─" padding={1} />
```

### Tabs
```tsx
<Tabs activeTab={tab} onChange={setTab}>
  <Tab name="Overview">...</Tab>
  <Tab name="Details">...</Tab>
</Tabs>
```

### Badge
```tsx
<Badge color="green">Success</Badge>
<Badge color="red">Error</Badge>
```

### StatusMessage
```tsx
<StatusMessage type="success">✓ Done!</StatusMessage>
<StatusMessage type="error">✗ Failed</StatusMessage>
<StatusMessage type="warning">⚠ Warning</StatusMessage>
<StatusMessage type="info">ℹ Info</StatusMessage>
```

---

---

## Phase 4: Markdown Package (@rapid/tui-markdown) (Priority P2)

### Markdown
```tsx
<Markdown>{markdownText}</Markdown>
```

**Features:**
- Headings, lists, code blocks
- Links (render as underlined)
- Bold, italic, strikethrough
- Tables
- Blockquotes

**Dependencies:**
- marked or remark for parsing
- ansi-escapes for formatting

**Refs:**
- ink-markdown: https://github.com/cameronhunter/ink-markdown

### SyntaxHighlight
```tsx
<SyntaxHighlight
  language="typescript"
  code={codeString}
  theme="monokai"
/>
```

**Dependencies:**
- highlight.js or prism
- chalk for colors

**Refs:**
- ink-syntax-highlight

---

---

## Phase 5: Visual Package (@rapid/tui-visual) (Priority P2)

### Gradient
```tsx
<Gradient name="rainbow">
  Big colorful text
</Gradient>

<Gradient colors={['#FF0000', '#0000FF']}>
  Custom gradient
</Gradient>
```

**Built-in gradients:**
- rainbow, pastel, cristal, teen, mind, morning, vice, fruit, retro, summer, etc.

**Dependencies:**
- gradient-string
- chalk

**Refs:**
- ink-gradient: https://github.com/sindresorhus/ink-gradient

### BigText
```tsx
<BigText
  text="rapid TUI"
  font="block"
  colors={['cyan', 'magenta']}
  space={true}
/>
```

**Fonts:**
- block, slick, tiny, grid, pallet, shade, chrome, simple, 3d, etc.

**Dependencies:**
- cfonts or figlet

**Refs:**
- ink-big-text: https://github.com/sindresorhus/ink-big-text

### Chart (Bar Chart)
```tsx
<BarChart
  data={[
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 }
  ]}
  height={10}
/>
```

### Sparkline
```tsx
<Sparkline data={[1, 5, 22, 13, 5]} />
```

**Refs:**
- ink-sparkline

---

## Phase 6: Advanced Features (Priority P3)

### Link
```tsx
<Link url="https://example.com">Click here</Link>
```

**Features:**
- Terminal link support (OSC 8)
- Fallback for unsupported terminals

**Refs:**
- ink-link: https://github.com/sindresorhus/ink-link

### Confirmation
```tsx
<Confirmation
  message="Are you sure?"
  onConfirm={handleYes}
  onCancel={handleNo}
/>
```

### PasswordInput
```tsx
<PasswordInput
  value={password}
  onChange={setPassword}
  mask="*"
/>
```

### DatePicker / TimePicker
```tsx
<DatePicker
  value={date}
  onChange={setDate}
  format="YYYY-MM-DD"
/>
```

---

## Implementation Strategy

### Priorities
1. **P0 (Must-have)**: Core infrastructure, basic inputs (TextInput, SelectInput)
2. **P1 (Important)**: UI components (Spinner, ProgressBar, Table)
3. **P2 (Nice-to-have)**: Markdown, visual effects
4. **P3 (Future)**: Advanced components

### Dependencies to Add

**Core:**
- `slice-ansi` ✅ (already added)
- `string-width` ✅ (already added)
- `strip-ansi` ✅ (already added)
- `chalk` ✅ (already added)
- `cli-boxes` ✅ (already added)
- `ansi-escapes` - cursor movement, screen manipulation
- `cli-cursor` - hide/show cursor

**Input:**
- None (implement ourselves using process.stdin)

**Visual:**
- `gradient-string` - for Gradient component
- `cfonts` or `figlet` - for BigText
- `cli-spinners` - spinner frames database

**Markdown:**
- `marked` or `remark` - markdown parsing
- `highlight.js` - syntax highlighting

### Testing Strategy
- Unit tests for each component
- Integration tests for keyboard input
- Visual regression tests (snapshot terminal output)
- Demo apps for each component

### Documentation
- Component API reference
- Interactive examples
- Migration guide from Ink
- Best practices guide

---

## Package Dependency Tree

```
@rapid/tui (core)
  ├── @rapid/signal
  └── @rapid/runtime

@rapid/tui-inputs
  └── @rapid/tui (peer)

@rapid/tui-components
  └── @rapid/tui (peer)

@rapid/tui-markdown
  └── @rapid/tui (peer)

@rapid/tui-visual
  └── @rapid/tui (peer)
```

## Use Cases

### Text-only app (logging, output)
```bash
npm install @rapid/tui
```
```tsx
import { Box, Text } from '@rapid/tui';
// Display only, no interaction needed
```

### Interactive CLI app
```bash
npm install @rapid/tui @rapid/tui-inputs @rapid/tui-components
```
```tsx
import { Box, Text } from '@rapid/tui';
import { TextInput, SelectInput } from '@rapid/tui-inputs';
import { Spinner, ProgressBar } from '@rapid/tui-components';
```

### Documentation/help viewer
```bash
npm install @rapid/tui @rapid/tui-markdown
```
```tsx
import { Box } from '@rapid/tui';
import { Markdown } from '@rapid/tui-markdown';
```

### Fancy dashboard
```bash
npm install @rapid/tui @rapid/tui-components @rapid/tui-visual
```
```tsx
import { Box } from '@rapid/tui';
import { Table } from '@rapid/tui-components';
import { Gradient, BigText, BarChart } from '@rapid/tui-visual';
```

## Comparison with Ink

| Feature | Ink | Rapid Packages |
|---------|-----|--------------|
| **Core** |
| JSX/TSX | ✅ | ✅ @rapid/tui |
| Reactive updates | ✅ React hooks | ✅ Rapid signals |
| Box, Text | ✅ ink | ✅ @rapid/tui |
| Static | ✅ ink | ⚠️ @rapid/tui (planned) |
| Layout (Flexbox) | ✅ ink | ⚠️ @rapid/tui (planned) |
| **Inputs** |
| TextInput | ✅ ink-text-input | ❌ @rapid/tui-inputs (planned) |
| SelectInput | ✅ ink-select-input | ❌ @rapid/tui-inputs (planned) |
| Focus management | ✅ ink (useFocus) | ❌ @rapid/tui-inputs (planned) |
| **Components** |
| Spinner | ✅ ink-spinner | ❌ @rapid/tui-components (planned) |
| ProgressBar | ✅ ink-progress-bar | ❌ @rapid/tui-components (planned) |
| Table | ✅ ink-table | ❌ @rapid/tui-components (planned) |
| **Markdown** |
| Markdown | ✅ ink-markdown | ❌ @rapid/tui-markdown (planned) |
| Syntax Highlight | ✅ ink-syntax-highlight | ❌ @rapid/tui-markdown (planned) |
| **Visual** |
| Gradient | ✅ ink-gradient | ❌ @rapid/tui-visual (planned) |
| BigText | ✅ ink-big-text | ❌ @rapid/tui-visual (planned) |

---

## Next Steps

1. ✅ Research Ink ecosystem
2. Create component architecture plan
3. Implement keyboard/focus infrastructure
4. Build TextInput component
5. Build SelectInput component
6. Add examples and tests
7. Iterate based on feedback

---

## References

- Ink core: https://github.com/vadimdemedes/ink
- Ink UI: https://github.com/vadimdemedes/ink-ui
- Awesome Ink: https://github.com/vadimdemedes/awesome-ink
- LogRocket tutorial: https://blog.logrocket.com/using-ink-ui-react-build-interactive-custom-clis/
