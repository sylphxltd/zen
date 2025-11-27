/** @jsxImportSource @zen/tui */
/**
 * List Component
 *
 * General-purpose list component with keyboard navigation.
 * Ink-compatible focus management via useFocus + useInput pattern.
 *
 * Features:
 * - Single selection or no selection
 * - Keyboard navigation (↑↓, j/k)
 * - Custom item rendering
 * - Scrolling support for large lists
 * - Optional selection indicator
 * - FocusProvider integration (Ink-compatible)
 */

import {
  type MaybeReactive,
  Box,
  Text,
  computed,
  resolve,
  signal,
  useFocus,
  useInput,
} from '@zen/tui';

export interface ListProps<T = unknown> {
  /** Array of items to display - supports MaybeReactive */
  items: MaybeReactive<T[]>;

  /** Initially selected index (default: 0) */
  initialIndex?: number;

  /** Current selected index (for controlled mode) */
  selectedIndex?: MaybeReactive<number>;

  /** Callback when selection changes (navigation or Enter) */
  onSelect?: (item: T, index: number) => void;

  /** Custom item renderer - returns a TUI node */
  // biome-ignore lint/suspicious/noExplicitAny: JSX return types vary by runtime
  renderItem?: (item: T, index: number, isSelected: boolean) => any;

  /** Maximum visible items (enables scrolling) */
  limit?: number;

  /** Show selection indicator (default: true) */
  showIndicator?: boolean;

  /** Selection indicator character (default: '>') */
  indicator?: string;

  /**
   * Focus ID for FocusProvider integration (optional)
   * When provided, uses useFocus() for focus management
   */
  focusId?: string;

  /** Auto-focus when FocusProvider mounts */
  autoFocus?: boolean;

  /**
   * External focus control - supports MaybeReactive<boolean>
   * When provided, overrides useFocus. Prefer focusId for FocusProvider pattern.
   */
  isFocused?: MaybeReactive<boolean>;
}

/**
 * List Component
 *
 * @example
 * ```tsx
 * <FocusProvider>
 *   <List
 *     focusId="file-list"
 *     items={files}
 *     onSelect={(file, index) => console.log('Selected:', file)}
 *     renderItem={(file, index, isSelected) => (
 *       <Text color={isSelected ? 'cyan' : 'white'}>{file}</Text>
 *     )}
 *   />
 * </FocusProvider>
 * ```
 */
