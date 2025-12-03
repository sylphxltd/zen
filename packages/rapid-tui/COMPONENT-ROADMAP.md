# Rapid TUI Component Roadmap

## Vision

**超越 React Ink，成為最強大的 Terminal UI 框架**

支持兩種應用場景：
1. **Console App** - CLI 工具、提示符、表單（如 npm, git）
2. **Full Screen App** - 全屏應用、IDE、文件管理器（如 vim, htop, ranger, lazygit）

---

## Current Status: Component Inventory

### ✅ Primitives (5 components)
| Component | Console App | Full Screen App | React Ink | Status |
|-----------|-------------|-----------------|-----------|--------|
| Box | ✅ | ✅ | ✅ | Complete |
| Text | ✅ | ✅ | ✅ | Complete |
| Static | ✅ | ✅ | ✅ | Complete |
| Newline | ✅ | ✅ | ✅ | Complete |
| Spacer | ✅ | ✅ | ✅ | Complete |

### ✅ Layout (4 components)
| Component | Console App | Full Screen App | React Ink | Status |
|-----------|-------------|-----------------|-----------|--------|
| FullscreenLayout | ❌ | ✅ | ❌ | **Rapid exclusive** |
| ScrollBox | ⚠️ | ✅ | ❌ | **Rapid exclusive** |
| Scrollbar | ❌ | ✅ | ❌ | **Rapid exclusive** |
| Divider | ✅ | ✅ | ❌ | **Rapid exclusive** |

### ✅ Input (7 components)
| Component | Console App | Full Screen App | React Ink | Status |
|-----------|-------------|-----------------|-----------|--------|
| TextInput | ✅ | ✅ | 📦 | Enhanced (suggestions, validation) |
| SelectInput | ✅ | ✅ | 📦 | Enhanced |
| MultiSelect | ✅ | ✅ | 📦 | Enhanced (limit, scroll) |
| Checkbox | ✅ | ✅ | 📦 | Complete |
| Radio | ✅ | ✅ | ❌ | **Rapid exclusive** |
| Button | ✅ | ✅ | ❌ | **Rapid exclusive** |
| Confirmation | ✅ | ✅ | 📦 | Complete |

### ✅ Feedback (5 components)
| Component | Console App | Full Screen App | React Ink | Status |
|-----------|-------------|-----------------|-----------|--------|
| Spinner | ✅ | ✅ | 📦 | Enhanced (6 types) |
| ProgressBar | ✅ | ✅ | 📦 | Complete |
| StatusMessage | ✅ | ✅ | ❌ | **Rapid exclusive** |
| Badge | ✅ | ✅ | ❌ | **Rapid exclusive** |
| Toast | ⚠️ | ✅ | ❌ | **Rapid exclusive** |

### ✅ Data Display (3 components)
| Component | Console App | Full Screen App | React Ink | Status |
|-----------|-------------|-----------------|-----------|--------|
| Table | ✅ | ✅ | ❌ | **Rapid exclusive** |
| TreeView | ⚠️ | ✅ | ❌ | **Rapid exclusive** |
| Markdown | ⚠️ | ✅ | ❌ | **Rapid exclusive** |

### ✅ Navigation (4 components)
| Component | Console App | Full Screen App | React Ink | Status |
|-----------|-------------|-----------------|-----------|--------|
| Tabs | ⚠️ | ✅ | ❌ | **Rapid exclusive** |
| Link | ✅ | ✅ | 📦 | Complete |
| Router | ❌ | ✅ | ❌ | **Rapid exclusive** |
| RouterLink | ❌ | ✅ | ❌ | **Rapid exclusive** |

### ✅ Overlay (2 components)
| Component | Console App | Full Screen App | React Ink | Status |
|-----------|-------------|-----------------|-----------|--------|
| Modal | ⚠️ | ✅ | ❌ | **Rapid exclusive** |
| CommandPalette | ❌ | ✅ | ❌ | **Rapid exclusive** |

### ✅ Chrome (1 component)
| Component | Console App | Full Screen App | React Ink | Status |
|-----------|-------------|-----------------|-----------|--------|
| StatusBar | ❌ | ✅ | ❌ | **Rapid exclusive** |

### ✅ Interactive (3 components)
| Component | Console App | Full Screen App | React Ink | Status |
|-----------|-------------|-----------------|-----------|--------|
| Pressable | ❌ | ✅ | ❌ | **Rapid exclusive** (mouse) |
| Draggable | ❌ | ✅ | ❌ | **Rapid exclusive** (mouse) |
| Hoverable | ❌ | ✅ | ❌ | **Rapid exclusive** (mouse) |

