/** @jsxImportSource @zen/tui */
/**
 * Component Test - WAI-ARIA Tabs Pattern
 *
 * Navigation:
 * - Header tabs: ←/→ arrows to switch tabs
 * - Content: Tab/Shift+Tab to switch focus within content
 * - Esc: Jump from content back to header
 * - Enter/↓: Jump from header into content
 */

import {
  Box,
  FocusProvider,
  Match,
  MouseProvider,
  Switch,
  Text,
  renderApp,
  signal,
  useInput,
} from '@zen/tui';
import { List, MenuBar, Pane, Splitter, TextArea } from '@zen/tui-advanced';

// =============================================================================
// Main Component
// =============================================================================

function ComponentTest() {
  const tabs = ['List', 'Splitter', 'TextArea', 'MenuBar', 'All'];
  const activeTab = signal(0);
  // Focus scope: 'header' or 'content'
  const focusScope = signal<'header' | 'content'>('header');
  // Stable getter for content focus state (don't recreate in render)
  const contentFocused = () => focusScope.value === 'content';

  useInput((input, key) => {
    // q to quit
    if (input === 'q') {
      process.exit(0);
    }

    // Header scope navigation
    if (focusScope.value === 'header') {
      // ←/→ to switch tabs
      if (key.leftArrow) {
        activeTab.value = (activeTab.value - 1 + tabs.length) % tabs.length;
        return true;
      }
      if (key.rightArrow) {
        activeTab.value = (activeTab.value + 1) % tabs.length;
        return true;
      }
      // Enter or ↓ to enter content
      if (key.return || key.downArrow) {
        focusScope.value = 'content';
        return true;
      }
      // Tab in header mode: consume to prevent FocusProvider from stealing focus
      if (key.tab) {
        return true;
      }
    }

    // Esc to return to header (from anywhere)
    if (key.escape) {
      focusScope.value = 'header';
      return true;
    }

    return false;
  });

  return (
    <FocusProvider>
      <MouseProvider>
        <Box style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
          {/* Header */}
          <Box style={{ backgroundColor: 'blue', height: 1, paddingLeft: 1 }}>
            <Text style={{ color: 'white', bold: true }}>
              @zen/tui-advanced Component Test
            </Text>
          </Box>

          {/* Tab Bar */}
          <Box
            style={{
              flexDirection: 'row',
              backgroundColor: () => (focusScope.value === 'header' ? 'blue' : 'gray'),
              height: 1,
              gap: 2,
              paddingLeft: 1,
            }}
          >
            {tabs.map((tab, i) => (
              <Text
                key={tab}
                style={{
                  color: () => {
                    if (activeTab.value === i) {
                      return focusScope.value === 'header' ? 'yellow' : 'white';
                    }
                    return 'white';
                  },
                  bold: () => activeTab.value === i,
                  inverse: () => activeTab.value === i && focusScope.value === 'header',
                }}
              >
                {tab}
              </Text>
            ))}
          </Box>

          {/* Content */}
          <Box style={{ flex: 1, padding: 1 }}>
            <Switch fallback={<Text>Select a tab</Text>}>
              <Match when={() => activeTab.value === 0}>
                <ListTest isFocused={contentFocused} />
              </Match>
              <Match when={() => activeTab.value === 1}>
                <SplitterTest isFocused={contentFocused} />
              </Match>
              <Match when={() => activeTab.value === 2}>
                <TextAreaTest isFocused={contentFocused} />
              </Match>
              <Match when={() => activeTab.value === 3}>
                <MenuBarTest isFocused={contentFocused} />
              </Match>
              <Match when={() => activeTab.value === 4}>
                <AllTest isFocused={contentFocused} />
              </Match>
            </Switch>
          </Box>

          {/* Footer */}
          <Box style={{ backgroundColor: 'blue', height: 1, paddingLeft: 1 }}>
            <Text style={{ color: 'white' }}>
              {() =>
                focusScope.value === 'header'
                  ? '←/→: switch tabs | Enter/↓: enter content | q: quit'
                  : 'Tab: switch focus | Esc: back to tabs | q: quit'
              }
            </Text>
          </Box>
        </Box>
      </MouseProvider>
    </FocusProvider>
  );
}

// =============================================================================
// Test Components
// =============================================================================

interface TestProps {
  isFocused: boolean | (() => boolean);
}

// Test 1: List
function ListTest({ isFocused }: TestProps) {
  const items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>List Component Test:</Text>
      <List
        focusId="list-test"
        autoFocus
        items={items}
        isFocused={isFocused}
        onSelect={(_item) => {}}
      />
      <Text style={{ dim: true }}>Use ↑↓ to navigate, Enter to select</Text>
    </Box>
  );
}

