/** @jsxImportSource @zen/tui */
/**
 * ZenOS v2 - Composable TUI Demo
 *
 * Demonstrates the new declarative, composable API:
 * - FullscreenLayout (instead of render option)
 * - MouseProvider (instead of render option)
 * - Pressable, Draggable, Hoverable components
 * - No coordinate calculations!
 */

import { batch, signal } from '@zen/signal';
import {
  Box,
  Divider,
  Text,
  renderApp,
  FullscreenLayout,
  MouseProvider,
  Pressable,
  Draggable,
  Hoverable,
  useInput,
} from '@zen/tui';

// ============================================================================
// Types
// ============================================================================

interface WindowState {
  id: string;
  title: string;
  icon: string;
  app: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

// ============================================================================
// Global State
// ============================================================================

const $windows = signal<WindowState[]>([]);
const $focused = signal<string | null>(null);
let nextZIndex = 1;

// ============================================================================
// Window Management
// ============================================================================

function openWindow(app: string) {
  const configs: Record<string, { title: string; icon: string; width: number; height: number }> = {
    terminal: { title: 'Terminal', icon: '🖥️', width: 45, height: 12 },
    files: { title: 'Files', icon: '📁', width: 40, height: 10 },
    calc: { title: 'Calculator', icon: '🧮', width: 25, height: 10 },
    settings: { title: 'Settings', icon: '⚙️', width: 35, height: 10 },
    about: { title: 'About', icon: 'ℹ️', width: 35, height: 8 },
  };
  const cfg = configs[app] || { title: app, icon: '📦', width: 30, height: 8 };
  const id = `w${Date.now()}`;

  const offset = ($windows.value.length % 5) * 3;
  const x = 15 + offset;
  const y = 3 + offset;

  batch(() => {
    $windows.value = [
      ...$windows.value,
      { id, ...cfg, app, x, y, zIndex: nextZIndex++ },
    ];
    $focused.value = id;
  });
}

function closeWindow(id: string) {
  batch(() => {
    $windows.value = $windows.value.filter((w) => w.id !== id);
    if ($focused.value === id) {
      const remaining = $windows.value;
      if (remaining.length > 0) {
        const topWindow = remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
        $focused.value = topWindow.id;
      } else {
        $focused.value = null;
      }
    }
  });
}

function focusWindow(id: string) {
  const win = $windows.value.find((w) => w.id === id);
  if (!win || $focused.value === id) return;

  batch(() => {
    $windows.value = $windows.value.map((w) =>
      w.id === id ? { ...w, zIndex: nextZIndex++ } : w
    );
    $focused.value = id;
  });
}

function moveWindow(id: string, x: number, y: number) {
  $windows.value = $windows.value.map((w) =>
    w.id === id ? { ...w, x: Math.max(0, x), y: Math.max(2, y) } : w
  );
}

// ============================================================================
// App Contents
// ============================================================================

function TerminalContent() {
  return (
    <Box style={{ flexDirection: 'column' }}>
      <Text style={{ color: 'green' }}>$ neofetch</Text>
      <Text style={{ color: 'cyan' }}>███████╗███████╗███╗ ██╗</Text>
      <Text style={{ color: 'cyan' }}>╚══███╔╝██╔════╝████╗ ██║</Text>
      <Text style={{ color: 'cyan' }}> ███╔╝ █████╗ ██╔██╗ ██║</Text>
      <Text style={{ color: 'cyan' }}> ███╔╝ ██╔══╝ ██║╚██╗██║</Text>
      <Text style={{ color: 'cyan' }}>███████╗███████╗██║ ╚████║</Text>
      <Text style={{ color: 'cyan' }}>╚══════╝╚══════╝╚═╝ ╚═══╝</Text>
      <Text style={{ color: 'green' }}>$ _</Text>
    </Box>
  );
}

function FilesContent() {
  return (
    <Box style={{ flexDirection: 'column' }}>
      <Text style={{ color: 'yellow' }}>📍 /home/user</Text>
      <Text style={{ color: 'cyan' }}>📁 Desktop</Text>
      <Text style={{ color: 'cyan' }}>📁 Documents</Text>
      <Text style={{ color: 'cyan' }}>📁 Downloads</Text>
      <Text>📄 readme.md</Text>
      <Text>📄 config.json</Text>
    </Box>
  );
}

function CalcContent() {
  return (
    <Box style={{ flexDirection: 'column' }}>
      <Box style={{ backgroundColor: 'black', paddingLeft: 1, paddingRight: 1, marginBottom: 1 }}>
        <Text style={{ color: 'green' }}>0</Text>
      </Box>
      <Text style={{ color: 'gray' }}>┌───┬───┬───┬───┐</Text>
      <Text style={{ color: 'gray' }}>│ 7 │ 8 │ 9 │ ÷ │</Text>
      <Text style={{ color: 'gray' }}>├───┼───┼───┼───┤</Text>
      <Text style={{ color: 'gray' }}>│ 4 │ 5 │ 6 │ × │</Text>
      <Text style={{ color: 'gray' }}>└───┴───┴───┴───┘</Text>
    </Box>
  );
}

function SettingsContent() {
  return (
    <Box style={{ flexDirection: 'column' }}>
      <Text>🌙 Dark Mode: <Text style={{ color: 'green' }}>ON</Text></Text>
      <Text>🔊 Sounds: <Text style={{ color: 'green' }}>ON</Text></Text>
      <Text>📶 WiFi: <Text style={{ color: 'green' }}>Connected</Text></Text>
      <Text>🔵 Bluetooth: <Text style={{ color: 'red' }}>OFF</Text></Text>
      <Text>🔋 Battery: <Text style={{ color: 'green' }}>98%</Text></Text>
    </Box>
  );
}

function AboutContent() {
  return (
    <Box style={{ flexDirection: 'column', alignItems: 'center' }}>
      <Text style={{ color: 'cyan', bold: true }}>🌟 ZenOS v2.0</Text>
      <Text> </Text>
      <Text>Built with @zen/tui</Text>
      <Text style={{ dim: true }}>Composable Terminal UI</Text>
    </Box>
  );
}

function getAppContent(app: string) {
  switch (app) {
    case 'terminal': return <TerminalContent />;
    case 'files': return <FilesContent />;
    case 'calc': return <CalcContent />;
    case 'settings': return <SettingsContent />;
    case 'about': return <AboutContent />;
    default: return <Text>Unknown App</Text>;
  }
}

// ============================================================================
// Desktop Icon - Composable!
// ============================================================================

function DesktopIcon({ icon, label, onOpen }: { icon: string; label: string; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen}>
      <Hoverable>
        {(isHovered) => (
          <Box style={{
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 1,
            backgroundColor: isHovered ? 'blue' : undefined,
          }}>
            <Text>{icon}</Text>
            <Text style={{ dim: !isHovered }}>{label}</Text>
          </Box>
        )}
      </Hoverable>
    </Pressable>
  );
}

