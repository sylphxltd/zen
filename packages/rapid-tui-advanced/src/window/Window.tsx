/**
 * Window component - Draggable, resizable window with title bar
 */

import { Box, Text, computed, useMouseClick } from '@rapid/tui';
import type { WindowState } from './WindowManager.js';
import {
  $focusedWindowId,
  closeWindow,
  focusWindow,
  minimizeWindow,
  startDrag,
  toggleMaximize,
} from './WindowManager.js';

export interface WindowProps {
  window: WindowState;
  children?: any;
}

export function Window(props: WindowProps) {
  const win: WindowState = props.window;
  const { children } = props;

  const isFocused = computed(() => $focusedWindowId.value === win.id);

  // Title bar colors based on focus
  const titleBarBg = () => (isFocused.value ? 'blue' : 'gray');
  const titleBarFg = () => (isFocused.value ? 'white' : 'white');
  const borderColor = () => (isFocused.value ? 'blue' : 'gray');

  // Handle window click to focus
  const windowX = win.x;
  const windowY = win.y;
  const windowWidth = win.width;
  const windowHeight = win.height;
  const windowId = win.id;

  useMouseClick((clickX, clickY, _button, _modifiers) => {
    if (
      clickX >= windowX &&
      clickX < windowX + windowWidth &&
      clickY >= windowY &&
      clickY < windowY + windowHeight
    ) {
      focusWindow(windowId);
    }
  });

  // Don't render minimized windows
  if (win.isMinimized) {
    return null;
  }

  return (
    <Box
      position="absolute"
      left={win.x}
      top={win.y}
      width={win.width}
      height={win.height}
      flexDirection="column"
      borderStyle="single"
      borderColor={borderColor}
    >
      {/* Title Bar */}
      <Box height={1} backgroundColor={titleBarBg} justifyContent="space-between" paddingX={1}>
        {/* Window Icon and Title */}
        <Box gap={1}>
          <Text color={titleBarFg}>{win.icon}</Text>
          <Text color={titleBarFg} bold>
            {win.title.length > win.width - 15
              ? `${win.title.slice(0, win.width - 18)}...`
              : win.title}
          </Text>
        </Box>

        {/* Window Controls */}
        <Box gap={1}>
          <Text color="yellow" onClick={() => minimizeWindow(win.id)}>
            ─
          </Text>
          <Text color="green" onClick={() => toggleMaximize(win.id)}>
            □
          </Text>
          <Text color="red" onClick={() => closeWindow(win.id)}>
            ✕
          </Text>
        </Box>
      </Box>

      {/* Window Content */}
      <Box flex={1} flexDirection="column" padding={1}>
        {children}
      </Box>

      {/* Resize Handle (bottom-right corner) */}
      <Box position="absolute" right={0} bottom={0}>
        <Text color="gray" dimColor>
          ◢
        </Text>
      </Box>
    </Box>
  );
}