// Test 2: Splitter (no focus needed - just visual demo)
function SplitterTest(_props: TestProps) {
  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>Splitter Component Test:</Text>
      <Box style={{ height: 10 }}>
        <Splitter orientation="horizontal" sizes={[30, 70]}>
          <Pane minSize={10}>
            <Text style={{ color: 'green' }}>Left Pane (30%)</Text>
            <Text>Content A</Text>
          </Pane>
          <Pane minSize={20}>
            <Text style={{ color: 'yellow' }}>Right Pane (70%)</Text>
            <Text>Content B</Text>
          </Pane>
        </Splitter>
      </Box>
      <Text style={{ dim: true }}>Use Shift+[ and Shift+] to resize panes</Text>
    </Box>
  );
}

// Test 3: TextArea
function TextAreaTest({ isFocused }: TestProps) {
  const text = signal('Hello World!\nThis is a multi-line\ntext editor test.');

  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>TextArea Component Test:</Text>
      <TextArea
        focusId="textarea-test"
        autoFocus
        value={() => text.value}
        onChange={(v) => {
          text.value = v;
        }}
        rows={8}
        cols={50}
        showLineNumbers
        isFocused={isFocused}
      />
      <Text style={{ dim: true }}>Type to edit, arrows to move cursor</Text>
    </Box>
  );
}

// Test 4: MenuBar
function MenuBarTest({ isFocused }: TestProps) {
  const status = signal('Ready');

  const menuItems = [
    { label: 'File', onSelect: () => { status.value = 'File clicked!'; } },
    { label: 'Edit', onSelect: () => { status.value = 'Edit clicked!'; } },
    { label: 'View', onSelect: () => { status.value = 'View clicked!'; } },
    { label: 'Help', onSelect: () => { status.value = 'Help clicked!'; } },
  ];

  return (
    <Box style={{ flexDirection: 'column', gap: 1 }}>
      <Text style={{ bold: true, color: 'cyan' }}>MenuBar Component Test:</Text>
      <MenuBar items={menuItems} isFocused={isFocused} />
      <Text>
        Status: <Text style={{ color: 'green' }}>{() => status.value}</Text>
      </Text>
      <Text style={{ dim: true }}>Use ←/→ arrows to navigate, Enter to select</Text>
    </Box>
  );
}

// Test 5: All Together (uses parent FocusProvider)
function AllTest({ isFocused }: TestProps) {
  const files = ['index.ts', 'app.tsx', 'utils.ts', 'config.json'];
  const selectedFile = signal(0);
  const content = signal('// Select a file to edit\n');
  // Key to force TextArea remount when file changes (resets cursor)
  const editorKey = signal(0);

  const handleFileSelect = (_: string, i: number) => {
    selectedFile.value = i;
    content.value = `// Content of ${files[i]}\n\nfunction example() {\n  return "Hello";\n}\n`;
    // Increment key to reset TextArea cursor
    editorKey.value += 1;
  };

  return (
    <Box style={{ flexDirection: 'column', height: '100%' }}>
      <MenuBar items={[{ label: 'New' }, { label: 'Open' }, { label: 'Save' }, { label: 'Quit' }]} />
      <Box style={{ flex: 1 }}>
        <Splitter orientation="horizontal" sizes={[25, 75]}>
          <Pane minSize={15}>
            <Text style={{ bold: true, color: 'cyan' }}>Files:</Text>
            <List
              focusId="all-file-list"
              autoFocus
              items={files}
              isFocused={isFocused}
              onSelect={handleFileSelect}
            />
          </Pane>
          <Pane minSize={30}>
            <Text style={{ bold: true, color: 'cyan' }}>Editor:</Text>
            {() => (
              <TextArea
                key={editorKey.value}
                focusId="all-editor"
                value={() => content.value}
                onChange={(v) => {
                  content.value = v;
                }}
                rows={12}
                wrap={false}
                showLineNumbers
                isFocused={isFocused}
              />
            )}
          </Pane>
        </Splitter>
      </Box>
      <Box style={{ height: 1, backgroundColor: 'gray' }}>
        <Text style={{ dim: true }}>Tab: switch focus | Enter: select file</Text>
      </Box>
    </Box>
  );
}

// =============================================================================
// Entry Point
// =============================================================================

await renderApp(() => ComponentTest(), {
  fps: 10,
  fullscreen: true,
  mouse: true,
});
