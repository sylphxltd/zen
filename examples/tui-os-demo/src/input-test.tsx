/** @jsxImportSource @zen/tui */
/**
 * Input Test - Minimal reproduction of AllTest focus issues
 *
 * Tests:
 * 1. Tab navigation between List and TextArea
 * 2. Input routing to correct component
 * 3. Gate (content mode) control
 */
import { Box, FocusProvider, MouseProvider, Text, renderApp, signal, useInput } from '@zen/tui';
import { List, TextArea } from '@zen/tui-advanced';

function InputTest() {
  const scope = signal<'header' | 'content'>('header');
  const keyLog = signal<string[]>([]);

  const log = (msg: string) => {
    keyLog.value = [...keyLog.value.slice(-15), msg];
  };

  // Gate for content focus - stable reference
  const contentFocused = () => scope.value === 'content';

  // Track what the components report for display
  const listReceived = signal<string>('');
  const textareaReceived = signal<string>('');
  const textareaValue = signal(''); // Start empty, use placeholder instead

  return (
    <FocusProvider>
      <MouseProvider>
        <Box style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
          {/* Header */}
          <Box
            style={{
              backgroundColor: () => (scope.value === 'header' ? 'blue' : 'gray'),
              paddingLeft: 1,
              height: 1,
            }}
          >
            <Text style={{ color: 'white', bold: true }}>
              Mode: {() => scope.value.toUpperCase()} | Press Enter to enter content, Esc to return
            </Text>
          </Box>

          {/* Content - List and TextArea side by side */}
          <Box style={{ flex: 1, flexDirection: 'row' }}>
            {/* Left: List with focusId + isFocused (matches AllTest pattern) */}
            <Box
              style={{
                flex: 1,
                borderStyle: 'single',
                borderColor: 'gray',
                padding: 1,
                flexDirection: 'column',
              }}
            >
              <Text style={{ bold: true }}>List (focusId + autoFocus):</Text>
              <List
                focusId="test-list"
                autoFocus
                items={['Apple', 'Banana', 'Cherry', 'Date']}
                isFocused={contentFocused}
                onSelect={(item, idx) => {
                  listReceived.value = `Selected: ${item} (${idx})`;
                  log(`[List] Selected: ${item}`);
                }}
              />
              <Text style={{ dim: true, marginTop: 1 }}>
                Last: {() => listReceived.value || '-'}
              </Text>
            </Box>

            {/* Right: TextArea with focusId + isFocused (matches AllTest pattern) */}
            <Box
              style={{
                flex: 1,
                borderStyle: 'single',
                borderColor: 'gray',
                padding: 1,
                flexDirection: 'column',
              }}
            >
              <Text style={{ bold: true }}>TextArea (focusId):</Text>
              <TextArea
                focusId="test-textarea"
                value={() => textareaValue.value}
                placeholder="Type here..."
                rows={5}
                cols={40}
                isFocused={contentFocused}
                onChange={(v) => {
                  textareaValue.value = v;
                  textareaReceived.value = `Changed to: ${v.slice(0, 20)}...`;
                  log('[TextArea] Changed');
                }}
              />
              <Text style={{ dim: true, marginTop: 1 }}>
                Last: {() => textareaReceived.value || '-'}
              </Text>
            </Box>
          </Box>

          {/* Key log */}
          <Box
            style={{
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'gray',
              padding: 1,
              height: 10,
            }}
          >
            <Text style={{ bold: true, color: 'yellow' }}>Activity Log:</Text>
            {() =>
              keyLog.value.length === 0 ? (
                <Text style={{ dim: true }}>No activity yet...</Text>
              ) : (
                keyLog.value.map((l, i) => (
                  <Text key={i} style={{ dim: i < keyLog.value.length - 1 }}>
                    {l}
                  </Text>
                ))
              )
            }
          </Box>

          {/* Help */}
          <Box style={{ backgroundColor: 'blue', height: 1, paddingLeft: 1 }}>
            <Text style={{ color: 'white' }}>
              {() =>
                scope.value === 'header'
                  ? 'Enter: content mode | q: quit'
                  : 'Tab: switch focus | ↑↓: navigate list | Type in textarea | Esc: header'
              }
            </Text>
          </Box>
        </Box>

        {/* Parent input handler - runs first */}
        <ParentHandler scope={scope} log={log} />
      </MouseProvider>
    </FocusProvider>
  );
}

// Separate component for parent input handling
function ParentHandler({
  scope,
  log,
}: { scope: ReturnType<typeof signal<'header' | 'content'>>; log: (msg: string) => void }) {
  useInput((input, key) => {
    if (input === 'q') process.exit(0);

    if (scope.value === 'header') {
      if (key.return || key.downArrow) {
        scope.value = 'content';
        log('[Parent] -> content mode');
        return true;
      }
      // Consume all other input in header mode
      return true;
    }

    if (key.escape) {
      scope.value = 'header';
      log('[Parent] -> header mode');
      return true;
    }

    // In content mode, don't consume - let children handle
    return false;
  });

  return null;
}

await renderApp(() => InputTest(), { fps: 10, fullscreen: true });
