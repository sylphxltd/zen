// Export public API

// Types
export type { Patch, CraftOptions, CraftResult } from './types';

// Core produce function (internal, prefer craftSignal for Rapid integration)
export { produce } from './produce';

// Patch application function
export { applyPatches } from './patch';

// Rapid Signal integration function - primary API
export { craftSignal } from './rapid';

// Re-export craft's nothing symbol for property deletion
export { nothing } from '@sylphx/craft';

// Note: Internal utilities from utils.ts are not exported