**Current Total: 38 components**

Legend:
- ✅ Core functionality for this use case
- ⚠️ Occasionally useful
- ❌ Not applicable
- 📦 Available via separate package in React Ink ecosystem

---

## Missing Components: Gap Analysis

### 🔴 Critical Missing (P0) - Full Screen App 必需

#### 1. **Splitter / ResizablePane** ⭐⭐⭐⭐⭐
**Why critical:** Every IDE, file manager needs split panes
```tsx
<Splitter orientation="horizontal">
  <Pane minSize={20} defaultSize={30}>
    <FileTree />
  </Pane>
  <Pane>
    <Editor />
  </Pane>
</Splitter>
```
**Examples:** vim split, tmux panes, VS Code panels, ranger multi-pane

#### 2. **MenuBar** ⭐⭐⭐⭐⭐
**Why critical:** Standard UI pattern for full-screen apps
```tsx
<MenuBar>
  <Menu label="File">
    <MenuItem label="Open" shortcut="Ctrl+O" onSelect={handleOpen} />
    <MenuItem label="Save" shortcut="Ctrl+S" onSelect={handleSave} />
    <MenuDivider />
    <MenuItem label="Exit" shortcut="Ctrl+Q" onSelect={exit} />
  </Menu>
  <Menu label="Edit">...</Menu>
  <Menu label="View">...</Menu>
</MenuBar>
```
**Examples:** vim, emacs, midnight commander, htop menu

#### 3. **List** ⭐⭐⭐⭐⭐
**Why critical:** Simpler than Table, more common than TreeView
```tsx
<List
  items={files}
  selectedIndex={selected}
  onSelect={handleSelect}
  renderItem={(item, isSelected) => (
    <Text color={isSelected ? 'cyan' : 'white'}>{item.name}</Text>
  )}
/>
```
**Examples:** File lists, search results, any scrollable selection
**Note:** MultiSelect is too specific, we need generic List

#### 4. **FileBrowser / FilePicker** ⭐⭐⭐⭐
**Why critical:** Common in CLI tools and full-screen apps
```tsx
<FilePicker
  initialPath={process.cwd()}
  onSelect={(path) => console.log('Selected:', path)}
  showHidden={false}
  filter={(file) => file.endsWith('.ts')}
/>
```
**Examples:** ranger, nnn, lazygit file picker, any "Open File" dialog

#### 5. **ContextMenu** ⭐⭐⭐⭐
**Why critical:** Right-click actions in mouse-enabled apps
```tsx
<ContextMenu items={[
  { label: 'Copy', shortcut: 'Ctrl+C', onSelect: copy },
  { label: 'Paste', shortcut: 'Ctrl+V', onSelect: paste },
  { type: 'divider' },
  { label: 'Delete', onSelect: del },
]} />
```
**Examples:** File operations, text editor actions

---

### 🟡 Important Missing (P1) - 增強體驗

#### 6. **Toolbar** ⭐⭐⭐⭐
**Why important:** Common in complex apps
```tsx
<Toolbar>
  <ToolbarButton icon="📁" label="Open" onClick={open} />
  <ToolbarButton icon="💾" label="Save" onClick={save} />
  <ToolbarSeparator />
  <ToolbarButton icon="⚙️" label="Settings" onClick={settings} />
</Toolbar>
```
**Examples:** Text editors, file managers

#### 7. **Notification / NotificationCenter** ⭐⭐⭐⭐
**Why important:** Toast is temporary, need persistent notifications
```tsx
<NotificationCenter>
  <Notification type="info" persistent>
    Build completed successfully
  </Notification>
</NotificationCenter>
```
**Examples:** IDE build notifications, system messages

#### 8. **SearchBar / FilterBar** ⭐⭐⭐⭐
**Why important:** Essential for file browsers, lists
```tsx
<SearchBar
  placeholder="Search files..."
  value={query}
  onChange={setQuery}
  onSubmit={handleSearch}
  showResults={results.length}
/>
```
**Examples:** ranger search, htop filter, any search UI

#### 9. **Breadcrumbs** ⭐⭐⭐
**Why important:** Navigation context in file browsers
```tsx
<Breadcrumbs
  path={['/', 'home', 'user', 'projects']}
  onNavigate={(index) => cd(path.slice(0, index + 1))}
/>
```
**Examples:** File managers, navigation UIs