// ============================================================================
// Window - Composable!
// ============================================================================

function Window({ win }: { win: WindowState }) {
  const isFocused = () => $focused.value === win.id;

  return (
    <Draggable
      onDragStart={() => {
        focusWindow(win.id);
        return true;
      }}
      onDrag={(e) => moveWindow(win.id, e.x - 10, e.y - 1)}
    >
      <Pressable onPress={() => focusWindow(win.id)}>
        <Box
          style={{
            position: 'absolute',
            left: win.x,
            top: win.y,
            width: win.width,
            height: win.height,
            zIndex: win.zIndex,
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: () => (isFocused() ? 'cyan' : 'gray'),
          }}
        >
          {/* Title bar */}
          <Box
            style={{
              backgroundColor: () => (isFocused() ? 'blue' : 'gray'),
              paddingLeft: 1,
              paddingRight: 1,
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: 'white', bold: true }}>
              {win.icon} {win.title}
            </Text>
            <Pressable onPress={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}>
              <Text style={{ color: 'red' }}>✕</Text>
            </Pressable>
          </Box>

          {/* Content */}
          <Box style={{ padding: 1, flex: 1 }}>
            {getAppContent(win.app)}
          </Box>
        </Box>
      </Pressable>
    </Draggable>
  );
}

// ============================================================================
// Main App
// ============================================================================

