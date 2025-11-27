/** @jsxImportSource @zen/tui */
/**
 * Splitter Component
 *
 * Split terminal into multiple resizable panes (horizontal or vertical).
 * Essential for complex full-screen applications like file managers, IDEs, git UIs.
 *
 * Features:
 * - Horizontal/vertical orientation
 * - Fixed or percentage-based sizes
 * - Minimum size constraints
 * - Keyboard resize support
 * - Nested splitters
 *
 * @example
 * ```tsx
 * <Splitter orientation="horizontal" sizes={[30, 70]}>
 *   <Pane minSize={20}>
 *     <FileTree />
 *   </Pane>
 *   <Pane>
 *     <Editor />
 *   </Pane>
 * </Splitter>
 * ```
 */

import {
  Box,
  type MaybeReactive,
  type Signal,
  Text,
  computed,
  resolve,
  signal,
  useInput,
  useTerminalSize,
} from '@zen/tui';

export interface SplitterProps {
  /** Split direction - supports MaybeReactive */
  orientation?: MaybeReactive<'horizontal' | 'vertical'>;

  /** Initial sizes (percentage or fixed) - must sum to 100 if percentages - supports MaybeReactive */
  sizes?: MaybeReactive<number[]>;

  /** Show divider between panes - supports MaybeReactive */
  showDivider?: MaybeReactive<boolean>;

  /** Divider character - supports MaybeReactive */
  dividerChar?: MaybeReactive<string>;

  /** Allow keyboard resizing with [ and ] - supports MaybeReactive */
  resizable?: MaybeReactive<boolean>;

  /** Focus index for resize - supports MaybeReactive */
  focusedPane?: MaybeReactive<number>;

  /** Children must be Pane components */
  children?: any;
}

export interface PaneProps {
  /** Minimum size in cells */
  minSize?: number;

  /** Maximum size in cells */
  maxSize?: number;

  /** Pane content */
  children?: any;
}

/**
 * Pane Component
 *
 * Individual pane within a Splitter. Must be direct child of Splitter.
 * Note: Pane is a marker component - its children are extracted by Splitter.
 */
export function Pane(props: PaneProps) {
  // This function is actually never called directly in our pattern.
  // Splitter extracts pane.props.children and wraps them in its own Box.
  // We keep this for type safety and documentation purposes.
  const { children } = props;
  return <>{children}</>;
}

/**
 * Splitter Component
 *
 * Splits terminal into multiple resizable panes.
 */
export function Splitter(props: SplitterProps) {
  const { children } = props;

  // Resolve reactive props
  const getOrientation = () => resolve(props.orientation) ?? 'horizontal';
  const getInitialSizes = () => resolve(props.sizes);
  const getShowDivider = () => resolve(props.showDivider) ?? true;
  const getDividerChar = () => resolve(props.dividerChar);
  const getResizable = () => resolve(props.resizable) ?? true;
  const getExternalFocusedPane = () => resolve(props.focusedPane);

  const terminalSize = useTerminalSize();

  // Extract pane children
  const rawChildren = Array.isArray(children) ? children : children ? [children] : [];
  const panes = rawChildren.filter((child: any) => {
    // Check if this is a Pane component (either function or executed)
    return child?.type === 'box' || typeof child === 'object' || typeof child === 'function';
  });

  const paneCount = panes.length;

  // Initialize sizes
  const initialSizes = getInitialSizes();
  const internalSizes = signal<number[]>(
    initialSizes || Array(paneCount).fill(Math.floor(100 / paneCount)),
  );

  const externalFocusedPane = getExternalFocusedPane();
  const internalFocusedPane = signal(externalFocusedPane ?? 0);

  const focusedPane = computed(() => {
    const external = getExternalFocusedPane();
    return external !== undefined ? external : internalFocusedPane.value;
  });

  // Keyboard resize: use Ctrl+[ and Ctrl+] to avoid conflicts with regular input
  // Only active when resizable is true (no permanent input interception)
  useInput(
    (input, _key) => {
      if (!getResizable()) return false;

      const focused = focusedPane.value;
      const sizes = [...internalSizes.value];

      // Ctrl+[ to decrease focused pane
      // Ctrl+[ sends \x1b (escape) in some terminals, use Alt+[ (\x1b[) instead
      // Actually use Shift+[ ({) and Shift+] (}) for resize
      if (input === '{' && focused > 0) {
        const delta = 5;
        if (sizes[focused] - delta >= 5) {
          sizes[focused] -= delta;
          sizes[focused - 1] += delta;
          internalSizes.value = sizes;
        }
        return true;
      }
      if (input === '}' && focused < paneCount - 1) {
        const delta = 5;
        if (sizes[focused + 1] - delta >= 5) {
          sizes[focused] += delta;
          sizes[focused + 1] -= delta;
          internalSizes.value = sizes;
        }
        return true;
      }

      return false; // Don't consume other keys
    },
    { isActive: () => getResizable() },
  );

  // Use flex-based sizing for proper Yoga layout integration
  // sizes array represents flex ratios (e.g., [25, 75] means 1:3 ratio)
  // Render horizontal split
  if (getOrientation() === 'horizontal') {
    return (
      <Box flexDirection="row" width="100%" height="100%">
        {() => {
          const elements: any[] = [];
          const sizes = internalSizes.value;
          const showDivider = getShowDivider();
          const dividerChar = getDividerChar();
          const resizable = getResizable();

          panes.forEach((pane: any, index: number) => {
            const flexValue = sizes[index];
            const isFocused = index === focusedPane.value;
            const paneChildren = pane.props?.children ?? pane.children ?? pane;

            elements.push(
              <Box
                key={`pane-${index}`}
                style={{
                  flex: flexValue,
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'stretch',
                  overflow: 'hidden',
                  borderStyle: isFocused && resizable ? 'single' : undefined,
                  borderColor: isFocused ? 'cyan' : undefined,
                }}
              >
                {paneChildren}
              </Box>,
            );

            if (showDivider && index < paneCount - 1) {
              elements.push(
                <Box key={`divider-${index}`} width={1} flexDirection="column">
                  {() => <Text color="gray">{dividerChar || '│'}</Text>}
                </Box>,
              );
            }
          });
          return elements;
        }}
      </Box>
    );
  }

  // Render vertical split
  return (
    <Box flexDirection="column" width="100%" height="100%">
      {() => {
        const elements: any[] = [];
        const sizes = internalSizes.value;
        const showDivider = getShowDivider();
        const dividerChar = getDividerChar();
        const resizable = getResizable();

        panes.forEach((pane: any, index: number) => {
          const flexValue = sizes[index];
          const isFocused = index === focusedPane.value;

          elements.push(
            <Box
              key={`pane-${index}`}
              style={{
                flex: flexValue,
                flexDirection: 'column',
                overflow: 'hidden',
                borderStyle: isFocused && resizable ? 'single' : undefined,
                borderColor: isFocused ? 'cyan' : undefined,
              }}
            >
              {pane.props.children}
            </Box>,
          );

          if (showDivider && index < paneCount - 1) {
            elements.push(
              <Box key={`divider-${index}`} height={1}>
                {() => <Text color="gray">{dividerChar || '─'.repeat(terminalSize.columns)}</Text>}
              </Box>,
            );
          }
        });
        return elements;
      }}
    </Box>
  );
}
