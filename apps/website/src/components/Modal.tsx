import { onCleanup, onMount } from '@rapid/web';
import type { ZenNode } from '@rapid/web';

export interface ModalProps {
  onClose: () => void;
  title?: string;
  children: ZenNode;
}

export function Modal(props: ModalProps) {
  // Lock body scroll when modal is mounted
  onMount(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup when modal unmounts
    onCleanup(() => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    });
  });

  // Handle ESC key to close modal
  onMount(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    onCleanup(() => {
      document.removeEventListener('keydown', handleEscape);
    });
  });

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
      onClick={props.onClose}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          props.onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div class="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        class="relative bg-bg dark:bg-bg-dark-light border border-border dark:border-border-dark rounded-rapid shadow-rapid-lg max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scale-in"
        onClick={(e: Event) => e.stopPropagation()}
        onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
      >
        {/* Header */}
        {props.title && (
          <div class="flex items-center justify-between p-6 border-b border-border dark:border-border-dark">
            <h2 class="text-2xl font-bold text-text dark:text-text-dark">{props.title}</h2>
            <button
              type="button"
              onClick={props.onClose}
              class="p-2 text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark hover:bg-bg-lighter dark:hover:bg-bg-dark-lighter rounded-rapid transition-colors interactive-scale"
              aria-label="Close modal"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                role="img"
                aria-label="Close"
              >
                <title>Close</title>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div class="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">{props.children}</div>
      </div>
    </div>
  );
}