#### 10. **Drawer / Sidebar** ⭐⭐⭐
**Why important:** Collapsible side panels
```tsx
<Drawer side="left" width={30} collapsible>
  <FileTree />
</Drawer>
```
**Examples:** IDE file explorer, settings panel

#### 11. **Accordion** ⭐⭐⭐
**Why important:** Collapsible sections
```tsx
<Accordion>
  <AccordionItem title="Section 1">Content 1</AccordionItem>
  <AccordionItem title="Section 2">Content 2</AccordionItem>
</Accordion>
```
**Examples:** Settings panels, grouped content

#### 12. **Pagination** ⭐⭐⭐
**Why important:** Large dataset navigation
```tsx
<Pagination
  currentPage={page}
  totalPages={100}
  onPageChange={setPage}
/>
```
**Examples:** Log viewers, search results

#### 13. **Form** ⭐⭐⭐
**Why important:** Validation and error handling
```tsx
<Form onSubmit={handleSubmit}>
  <FormField name="username" label="Username" required>
    <TextInput />
  </FormField>
  <FormField name="password" label="Password" required>
    <TextInput password />
  </FormField>
  <Button type="submit">Login</Button>
</Form>
```
**Examples:** Login forms, configuration wizards

#### 14. **Tooltip** ⭐⭐⭐
**Why important:** Contextual help
```tsx
<Tooltip content="Save current file">
  <Button>Save</Button>
</Tooltip>
```
**Examples:** Mouse-enabled apps, keyboard shortcuts help

#### 15. **LoadingOverlay / Skeleton** ⭐⭐⭐
**Why important:** Better loading UX
```tsx
<LoadingOverlay message="Loading files...">
  <FileList />
</LoadingOverlay>

<Skeleton height={10} width={40} />
```
**Examples:** Loading states in any app

#### 16. **Stepper** ⭐⭐⭐
**Why important:** Multi-step workflows
```tsx
<Stepper currentStep={step}>
  <Step title="Install">...</Step>
  <Step title="Configure">...</Step>
  <Step title="Complete">...</Step>
</Stepper>
```
**Examples:** CLI installers, setup wizards

---

### 🟢 Nice to Have (P2) - 錦上添花

#### 17. **DatePicker** ⭐⭐
```tsx
<DatePicker value={date} onChange={setDate} />
```

#### 18. **TimePicker** ⭐⭐
```tsx
<TimePicker value={time} onChange={setTime} />
```

#### 19. **Slider** ⭐⭐
```tsx
<Slider min={0} max={100} value={volume} onChange={setVolume} />
```

#### 20. **Switch / Toggle** ⭐⭐
```tsx
<Switch checked={enabled} onChange={setEnabled} label="Enable feature" />
```

#### 21. **ColorPicker** ⭐
```tsx
<ColorPicker value={color} onChange={setColor} />
```

#### 22. **DataGrid** ⭐⭐
Like Excel/Google Sheets in terminal
```tsx
<DataGrid data={spreadsheetData} editable />
```

#### 23. **Image Viewer** ⭐
For terminals with image support (iTerm2, Kitty)
```tsx
<Image src="screenshot.png" width={80} />
```

#### 24. **Carousel** ⭐
```tsx
<Carousel autoplay interval={3000}>
  <Slide>Content 1</Slide>
  <Slide>Content 2</Slide>
</Carousel>
```

---

## Comparison: Rapid TUI vs React Ink vs Other Frameworks

### React Ink Ecosystem
| Feature | React Ink Core | React Ink Ecosystem | Rapid TUI | Winner |
|---------|----------------|---------------------|---------|--------|
| Basic components | 5 | 5 | 5 | ✅ Tie |
| Input components | 0 | 4 (via packages) | 7 | ✅ Rapid (built-in) |
| Full-screen mode | ❌ | ❌ | ✅ | ✅ Rapid |
| Mouse support | ❌ | ❌ | ✅ | ✅ Rapid |
| Scrolling | ❌ | ❌ | ✅ | ✅ Rapid |
| Router | ❌ | ❌ | ✅ | ✅ Rapid |
| Command Palette | ❌ | ❌ | ✅ | ✅ Rapid |
| Table | ❌ | 📦 ink-table | ✅ | ✅ Rapid (built-in) |
| TreeView | ❌ | ❌ | ✅ | ✅ Rapid |
| Markdown | ❌ | 📦 ink-markdown | ✅ | ✅ Rapid (built-in) |
| Splitter/Panes | ❌ | ❌ | ❌ | ⚠️ None |
| MenuBar | ❌ | ❌ | ❌ | ⚠️ None |

