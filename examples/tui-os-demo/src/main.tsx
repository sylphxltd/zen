/** @jsxImportSource @rapid/tui */
/**
 * ZenOS - A macOS/Windows-like TUI Demo with Draggable Windows
 *
 * Features:
 * - Absolute positioned windows
 * - Drag & drop windows (keyboard-based)
 * - zIndex management (focus = top)
 * - Multiple apps
 */

import { batch, signal } from '@rapid/signal';
import { Box, Divider, Text, renderApp, useInput, useMouseDrag, useTerminalSize } from '@rapid/tui';

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
const $dragging = signal<{ windowId: string; offsetX: number; offsetY: number } | null>(null);
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

  // Cascade windows
  const offset = ($windows.value.length % 5) * 3;
  const x = 15 + offset;
  const y = 3 + offset;

  batch(() => {
    $windows.value = [
      ...$windows.value,
      {
        id,
        ...cfg,
        app,
        x,
        y,
        zIndex: nextZIndex++,
      },
    ];
    $focused.value = id;
  });
}

function closeWindow(id?: string) {
  const targetId = id || $focused.value;
  if (!targetId) return;

  batch(() => {
    $windows.value = $windows.value.filter((w) => w.id !== targetId);
    if ($focused.value === targetId) {
      // Focus next highest zIndex window
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
    // Bring to front
    $windows.value = $windows.value.map((w) => (w.id === id ? { ...w, zIndex: nextZIndex++ } : w));
    $focused.value = id;
  });
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
      <Text>
        🌙 Dark Mode: <Text style={{ color: 'green' }}>ON</Text>
      </Text>
      <Text>
        🔊 Sounds: <Text style={{ color: 'green' }}>ON</Text>
      </Text>
      <Text>
        📶 WiFi: <Text style={{ color: 'green' }}>Connected</Text>
      </Text>
      <Text>
        🔵 Bluetooth: <Text style={{ color: 'red' }}>OFF</Text>
      </Text>
      <Text>
        🔋 Battery: <Text style={{ color: 'green' }}>98%</Text>
      </Text>
    </Box>
  );
}

function AboutContent() {
  return (
    <Box style={{ flexDirection: 'column', alignItems: 'center' }}>
      <Text style={{ color: 'cyan', bold: true }}>🌟 ZenOS v1.0</Text>
      <Text> </Text>
      <Text>Built with @rapid/tui</Text>
      <Text style={{ dim: true }}>Reactive Terminal UI</Text>
    </Box>
  );
}

function getAppContent(app: string) {
  switch (app) {
    case 'terminal':
      return <TerminalContent />;
    case 'files':
      return <FilesContent />;
    case 'calc':
      return <CalcContent />;
    case 'settings':
      return <SettingsContent />;
    case 'about':
      return <AboutContent />;
    default:
      return <Text>Unknown App</Text>;
  }
}

// ============================================================================
// Window Component
// ============================================================================

function Window({ win }: { win: WindowState }) {
  const isFocused = () => $focused.value === win.id;
  const isDragging = () => $dragging.value?.windowId === win.id;

  return (
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
        borderColor: () => (isDragging() ? 'yellow' : isFocused() ? 'cyan' : 'gray'),
      }}
    >
      {/* Title bar */}
      <Box
        style={{
          backgroundColor: () => (isFocused() ? 'blue' : 'gray'),
          paddingLeft: 1,
          paddingRight: 1,
          justifyContent: 'space-between',
          flexDirection: 'row',
        }}
      >
        <Text style={{ color: 'white', bold: true }}>
          {win.icon} {win.title}
        </Text>
        <Box style={{ flexDirection: 'row', gap: 1 }}>
          {() => (isDragging() ? <Text style={{ color: 'yellow' }}>⬧</Text> : null)}
          <Text style={{ color: 'red' }}>✕</Text>
        </Box>
      </Box>
      {/* Content */}
      <Box style={{ padding: 1, flex: 1 }}>{getAppContent(win.app)}</Box>
    </Box>
  );
}

// ============================================================================
// Main App
// ============================================================================

