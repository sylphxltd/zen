/** @jsxImportSource @zen/tui */
/**
 * MenuBar Component
 *
 * Top menu bar with keyboard shortcuts (F1-F12, Alt+key).
 * Common in classic TUI applications like nano, vim, htop, midnight commander.
 *
 * Features:
 * - Horizontal menu bar with items
 * - Keyboard shortcuts (F-keys, Alt+key)
 * - Visual highlighting on hover/active
 * - Dropdown menu support
 * - Separator support
 *
 * @example
 * ```tsx
 * <MenuBar
 *   items={[
 *     { label: 'File', key: 'F1', onSelect: () => console.log('File') },
 *     { label: 'Edit', key: 'F2', onSelect: () => console.log('Edit') },
 *     { label: 'View', key: 'F3', onSelect: () => console.log('View') },
 *   ]}
 * />
 * ```
 */

import { type MaybeReactive, Box, Text, resolve, signal, useInput } from '@zen/tui';

export interface MenuItemConfig {
  /** Menu item label */
  label: string;

  /** Keyboard shortcut (e.g., 'F1', 'F2', or character for Alt+key) */
  key?: string;

  /** Callback when item is selected */
  onSelect?: () => void;

  /** Disabled state */
  disabled?: boolean;

  /** Visual separator after this item */
  separator?: boolean;
}

export interface MenuBarProps {
  /** Menu items - supports MaybeReactive */
  items: MaybeReactive<MenuItemConfig[]>;

  /** Active/selected item index - supports MaybeReactive */
  activeIndex?: MaybeReactive<number>;

  /** Callback when active item changes */
  onActiveChange?: (index: number) => void;

  /** Background color - supports MaybeReactive */
  bgColor?: MaybeReactive<string>;

  /** Text color - supports MaybeReactive */
  textColor?: MaybeReactive<string>;

  /** Focus management - supports MaybeReactive */
  isFocused?: MaybeReactive<boolean>;
}

/**
 * MenuBar Component
 *
 * Horizontal menu bar with keyboard navigation.
 */
export function MenuBar(props: MenuBarProps) {
  const { onActiveChange } = props;

  // Resolve reactive props
  const getItems = () => resolve(props.items);
  const getExternalActiveIndex = () => resolve(props.activeIndex);
  const getBgColor = () => resolve(props.bgColor) ?? 'blue';
  const getTextColor = () => resolve(props.textColor) ?? 'white';
  const getIsFocused = () => resolve(props.isFocused) ?? true;

  // Internal state
  const externalActiveIndex = getExternalActiveIndex();
  const internalActiveIndex = signal(externalActiveIndex ?? -1);

  const getActiveIndex = () => {
    const external = getExternalActiveIndex();
    return external !== undefined ? external : internalActiveIndex.value;
  };

  // Handle keyboard input
  useInput(
    (input, key) => {
      if (!getIsFocused()) return;

      const items = getItems();
      const activeIndex = getActiveIndex();
      const externalActiveIndex = getExternalActiveIndex();

      // F-key shortcuts (F1-F12)
      const fKeyMatch = Object.keys(key).find((k) => k.startsWith('f') && key[k as keyof typeof key]);
      if (fKeyMatch) {
        const fNumber = Number.parseInt(fKeyMatch.slice(1), 10);
        const item = items.find((item) => item.key === fKeyMatch.toUpperCase());
        if (item && !item.disabled && item.onSelect) {
          item.onSelect();
        }
        return;
      }

      // Alt+key shortcuts
      if (key.meta || key.alt) {
        const item = items.find((item) => item.key?.toLowerCase() === input?.toLowerCase());
        if (item && !item.disabled && item.onSelect) {
          item.onSelect();
        }
        return;
      }

      // Arrow navigation
      if (key.leftArrow) {
        const newIndex = Math.max(0, activeIndex - 1);
        if (externalActiveIndex === undefined) {
          internalActiveIndex.value = newIndex;
        }
        if (onActiveChange) {
          onActiveChange(newIndex);
        }
      } else if (key.rightArrow) {
        const newIndex = Math.min(items.length - 1, activeIndex + 1);
        if (externalActiveIndex === undefined) {
          internalActiveIndex.value = newIndex;
        }
        if (onActiveChange) {
          onActiveChange(newIndex);
        }
      }

      // Enter to select current item
      if (key.return) {
        const item = items[activeIndex];
        if (item && !item.disabled && item.onSelect) {
          item.onSelect();
        }
      }

      // Number keys to select items
      if (input && /^[0-9]$/.test(input)) {
        const index = Number.parseInt(input, 10) - 1;
        if (index >= 0 && index < items.length) {
          const item = items[index];
          if (item && !item.disabled && item.onSelect) {
            item.onSelect();
          }
        }
      }
    },
    { isActive: () => getIsFocused() },
  );

  // Render menu bar
  return (
    <Box backgroundColor={() => getBgColor()} height={1} width="100%">
      <Box flexDirection="row" gap={1} paddingX={1}>
        {() => {
          const items = getItems();
          const activeIndex = getActiveIndex();
          const textColor = getTextColor();

          return items.map((item, index) => {
            const isActive = index === activeIndex;
            const isDisabled = item.disabled;

            return (
              <>
                <Box key={index} gap={1} flexDirection="row">
                  {/* Keyboard shortcut hint */}
                  {item.key && (
                    <Text
                      bold
                      color={isDisabled ? 'gray' : isActive ? 'yellow' : textColor}
                      backgroundColor={isActive ? 'cyan' : undefined}
                    >
                      {item.key}
                    </Text>
                  )}

                  {/* Menu label */}
                  <Text
                    color={isDisabled ? 'gray' : isActive ? 'black' : textColor}
                    backgroundColor={isActive ? 'cyan' : undefined}
                    bold={isActive}
                  >
                    {item.label}
                  </Text>
                </Box>

                {/* Separator */}
                {item.separator && index < items.length - 1 && (
                  <Text key={`sep-${index}`} color="gray">
                    │
                  </Text>
                )}
              </>
            );
          });
        }}
      </Box>
    </Box>
  );
}