export function List<T = unknown>(props: ListProps<T>) {
  const {
    items: itemsProp,
    initialIndex = 0,
    selectedIndex: externalSelectedIndex,
    onSelect,
    renderItem,
    limit,
    showIndicator = true,
    indicator = '>',
    focusId,
    autoFocus = false,
    isFocused: externalIsFocused,
  } = props;

  // Resolve items - supports MaybeReactive<T[]>
  const items = computed(() => resolve(itemsProp));

  // Focus integration with FocusProvider (Ink-compatible)
  // useFocus returns { isFocused: Computed<boolean> }
  // Only call useFocus if focusId is provided (FocusProvider pattern)
  const focusResult = focusId ? useFocus({ id: focusId, autoFocus }) : null;

  // Determine effective focus state:
  // 1. If externalIsFocused is provided, it acts as a GATE (must be true to be focused)
  // 2. If focusId is also provided, BOTH external AND FocusProvider must agree
  // 3. This allows parent to control "scope" while FocusProvider controls "which item"
  const effectiveFocused = computed(() => {
    // Check external gate first
    if (externalIsFocused !== undefined) {
      const externalActive = resolve(externalIsFocused);
      if (!externalActive) return false; // Gate is closed
    }

    // If using FocusProvider, check its focus state
    if (focusResult) {
      return focusResult.isFocused.value;
    }

    // Fallback: use external if provided, otherwise true
    if (externalIsFocused !== undefined) {
      return resolve(externalIsFocused);
    }
    return true; // Default focused when no focus management
  });

  // Internal state for uncontrolled mode
  const internalSelectedIndex = signal(initialIndex);
  const scrollOffset = signal(0);

  // Use external selectedIndex if provided (controlled), otherwise internal (uncontrolled)
  const selectedIndex = computed(() =>
    externalSelectedIndex !== undefined ? resolve(externalSelectedIndex) : internalSelectedIndex.value,
  );

  // Calculate visible window
  const visibleLimit = computed(() => limit ?? items.value.length);
  const visibleItems = computed(() => {
    const start = scrollOffset.value;
    const end = Math.min(start + visibleLimit.value, items.value.length);
    return items.value.slice(start, end);
  });

  // Handle keyboard input - ONLY when focused (Ink pattern)
  // When isFocused becomes false, handler is removed from registry
  useInput(
    (input, key) => {
      const currentItems = items.value;
      const currentIndex = selectedIndex.value;
      const currentVisibleLimit = visibleLimit.value;

      // Move up
      if (key.upArrow || input === 'k') {
        const newIndex = Math.max(0, currentIndex - 1);
        // Only update internal state if in uncontrolled mode
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = newIndex;
        }

        // Scroll up if needed
        if (limit && newIndex < scrollOffset.value) {
          scrollOffset.value = newIndex;
        }

        // Call onSelect if provided
        if (onSelect && newIndex !== currentIndex) {
          onSelect(currentItems[newIndex], newIndex);
        }
        return true; // consumed
      }

      // Move down
      if (key.downArrow || input === 'j') {
        const newIndex = Math.min(currentItems.length - 1, currentIndex + 1);
        // Only update internal state if in uncontrolled mode
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = newIndex;
        }

        // Scroll down if needed
        if (limit && newIndex >= scrollOffset.value + currentVisibleLimit) {
          scrollOffset.value = newIndex - currentVisibleLimit + 1;
        }

        // Call onSelect if provided
        if (onSelect && newIndex !== currentIndex) {
          onSelect(currentItems[newIndex], newIndex);
        }
        return true; // consumed
      }

      // Select current item (Enter)
      if (key.return && onSelect) {
        const index = selectedIndex.value;
        if (index >= 0 && index < currentItems.length) {
          onSelect(currentItems[index], index);
        }
        return true; // consumed
      }

      // Page up
      if (key.pageUp && limit) {
        const newIndex = Math.max(0, currentIndex - currentVisibleLimit);
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = newIndex;
        }
        scrollOffset.value = Math.max(0, scrollOffset.value - currentVisibleLimit);
        if (onSelect) {
          onSelect(currentItems[newIndex], newIndex);
        }
        return true; // consumed
      }

      // Page down
      if (key.pageDown && limit) {
        const newIndex = Math.min(currentItems.length - 1, currentIndex + currentVisibleLimit);
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = newIndex;
        }
        scrollOffset.value = Math.min(
          Math.max(0, currentItems.length - currentVisibleLimit),
          scrollOffset.value + currentVisibleLimit,
        );
        if (onSelect) {
          onSelect(currentItems[newIndex], newIndex);
        }
        return true; // consumed
      }

      // Home
      if (key.home) {
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = 0;
        }
        scrollOffset.value = 0;
        if (onSelect) {
          onSelect(currentItems[0], 0);
        }
        return true; // consumed
      }

      // End
      if (key.end) {
        const lastIndex = currentItems.length - 1;
        if (externalSelectedIndex === undefined) {
          internalSelectedIndex.value = lastIndex;
        }
        scrollOffset.value = Math.max(0, currentItems.length - currentVisibleLimit);
        if (onSelect) {
          onSelect(currentItems[lastIndex], lastIndex);
        }
        return true; // consumed
      }

      return false; // not consumed
    },
    // Use effectiveFocused for handler activation
    // Handler is removed when unfocused, added when focused
    { isActive: effectiveFocused },
  );

  // Default item renderer
  const defaultRenderItem = (item: T, _index: number, isSelected: boolean) => {
    return <Text style={{ color: isSelected ? 'cyan' : 'white' }}>{String(item)}</Text>;
  };

  const itemRenderer = renderItem || defaultRenderItem;

  return (
    <Box style={{ flexDirection: 'column' }}>
      {() =>
        visibleItems.value.map((item, localIndex) => {
          const globalIndex = scrollOffset.value + localIndex;
          const isSelected = globalIndex === selectedIndex.value;

          return (
            <Box key={globalIndex} style={{ flexDirection: 'row', gap: 1 }}>
              {showIndicator && (
                <Text style={{ color: isSelected ? 'cyan' : 'transparent' }}>
                  {isSelected ? indicator : ' '}
                </Text>
              )}
              {itemRenderer(item, globalIndex, isSelected)}
            </Box>
          );
        })
      }

      {/* Scroll indicator */}
      {() =>
        limit && items.value.length > limit ? (
          <Box style={{ marginTop: 1 }}>
            <Text style={{ dim: true }}>
              {() =>
                `${scrollOffset.value + 1}-${Math.min(scrollOffset.value + visibleLimit.value, items.value.length)} of ${items.value.length}`
              }
            </Text>
          </Box>
        ) : null
      }
    </Box>
  );
}