function ZenOS() {
  const { width, height } = useTerminalSize();

  const icons = [
    { app: 'terminal', icon: '🖥️', name: 'Terminal' },
    { app: 'files', icon: '📁', name: 'Files' },
    { app: 'calc', icon: '🧮', name: 'Calc' },
    { app: 'settings', icon: '⚙️', name: 'Settings' },
    { app: 'about', icon: 'ℹ️', name: 'About' },
  ];

  // Keyboard shortcuts
  useInput((_input, key) => {
    // Window management
    if (key.escape) closeWindow();

    // Tab to cycle windows
    if (key.tab && $windows.value.length > 1) {
      const currentId = $focused.value;
      const sorted = [...$windows.value].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sorted.findIndex((w) => w.id === currentId);
      const nextIndex = (currentIndex + 1) % sorted.length;
      focusWindow(sorted[nextIndex].id);
    }
  });

  // Mouse drag handling for window movement
  useMouseDrag({
    onDragStart: (x, y, button) => {
      if (button !== 'left') return false;

      // Find window under cursor (top-most first)
      const sorted = [...$windows.value].sort((a, b) => b.zIndex - a.zIndex);
      for (const win of sorted) {
        // Check if click is on title bar (first row of window)
        if (
          x >= win.x &&
          x < win.x + win.width &&
          y === win.y + 1 // Title bar is inside border
        ) {
          // Check if click is on close button (skip drag)
          if (x >= win.x + win.width - 3) {
            closeWindow(win.id);
            return false;
          }

          // Start dragging
          focusWindow(win.id);
          $dragging.value = {
            windowId: win.id,
            offsetX: x - win.x,
            offsetY: y - win.y,
          };
          return true;
        }

        // Click inside window but not title bar - just focus
        if (x >= win.x && x < win.x + win.width && y >= win.y && y < win.y + win.height) {
          focusWindow(win.id);
          return false;
        }
      }
      return false;
    },
    onDragMove: (x, y) => {
      const drag = $dragging.value;
      if (!drag) return;

      // Update window position
      $windows.value = $windows.value.map((w) =>
        w.id === drag.windowId
          ? {
              ...w,
              x: Math.max(0, x - drag.offsetX),
              y: Math.max(2, y - drag.offsetY), // Keep below menu bar
            }
          : w,
      );
    },
    onDragEnd: () => {
      $dragging.value = null;
    },
  });

  return (
    <Box style={{ flexDirection: 'column', width, height }}>
      {/* Menu Bar */}
      <Box
        style={{
          backgroundColor: 'gray',
          paddingLeft: 1,
          paddingRight: 1,
          justifyContent: 'space-between',
        }}
      >
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

      {/* Main Area - Relative container for absolute windows */}
      <Box style={{ flex: 1, flexDirection: 'row' }}>
        {/* Desktop Icons - clickable! */}
        <Box style={{ flexDirection: 'column', width: 12, padding: 1 }}>
          {icons.map((i) => (
            <Box
              style={{ flexDirection: 'column', alignItems: 'center', marginBottom: 1 }}
              key={i.app}
              onClick={() => openWindow(i.app)}
            >
              <Text>{i.icon}</Text>
              <Text style={{ dim: true }}>{i.name}</Text>
            </Box>
          ))}
        </Box>

        {/* Windows Area */}
        <Box style={{ flex: 1, position: 'relative' }}>
          {/* Help text when no windows */}
          {() =>
            $windows.value.length === 0 ? (
              <Box style={{ flexDirection: 'column', padding: 2 }}>
                <Text style={{ color: 'gray', bold: true }}>Welcome to ZenOS!</Text>
                <Text> </Text>
                <Text style={{ color: 'cyan' }}>Click desktop icons to open apps</Text>
                <Text style={{ color: 'yellow' }}>Drag window title bar to move</Text>
                <Text style={{ color: 'green' }}>Click windows to focus</Text>
                <Text style={{ dim: true }}>Tab to cycle • Esc to close • q to quit</Text>
              </Box>
            ) : null
          }

          {/* Render all windows */}
          {() => $windows.value.map((win) => <Window win={win} key={win.id} />)}
        </Box>
      </Box>

      {/* TaskBar */}
      <Box style={{ backgroundColor: 'gray', paddingLeft: 1, paddingRight: 1, height: 1 }}>
        <Text style={{ color: 'white', bold: true }}>🚀 Start</Text>
        <Text style={{ color: 'gray' }}> │</Text>
        {() =>
          $windows.value.map((w) => (
            <Text style={{ color: () => ($focused.value === w.id ? 'cyan' : 'white') }} key={w.id}>
              {' '}
              {w.icon}
              {w.title}
            </Text>
          ))
        }
        {() => ($dragging.value ? <Text style={{ color: 'yellow' }}> [DRAGGING]</Text> : null)}
      </Box>
    </Box>
  );
}

// ============================================================================
// Start
// ============================================================================

await renderApp(() => <ZenOS />, { fullscreen: true, mouse: true });