function ZenOS() {
  const icons = [
    { app: 'terminal', icon: '🖥️', name: 'Terminal' },
    { app: 'files', icon: '📁', name: 'Files' },
    { app: 'calc', icon: '🧮', name: 'Calc' },
    { app: 'settings', icon: '⚙️', name: 'Settings' },
    { app: 'about', icon: 'ℹ️', name: 'About' },
  ];

  // Keyboard shortcuts
  useInput((_input, key) => {
    if (key.escape) {
      const focusedId = $focused.value;
      if (focusedId) closeWindow(focusedId);
    }
    if (key.tab && $windows.value.length > 1) {
      const sorted = [...$windows.value].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sorted.findIndex((w) => w.id === $focused.value);
      const nextIndex = (currentIndex + 1) % sorted.length;
      focusWindow(sorted[nextIndex].id);
    }
  });

  return (
    <FullscreenLayout>
      <MouseProvider>
        <Box style={{ flexDirection: 'column', flex: 1 }}>
          {/* Menu Bar */}
          <Box style={{ backgroundColor: 'gray', paddingLeft: 1, paddingRight: 1, justifyContent: 'space-between' }}>
            <Box style={{ flexDirection: 'row', gap: 2 }}>
              <Text style={{ color: 'cyan', bold: true }}>🍎 ZenOS</Text>
              <Text style={{ color: 'white' }}>File</Text>
              <Text style={{ color: 'white' }}>Edit</Text>
              <Text style={{ color: 'white' }}>View</Text>
              <Text style={{ color: 'white' }}>Help</Text>
            </Box>
            <Text style={{ color: 'white' }}>🔊 📶 🔋98%</Text>
          </Box>

          <Divider />

          {/* Main Area */}
          <Box style={{ flex: 1, flexDirection: 'row' }}>
            {/* Desktop Icons - declarative! */}
            <Box style={{ flexDirection: 'column', width: 12, padding: 1 }}>
              {icons.map((i) => (
                <DesktopIcon
                  key={i.app}
                  icon={i.icon}
                  label={i.name}
                  onOpen={() => openWindow(i.app)}
                />
              ))}
            </Box>

            {/* Windows Area */}
            <Box style={{ flex: 1, position: 'relative' }}>
              {/* Help text when no windows */}
              {() => $windows.value.length === 0 ? (
                <Box style={{ flexDirection: 'column', padding: 2 }}>
                  <Text style={{ color: 'gray', bold: true }}>Welcome to ZenOS v2!</Text>
                  <Text> </Text>
                  <Text style={{ color: 'cyan' }}>Click desktop icons to open apps</Text>
                  <Text style={{ color: 'yellow' }}>Drag window title bar to move</Text>
                  <Text style={{ color: 'green' }}>Click windows to focus</Text>
                  <Text style={{ dim: true }}>Tab to cycle • Esc to close • q to quit</Text>
                </Box>
              ) : null}

              {/* Render all windows */}
              {() => $windows.value.map((win) => <Window win={win} key={win.id} />)}
            </Box>
          </Box>

          {/* TaskBar */}
          <Box style={{ backgroundColor: 'gray', paddingLeft: 1, paddingRight: 1, height: 1 }}>
            <Text style={{ color: 'white', bold: true }}>🚀 Start</Text>
            <Text style={{ color: 'gray' }}> │</Text>
            {() => $windows.value.map((w) => (
              <Pressable key={w.id} onPress={() => focusWindow(w.id)}>
                <Text style={{ color: () => ($focused.value === w.id ? 'cyan' : 'white') }}>
                  {' '}{w.icon}{w.title}
                </Text>
              </Pressable>
            ))}
          </Box>
        </Box>
      </MouseProvider>
    </FullscreenLayout>
  );
}

// ============================================================================
// Start - Clean new API!
// ============================================================================

await renderApp(() => <ZenOS />);
