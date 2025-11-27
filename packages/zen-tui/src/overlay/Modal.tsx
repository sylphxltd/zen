/** @jsxImportSource @zen/tui */
/**
 * Modal Component
 *
 * A centered overlay dialog for displaying important information or getting user input.
 * Supports keyboard navigation (ESC to close).
 */

import { type MaybeReactive, Show, resolve } from '@zen/runtime';
import { signal } from '@zen/signal';
import { useInput } from '../hooks/useInput.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';

export interface ModalButton {
  label: string;
  onClick: () => void;
  /** Primary button gets highlighted */
  primary?: boolean;
  /** Keyboard shortcut hint (displayed after label) */
  shortcut?: string;
}

export interface ModalProps {
  /** Whether the modal is visible - supports MaybeReactive */
  open: MaybeReactive<boolean>;
  /** Modal title - supports MaybeReactive */
  title?: MaybeReactive<string>;
  /** Modal content - can be string or JSX */
  children?: any;
  /** Close handler (called when ESC is pressed or overlay is clicked) */
  onClose?: () => void;
  /** Modal width (default: 50) - supports MaybeReactive */
  width?: MaybeReactive<number>;
  /** Border style (default: 'round') - supports MaybeReactive */
  borderStyle?: MaybeReactive<'single' | 'double' | 'round' | 'bold'>;
  /** Border color - supports MaybeReactive */
  borderColor?: MaybeReactive<string>;
}

/**
 * Modal Component
 *
 * @example
 * ```tsx
 * const showModal = signal(false);
 *
 * <Modal
 *   open={showModal.value}
 *   title="My Modal"
 *   onClose={() => showModal.value = false}
 * >
 *   <Text>Modal content here</Text>
 * </Modal>
 * ```
 */
export function Modal(props: ModalProps) {
  const { children, onClose } = props;

  // Get terminal size for centering
  const { width: termWidth, height: termHeight } = useTerminalSize();

  // Resolve reactive props
  const getOpen = () => resolve(props.open);
  const getTitle = () => resolve(props.title);
  const getWidth = () => resolve(props.width) ?? 50;
  const getBorderStyle = () => resolve(props.borderStyle) ?? 'round';
  const getBorderColor = () => resolve(props.borderColor) ?? 'cyan';

  // Handle keyboard input
  useInput((_input, key) => {
    if (!getOpen()) return;

    // ESC to close
    if (key.escape && onClose) {
      onClose();
      return;
    }
  });

  // Don't render if not open
  if (!getOpen()) {
    return <Box style={{ width: 0, height: 0 }} />;
  }

  const title = getTitle();
  const width = getWidth();
  const borderStyle = getBorderStyle();
  const borderColor = getBorderColor();

  return (
    <Box
      style={{
        width: termWidth,
        height: termHeight,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        style={{
          width,
          borderStyle,
          borderColor,
          flexDirection: 'column',
          padding: 1,
        }}
      >
        {/* Title */}
        <Show when={title}>
          <Text style={{ bold: true, color: borderColor }}>{title}</Text>
          <Text> </Text>
        </Show>

        {/* Content */}
        <Box style={{ flexDirection: 'column' }}>{children}</Box>
      </Box>
    </Box>
  );
}

/**
 * Confirmation Dialog - simplified modal for yes/no questions
 */
export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, title = 'Confirm', message, onConfirm, onCancel } = props;

  useInput((input, key) => {
    if (!open) return;
    if (input === 'y' || input === 'Y') onConfirm();
    if (input === 'n' || input === 'N' || key.escape) onCancel();
  });

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <Text>{message}</Text>
      <Text> </Text>
      <Text style={{ dim: true }}>[Y]es / [N]o</Text>
    </Modal>
  );
}

/**
 * Alert Dialog - simple message dialog with OK button
 */
export interface AlertDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export function AlertDialog(props: AlertDialogProps) {
  const { open, title = 'Alert', message, onClose } = props;

  useInput((_input, key) => {
    if (!open) return;
    if (key.return || key.escape) onClose();
  });

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <Text>{message}</Text>
      <Text> </Text>
      <Text style={{ dim: true }}>Press Enter to close</Text>
    </Modal>
  );
}
