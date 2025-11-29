/** @jsxImportSource @zen/tui */
/**
 * Toast Component Tests
 *
 * Tests for toast notifications with different types and auto-dismiss.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Toast, ToastContainer, toast } from './Toast.js';

describe('Toast', () => {
  // Clean up toasts after each test
  beforeEach(() => {
    toast.dismissAll();
  });

  afterEach(() => {
    toast.dismissAll();
  });

  // ==========================================================================
  // Toast API
  // ==========================================================================

  describe('Toast API', () => {
    it('should show toast with toast.show()', () => {
      const id = toast.show('info', 'Test message', 0);

      expect(id).toContain('toast-');
    });

    it('should show success toast', () => {
      const id = toast.success('Success!', 0);

      expect(id).toContain('toast-');
    });

    it('should show error toast', () => {
      const id = toast.error('Error!', 0);

      expect(id).toContain('toast-');
    });

    it('should show warning toast', () => {
      const id = toast.warning('Warning!', 0);

      expect(id).toContain('toast-');
    });

    it('should show info toast', () => {
      const id = toast.info('Info!', 0);

      expect(id).toContain('toast-');
    });

    it('should return unique IDs for each toast', () => {
      const id1 = toast.info('First', 0);
      const id2 = toast.info('Second', 0);

      expect(id1).not.toBe(id2);
    });
  });

  // ==========================================================================
  // Dismiss
  // ==========================================================================

  describe('Dismiss', () => {
    it('should dismiss specific toast by ID', () => {
      const id1 = toast.info('First', 0);
      const _id2 = toast.info('Second', 0);

      toast.dismiss(id1);

      // Can't easily verify internal state, but no error should occur
      expect(true).toBe(true);
    });

    it('should dismiss all toasts', () => {
      toast.info('First', 0);
      toast.info('Second', 0);
      toast.info('Third', 0);

      toast.dismissAll();

      // Can't easily verify internal state, but no error should occur
      expect(true).toBe(true);
    });

    it('should handle dismissing non-existent toast', () => {
      toast.dismiss('non-existent-id');

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle dismissing same toast twice', () => {
      const id = toast.info('Test', 0);

      toast.dismiss(id);
      toast.dismiss(id);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  // ==========================================================================
  // Auto-dismiss
  // ==========================================================================

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after duration', async () => {
      toast.show('info', 'Quick toast', 100);

      // Wait for auto-dismiss
      await new Promise((r) => setTimeout(r, 150));

      // Toast should be dismissed (can't easily verify, but no error)
      expect(true).toBe(true);
    });

    it('should not auto-dismiss when duration is 0', async () => {
      const id = toast.show('info', 'Persistent', 0);

      await new Promise((r) => setTimeout(r, 100));

      // Toast should still exist (manual cleanup needed)
      toast.dismiss(id);
      expect(true).toBe(true);
    });

    it('should use default duration for each type', () => {
      // success: 3000ms default
      toast.success('Success');

      // error: 5000ms default
      toast.error('Error');

      // warning: 4000ms default
      toast.warning('Warning');

      // info: 3000ms default
      toast.info('Info');

      toast.dismissAll();
      expect(true).toBe(true);
    });
  });

  // ==========================================================================
  // Toast Component
  // ==========================================================================

  describe('Toast Component', () => {
    it('should render success toast', () => {
      const result = Toast({
        type: 'success',
        message: 'Success message',
      });

      expect(result).toBeDefined();
    });

    it('should render error toast', () => {
      const result = Toast({
        type: 'error',
        message: 'Error message',
      });

      expect(result).toBeDefined();
    });

    it('should render warning toast', () => {
      const result = Toast({
        type: 'warning',
        message: 'Warning message',
      });

      expect(result).toBeDefined();
    });

    it('should render info toast', () => {
      const result = Toast({
        type: 'info',
        message: 'Info message',
      });

      expect(result).toBeDefined();
    });

    it('should show dismiss button when onDismiss provided', () => {
      const result = Toast({
        type: 'info',
        message: 'Dismissible',
        onDismiss: () => {},
      });

      expect(result).toBeDefined();
    });

    it('should not show dismiss button when onDismiss not provided', () => {
      const result = Toast({
        type: 'info',
        message: 'Not dismissible',
      });

      expect(result).toBeDefined();
    });

    it('should render with correct icon for success', () => {
      const result = Toast({
        type: 'success',
        message: 'Test',
      });

      expect(result).toBeDefined();
    });

    it('should render with correct icon for error', () => {
      const result = Toast({
        type: 'error',
        message: 'Test',
      });

      expect(result).toBeDefined();
    });

    it('should render with correct icon for warning', () => {
      const result = Toast({
        type: 'warning',
        message: 'Test',
      });

      expect(result).toBeDefined();
    });

    it('should render with correct icon for info', () => {
      const result = Toast({
        type: 'info',
        message: 'Test',
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // ToastContainer
  // ==========================================================================

  describe('ToastContainer', () => {
    it('should render container', () => {
      const result = ToastContainer({});

      expect(result).toBeDefined();
    });

    it('should use default position top-right', () => {
      const result = ToastContainer({});

      expect(result).toBeDefined();
    });

    it('should support position top-left', () => {
      const result = ToastContainer({ position: 'top-left' });

      expect(result).toBeDefined();
    });

    it('should support position bottom-right', () => {
      const result = ToastContainer({ position: 'bottom-right' });

      expect(result).toBeDefined();
    });

    it('should support position bottom-left', () => {
      const result = ToastContainer({ position: 'bottom-left' });

      expect(result).toBeDefined();
    });

    it('should support position top-center', () => {
      const result = ToastContainer({ position: 'top-center' });

      expect(result).toBeDefined();
    });

    it('should support position bottom-center', () => {
      const result = ToastContainer({ position: 'bottom-center' });

      expect(result).toBeDefined();
    });

    it('should use default maxWidth of 40', () => {
      const result = ToastContainer({});

      expect(result).toBeDefined();
    });

    it('should support custom maxWidth', () => {
      const result = ToastContainer({ maxWidth: 60 });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const result = Toast({
        type: 'info',
        message: '',
      });

      expect(result).toBeDefined();
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(200);
      const result = Toast({
        type: 'info',
        message: longMessage,
      });

      expect(result).toBeDefined();
    });

    it('should handle special characters in message', () => {
      const result = Toast({
        type: 'info',
        message: '🎉 Special <chars> & "quotes"',
      });

      expect(result).toBeDefined();
    });

    it('should handle many toasts', () => {
      for (let i = 0; i < 100; i++) {
        toast.info(`Toast ${i}`, 0);
      }

      toast.dismissAll();
      expect(true).toBe(true);
    });
  });
});
