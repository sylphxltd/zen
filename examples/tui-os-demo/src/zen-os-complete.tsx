/** @jsxImportSource @zen/tui */
/**
 * ZenOS - Complete Desktop Operating System
 *
 * Full-featured OS simulation with:
 * - Drag & drop windows
 * - Calculator
 * - Terminal
 * - Text Editor
 * - File Manager
 * - Desktop icons
 * - Taskbar
 * - Mouse interaction
 */

import { Box, Draggable, Hoverable, MouseProvider, Pressable, Text, signal } from '@zen/tui';
import {
  $focusedWindowId,
  $sortedWindows,
  $taskbarItems,
  Window,
  closeWindow,
  focusWindow,
  minimizeWindow,
  openWindow,
  toggleMaximize,
} from '@zen/tui-advanced';
import { Calculator } from './apps/Calculator.js';
import { FileManager } from './apps/FileManager.js';
import { Terminal } from './apps/Terminal.js';
import { TextEditor } from './apps/TextEditor.js';

interface DesktopIcon {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  app: string;
}

function ZenOS() {
  const time = signal(new Date().toLocaleTimeString());

  // Update time every second
  setInterval(() => {
    time.value = new Date().toLocaleTimeString();
  }, 1000);

  // Desktop icons
  const desktopIcons: DesktopIcon[] = [
    { id: 'calc', label: 'Calculator', icon: '🔢', x: 2, y: 2, app: 'calculator' },
    { id: 'term', label: 'Terminal', icon: '💻', x: 2, y: 8, app: 'terminal' },
    { id: 'edit', label: 'Text Editor', icon: '📝', x: 2, y: 14, app: 'editor' },
    { id: 'files', label: 'Files', icon: '📁', x: 2, y: 20, app: 'files' },
  ];

  const launchApp = (app: string) => {
    const configs: Record<string, any> = {
      calculator: {
        title: 'Calculator',
        icon: '🔢',
        width: 30,
        height: 22,
        x: 10,
        y: 3,
      },
      terminal: {
        title: 'Terminal',
        icon: '💻',
        width: 60,
        height: 25,
        x: 15,
        y: 5,
      },
      editor: {
        title: 'Text Editor',
        icon: '📝',
        width: 65,
        height: 28,
        x: 20,
        y: 4,
      },
      files: {
        title: 'File Manager',
        icon: '📁',
        width: 70,
        height: 26,
        x: 12,
        y: 6,
      },
    };

    if (configs[app]) {
      openWindow(app, configs[app]);
    }
  };

  const getAppContent = (app: string) => {
    switch (app) {
      case 'calculator':
        return <Calculator />;
      case 'terminal':
        return <Terminal />;
      case 'editor':
        return <TextEditor />;
      case 'files':
        return <FileManager />;
      default:
        return <Text>Unknown app: {app}</Text>;
    }
  };

  return (
    <MouseProvider>
      <Box width="100%" height="100%" backgroundColor="blue" flexDirection="column">
        {/* Desktop area */}
        <Box flexGrow={1} position="relative">
          {/* Desktop background pattern */}
          <Box position="absolute" top={0} left={0} right={0} bottom={0}>
            <Text dimColor>⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀</Text>
          </Box>

          {/* Desktop icons */}
          {desktopIcons.map((iconData) => (
            <Box key={iconData.id} position="absolute" left={iconData.x} top={iconData.y}>
              <Pressable onPress={() => launchApp(iconData.app)}>
                <Hoverable>
                  {(isHovered) => (
                    <Box
                      width={12}
                      height={5}
                      borderStyle={isHovered ? 'single' : undefined}
                      borderColor="cyan"
                      backgroundColor={isHovered ? 'blue' : undefined}
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      padding={1}
                    >
                      <Text>{iconData.icon}</Text>
                      <Text>{iconData.label}</Text>
                    </Box>
                  )}
                </Hoverable>
              </Pressable>
            </Box>
          ))}

          {/* Windows */}
          {() =>
            $sortedWindows.value.map((window) => (
              <Window key={window.id} window={window}>
                {getAppContent(window.app)}
              </Window>
            ))
          }
        </Box>

        {/* Taskbar */}
        <Box
          height={3}
          backgroundColor="black"
          borderStyle="double"
          borderColor="cyan"
          flexDirection="row"
          alignItems="center"
          paddingX={1}
          gap={1}
        >
          {/* Start button */}
          <Pressable onPress={() => {}}>
            <Hoverable>
              {(isHovered) => (
                <Box
                  paddingX={2}
                  paddingY={1}
                  backgroundColor={isHovered ? 'cyan' : 'blue'}
                  borderStyle="single"
                >
                  <Text bold>🚀 ZenOS</Text>
                </Box>
              )}
            </Hoverable>
          </Pressable>

          {/* Running apps */}
          {() =>
            $taskbarItems.value.map((item) => {
              const isFocused = $focusedWindowId.value === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (item.isMinimized) {
                      toggleMaximize(item.id);
                    }
                    focusWindow(item.id);
                  }}
                >
                  <Hoverable>
                    {(isHovered) => (
                      <Box
                        paddingX={2}
                        backgroundColor={isFocused ? 'cyan' : isHovered ? 'blue' : 'gray'}
                        borderStyle="single"
                        borderColor={isFocused ? 'white' : 'gray'}
                      >
                        <Text color={isFocused ? 'black' : 'white'}>
                          {item.icon} {item.title}
                        </Text>
                      </Box>
                    )}
                  </Hoverable>
                </Pressable>
              );
            })
          }

          {/* Spacer */}
          <Box flexGrow={1} />

          {/* System tray */}
          <Box flexDirection="row" gap={2} paddingX={2}>
            <Text>🔊</Text>
            <Text>📶</Text>
            <Text>🔋</Text>
            <Text color="cyan" bold>
              {() => time.value}
            </Text>
          </Box>
        </Box>
      </Box>
    </MouseProvider>
  );
}

// Run the OS
import { renderApp } from '@zen/tui';

await renderApp(() => ZenOS(), {
  fps: 10,
  fullscreen: true,
  mouse: true,
});
