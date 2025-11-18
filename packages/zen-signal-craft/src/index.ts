// Export public API

// Types
export type { Patch, CraftOptions, CraftResult } from './types';

// Core produce function (internal, prefer craftZen for Zen integration)
export { produce } from './produce';

// Patch application function
export { applyPatches } from './patch';

// Zen integration function - primary API
export { craftZen } from './zen';

// Re-export craft's nothing symbol for property deletion
export { nothing } from '@sylphx/craft';

// Note: Internal utilities from utils.ts are not exported