**Rapid TUI 已經超越 React Ink，但 Full Screen App 支持仍不完整。**

### Blessed (Node.js)
Blessed 是最完整的 Node.js TUI 庫，支持：
- ✅ Widgets: List, ListTable, FileManager, Form, Textarea, etc.
- ✅ Layout: Box, Layout, Grid
- ✅ ScrollableBox, ScrollableText
- ✅ ProgressBar, Log
- ✅ Terminal, Image (for supported terminals)

**Rapid TUI vs Blessed:**
- Rapid: 更現代、reactive、TypeScript
- Blessed: 更完整、更多 widgets、更成熟
- **Goal:** 達到 Blessed 的組件完整度，但更現代化

### Textual (Python)
Textual 是最先進的 Python TUI 框架：
- ✅ Rich widget library
- ✅ CSS-like styling
- ✅ Layout system
- ✅ Animation support
- ✅ **極其專業的 Full Screen App 支持**

**Goal:** Rapid TUI 應該達到 Textual 的專業度

---

## Implementation Priority

### Phase 1: Full Screen App Essentials (P0)
**Goal:** 讓 Rapid TUI 能夠構建專業的 full-screen app（如 ranger, lazygit）

1. ✅ **List** (通用列表組件) - 1-2 days
2. ✅ **Splitter / ResizablePane** (分割窗格) - 2-3 days
3. ✅ **MenuBar + Menu + MenuItem** (菜單欄) - 2-3 days
4. ✅ **FileBrowser / FilePicker** (文件瀏覽器) - 2-3 days
5. ✅ **ContextMenu** (右鍵菜單) - 1-2 days

**Total: ~2 weeks for Phase 1**

### Phase 2: Enhanced UX (P1)
**Goal:** 增強用戶體驗，讓應用更專業

6. ✅ **Toolbar** - 1 day
7. ✅ **NotificationCenter** - 1-2 days
8. ✅ **SearchBar / FilterBar** - 1 day
9. ✅ **Breadcrumbs** - 1 day
10. ✅ **Drawer / Sidebar** - 1-2 days
11. ✅ **Accordion** - 1 day
12. ✅ **Pagination** - 1 day
13. ✅ **Form** - 2 days
14. ✅ **Tooltip** - 1-2 days
15. ✅ **LoadingOverlay / Skeleton** - 1 day
16. ✅ **Stepper** - 1-2 days

**Total: ~2 weeks for Phase 2**

### Phase 3: Polish (P2)
17-24. Nice to have components - as needed

---

## Success Criteria

### For Console Apps ✅ (Already Achieved)
- ✅ Text input and validation
- ✅ Forms and prompts
- ✅ Progress indicators
- ✅ Tables and data display
- ✅ Spinners and loading states

**Result:** Rapid TUI 已經完美支持 Console App

### For Full Screen Apps ⚠️ (Needs Phase 1 + Phase 2)
After Phase 1:
- ✅ File managers (like ranger, nnn)
- ✅ Text editors (like vim, nano)
- ✅ System monitors (like htop, bottom)
- ✅ Git UIs (like lazygit, tig)
- ✅ Database clients (like pgcli)

After Phase 2:
- ✅ IDEs (like VS Code TUI)
- ✅ Email clients (like mutt)
- ✅ Chat apps (like slack-term)
- ✅ Admin panels
- ✅ **任何專業的 TUI 應用**

---

## Next Steps

1. **Review this roadmap** - Confirm priorities
2. **Start Phase 1** - Build P0 components
3. **Build example apps** - ranger-like file manager, htop-like monitor
4. **Iterate** - Learn from building real apps
5. **Phase 2** - Enhanced components
6. **Publish 1.0** - Production-ready release

---

## Target Timeline

- **Phase 1 (P0):** 2 weeks
- **Phase 2 (P1):** 2 weeks
- **Polish & Examples:** 1 week
- **Documentation:** 1 week

**Total: ~6 weeks to complete Rapid TUI 1.0**

---

**Current Status:** ✅ Console App Ready, ⚠️ Full Screen App 65% Complete

**After Phase 1:** ✅ Console App Ready, ✅ Full Screen App 90% Complete

**After Phase 2:** ✅✅ **Complete TUI Framework - 超越所有現有方案**
