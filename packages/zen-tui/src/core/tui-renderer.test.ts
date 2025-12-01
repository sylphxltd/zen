import { describe, expect, it, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { TUIRenderer, createTUIRenderer, registerMouseInterest } from './tui-renderer.js';
import { ESC } from './renderer/output-buffer.js';

describe('TUIRenderer', () => {
  describe('createTUIRenderer', () => {
    it('creates renderer with default options', () => {
      const renderer = createTUIRenderer();
      expect(renderer).toBeInstanceOf(TUIRenderer);
    });

    it('creates renderer with custom dimensions', () => {
      const renderer = createTUIRenderer({ width: 100, height: 50 });
      expect(renderer).toBeInstanceOf(TUIRenderer);
    });
  });

  describe('constructor', () => {
    it('uses provided dimensions', () => {
      const renderer = new TUIRenderer({ width: 120, height: 40 });
      expect(renderer).toBeInstanceOf(TUIRenderer);
    });

    it('defaults to process.stdout dimensions', () => {
      const renderer = new TUIRenderer();
      expect(renderer).toBeInstanceOf(TUIRenderer);
    });
  });
});

describe('registerMouseInterest', () => {
  it('returns cleanup function', () => {
    const cleanup = registerMouseInterest('test-consumer');
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('can register multiple consumers', () => {
    const cleanup1 = registerMouseInterest('consumer-1');
    const cleanup2 = registerMouseInterest('consumer-2');

    expect(typeof cleanup1).toBe('function');
    expect(typeof cleanup2).toBe('function');

    cleanup1();
    cleanup2();
  });

  it('cleanup removes consumer', () => {
    const cleanup = registerMouseInterest('test-consumer');
    cleanup();
    // Should not throw when called multiple times
    cleanup();
  });
});

describe('ESC sequences used by TUIRenderer', () => {
  it('has correct mouse enable sequences', () => {
    expect(ESC.enableMouse).toBe('\x1b[?1000h');
    expect(ESC.enableMouseSGR).toBe('\x1b[?1006h');
  });

  it('has correct mouse disable sequences', () => {
    expect(ESC.disableMouse).toBe('\x1b[?1000l');
    expect(ESC.disableMouseSGR).toBe('\x1b[?1006l');
  });

  it('has correct cursor sequences', () => {
    expect(ESC.hideCursor).toBe('\x1b[?25l');
    expect(ESC.showCursor).toBe('\x1b[?25h');
  });

  it('has correct alternate screen sequences', () => {
    expect(ESC.enterAltScreen).toBe('\x1b[?1049h');
    expect(ESC.exitAltScreen).toBe('\x1b[?1049l');
  });
});
