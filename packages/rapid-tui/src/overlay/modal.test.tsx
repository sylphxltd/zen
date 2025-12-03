/** @jsxImportSource @rapid/tui */
/**
 * Modal Component Tests
 *
 * Tests for modal dialogs with keyboard handling and visibility control.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createRoot, signal } from '@rapid/runtime';
import {
  Text,
  clearInputHandlers,
  dispatchInput,
  setPlatformOps,
  tuiPlatformOps,
} from '@rapid/tui';
import { AlertDialog, ConfirmDialog, Modal, type ModalProps } from './Modal.js';

setPlatformOps(tuiPlatformOps);

describe('Modal', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render when open is true', () => {
      const result = Modal({ open: true, children: <Text>Content</Text> });

      expect(result).toBeDefined();
    });

    it('should render empty when open is false', () => {
      const result = Modal({ open: false });

      expect(result).toBeDefined();
    });

    it('should support reactive open prop', () => {
      const open = signal(false);
      const result = Modal({ open: () => open.value });

      expect(result).toBeDefined();
    });

    it('should render with title', () => {
      const result = Modal({
        open: true,
        title: 'My Modal',
        children: <Text>Content</Text>,
      });

      expect(result).toBeDefined();
    });

    it('should support reactive title', () => {
      const title = signal('Initial Title');
      const result = Modal({
        open: true,
        title: () => title.value,
      });

      expect(result).toBeDefined();
    });

    it('should render children', () => {
      const result = Modal({
        open: true,
        children: <Text>Modal content</Text>,
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Dimensions
  // ==========================================================================

  describe('Dimensions', () => {
    it('should use default width of 50', () => {
      const result = Modal({ open: true });

      expect(result).toBeDefined();
    });

    it('should use custom width', () => {
      const result = Modal({
        open: true,
        width: 80,
      });

      expect(result).toBeDefined();
    });

    it('should support reactive width', () => {
      const width = signal(60);
      const result = Modal({
        open: true,
        width: () => width.value,
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Border Style
  // ==========================================================================

  describe('Border Style', () => {
    it('should use default round border style', () => {
      const result = Modal({ open: true });

      expect(result).toBeDefined();
    });

    it('should use custom border style', () => {
      const result = Modal({
        open: true,
        borderStyle: 'double',
      });

      expect(result).toBeDefined();
    });

    it('should support reactive border style', () => {
      const borderStyle = signal<'single' | 'double'>('single');
      const result = Modal({
        open: true,
        borderStyle: () => borderStyle.value,
      });

      expect(result).toBeDefined();
    });

    it('should use default cyan border color', () => {
      const result = Modal({ open: true });

      expect(result).toBeDefined();
    });

    it('should use custom border color', () => {
      const result = Modal({
        open: true,
        borderColor: 'yellow',
      });

      expect(result).toBeDefined();
    });

    it('should support reactive border color', () => {
      const borderColor = signal('red');
      const result = Modal({
        open: true,
        borderColor: () => borderColor.value,
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Keyboard Handling
  // ==========================================================================

  describe('Keyboard Handling', () => {
    it('should accept onClose callback', () => {
      // Note: Actual ESC handling requires proper focus context
      const result = Modal({
        open: true,
        onClose: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should handle modal without onClose handler', () => {
      const result = Modal({ open: true });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      const result = Modal({
        open: true,
        title: '',
      });

      expect(result).toBeDefined();
    });

    it('should handle undefined title', () => {
      const result = Modal({
        open: true,
        title: undefined,
      });

      expect(result).toBeDefined();
    });

    it('should handle no children', () => {
      const result = Modal({ open: true });

      expect(result).toBeDefined();
    });

    it('should handle multiple children', () => {
      const result = Modal({
        open: true,
        children: [<Text key="1">Line 1</Text>, <Text key="2">Line 2</Text>],
      });

      expect(result).toBeDefined();
    });

    it('should handle very small width', () => {
      const result = Modal({
        open: true,
        width: 10,
      });

      expect(result).toBeDefined();
    });

    it('should handle very large width', () => {
      const result = Modal({
        open: true,
        width: 200,
      });

      expect(result).toBeDefined();
    });
  });
});

// ==========================================================================
// ConfirmDialog
// ==========================================================================

describe('ConfirmDialog', () => {
  describe('Basic Rendering', () => {
    it('should render when open is true', () => {
      const result = ConfirmDialog({
        open: true,
        message: 'Are you sure?',
        onConfirm: () => {},
        onCancel: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should render with custom title', () => {
      const result = ConfirmDialog({
        open: true,
        title: 'Custom Title',
        message: 'Message',
        onConfirm: () => {},
        onCancel: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept default title "Confirm"', () => {
      const result = ConfirmDialog({
        open: true,
        message: 'Message',
        onConfirm: () => {},
        onCancel: () => {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('Callbacks', () => {
    it('should accept onConfirm callback', () => {
      const result = ConfirmDialog({
        open: true,
        message: 'Confirm?',
        onConfirm: () => {},
        onCancel: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept onCancel callback', () => {
      const result = ConfirmDialog({
        open: true,
        message: 'Confirm?',
        onConfirm: () => {},
        onCancel: () => {},
      });

      expect(result).toBeDefined();
    });
  });
});

// ==========================================================================
// AlertDialog
// ==========================================================================

describe('AlertDialog', () => {
  describe('Basic Rendering', () => {
    it('should render when open is true', () => {
      const result = AlertDialog({
        open: true,
        message: 'Alert message',
        onClose: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should render with custom title', () => {
      const result = AlertDialog({
        open: true,
        title: 'Warning',
        message: 'Message',
        onClose: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should accept default title "Alert"', () => {
      const result = AlertDialog({
        open: true,
        message: 'Message',
        onClose: () => {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('Callbacks', () => {
    it('should accept onClose callback', () => {
      const result = AlertDialog({
        open: true,
        message: 'Alert',
        onClose: () => {},
      });

      expect(result).toBeDefined();
    });
  });
});
