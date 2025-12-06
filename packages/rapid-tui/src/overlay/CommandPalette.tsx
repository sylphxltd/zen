/** @jsxImportSource @rapid/tui */
/**
 * Command Palette Component
 *
 * A searchable command palette like VSCode's Ctrl+P.
 * Supports keyboard navigation and fuzzy filtering.
 */

import { For, Show } from '@rapid/runtime';
import { computed, signal } from '@rapid/signal';
import type { TUIJSXElement, TUINode } from '../core/types.js';
import { useInput } from '../hooks/useInput.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';

export interface Command {
  /** Unique command ID */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional keyboard shortcut hint */
  shortcut?: string;
  /** Optional category for grouping */
  category?: string;
  /** Handler when command is executed */
  handler: () => void;
}

export interface CommandPaletteProps {
  /** Whether the palette is visible */
  open: boolean;
  /** Available commands */
  commands: Command[];
  /** Close handler */
  onClose: () => void;
  /** Palette width (default: 60) */
  width?: number;
  /** Max visible items (default: 10) */
  maxItems?: number;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Border color */
  borderColor?: string;
}

/**
 * Simple fuzzy match - checks if all query characters appear in order
 */
function fuzzyMatch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  let queryIdx = 0;
  for (let i = 0; i < textLower.length && queryIdx < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIdx]) {
      queryIdx++;
    }
  }
  return queryIdx === queryLower.length;
}

/**
 * Command Palette Component
 *
 * @example
 * ```tsx
 * const showPalette = signal(false);
 * const commands = [
 *   { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', handler: () => save() },
 *   { id: 'open', label: 'Open File', shortcut: 'Ctrl+O', handler: () => open() },
 * ];
 *
 * <CommandPalette
 *   open={showPalette.value}
 *   commands={commands}
 *   onClose={() => showPalette.value = false}
 * />
 * ```
 */
export function CommandPalette(props: CommandPaletteProps): TUIJSXElement {
  const {
    open,
    commands,
    onClose,
    width = 60,
    maxItems = 10,
    placeholder = 'Type to search commands...',
    borderColor = 'cyan',
  } = props;

  // Search query
  const query = signal('');

  // Selected index
  const selectedIndex = signal(0);

  // Get terminal size
  const { width: termWidth, height: termHeight } = useTerminalSize();

  // Filtered commands based on query
  const filteredCommands = computed(() => {
    const q = query.value.trim();
    if (!q) return commands;

    return commands.filter(
      (cmd) =>
        fuzzyMatch(q, cmd.label) ||
        (cmd.description && fuzzyMatch(q, cmd.description)) ||
        (cmd.category && fuzzyMatch(q, cmd.category)),
    );
  });

  // Visible commands (limited to maxItems)
  const visibleCommands = computed(() => {
    return filteredCommands.value.slice(0, maxItems);
  });

  // Handle keyboard input
  useInput((input, key) => {
    if (!open) return;

    // ESC to close
    if (key.escape) {
      query.value = '';
      selectedIndex.value = 0;
      onClose();
      return;
    }

    // Arrow keys for navigation
    if (key.upArrow) {
      const len = visibleCommands.value.length;
      selectedIndex.value = len > 0 ? (selectedIndex.value - 1 + len) % len : 0;
      return;
    }
    if (key.downArrow) {
      const len = visibleCommands.value.length;
      selectedIndex.value = len > 0 ? (selectedIndex.value + 1) % len : 0;
      return;
    }

    // Enter to execute
    if (key.return) {
      const cmds = visibleCommands.value;
      if (cmds.length > 0 && selectedIndex.value < cmds.length) {
        const cmd = cmds[selectedIndex.value];
        query.value = '';
        selectedIndex.value = 0;
        onClose();
        cmd.handler();
      }
      return;
    }

    // Backspace
    if (key.backspace) {
      query.value = query.value.slice(0, -1);
      selectedIndex.value = 0;
      return;
    }

    // Tab - cycle through items
    if (key.tab) {
      const len = visibleCommands.value.length;
      if (key.shift) {
        selectedIndex.value = len > 0 ? (selectedIndex.value - 1 + len) % len : 0;
      } else {
        selectedIndex.value = len > 0 ? (selectedIndex.value + 1) % len : 0;
      }
      return;
    }

    // Regular character input
    if (input.length === 1 && !key.ctrl && !key.meta) {
      query.value += input;
      selectedIndex.value = 0;
    }
  });

  // Don't render if not open
  if (!open) {
    return <Box style={{ width: 0, height: 0 }} />;
  }

  return (
    <Box
      style={{
        width: termWidth,
        height: termHeight,
        flexDirection: 'column',
        alignItems: 'center',
        paddingY: 2,
      }}
    >
      <Box
        style={{
          width,
          borderStyle: 'round',
          borderColor,
          flexDirection: 'column',
        }}
      >
        {/* Search Input */}
        <Box style={{ padding: 1, paddingY: 0 }}>
          <Text style={{ color: 'cyan' }}>&gt; </Text>
          <Text>{() => query.value || placeholder}</Text>
          <Text style={{ color: 'cyan' }}>_</Text>
        </Box>

        {/* Divider */}
        <Text style={{ color: 'gray' }}>{'─'.repeat(width - 2)}</Text>

        {/* Command List */}
        <Show
          when={() => visibleCommands.value.length > 0}
          fallback={
            <Box style={{ padding: 1 }}>
              <Text style={{ dim: true }}>No commands found</Text>
            </Box>
          }
        >
          <For each={() => visibleCommands.value}>
            {(cmd, index) => {
              const isSelected = () => selectedIndex.value === index();
              return (
                <Box
                  style={{
                    paddingX: 1,
                    backgroundColor: () => (isSelected() ? 'blue' : undefined),
                  }}
                  onClick={() => {
                    query.value = '';
                    selectedIndex.value = 0;
                    onClose();
                    cmd.handler();
                  }}
                >
                  <Box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        color: () => (isSelected() ? 'white' : undefined),
                        bold: () => isSelected(),
                      }}
                    >
                      {cmd.label}
                    </Text>
                    <Show when={cmd.shortcut}>
                      <Text
                        style={{
                          dim: true,
                          color: () => (isSelected() ? 'white' : 'gray'),
                        }}
                      >
                        {cmd.shortcut}
                      </Text>
                    </Show>
                  </Box>
                  <Show when={cmd.description}>
                    <Text
                      style={{
                        dim: true,
                        color: () => (isSelected() ? 'white' : 'gray'),
                      }}
                    >
                      {cmd.description}
                    </Text>
                  </Show>
                </Box>
              );
            }}
          </For>
        </Show>

        {/* Footer hint */}
        <Text style={{ color: 'gray', padding: 1, paddingY: 0 }}>
          {() =>
            `${filteredCommands.value.length} commands · ↑↓ navigate · Enter select · ESC close`
          }
        </Text>
      </Box>
    </Box>
  );
}
