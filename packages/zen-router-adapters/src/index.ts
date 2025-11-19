/**
 * @zen/router-adapters - Universal router hooks for all frameworks
 *
 * Auto-detects React or Preact and provides appropriate hooks.
 * For explicit framework selection, use:
 * - @zen/router-adapters/react
 * - @zen/router-adapters/preact
 * - @zen/router-adapters/zen
 *
 * @example
 * ```tsx
 * // Auto-detect (recommended)
 * import { useRouter } from '@zen/router-adapters';
 *
 * // Explicit framework
 * import { useRouter } from '@zen/router-adapters/react';
 * ```
 */

import type { ReactiveHooks } from './core/create-hooks';
import {
  createUseNavigate,
  createUseParams,
  createUseRouter,
  createUseSearchParams,
} from './core/create-hooks';

// Auto-detect framework
let detectedHooks: ReactiveHooks | null = null;

function detectFramework(): ReactiveHooks {
  if (detectedHooks) return detectedHooks;

  // Try React first (most common)
  try {
    const react = require('react');
    if (react.useState && react.useEffect) {
      detectedHooks = {
        useState: react.useState,
        useEffect: react.useEffect,
      };
      return detectedHooks;
    }
  } catch {}

  // Try Preact
  try {
    const preact = require('preact/hooks');
    if (preact.useState && preact.useEffect) {
      detectedHooks = {
        useState: preact.useState,
        useEffect: preact.useEffect,
      };
      return detectedHooks;
    }
  } catch {}

  // No compatible framework found
  throw new Error(
    '@zen/router-adapters: No compatible framework detected. ' +
      'Install react or preact, or use explicit import:\n' +
      '  import { useRouter } from "@zen/router-adapters/react"\n' +
      '  import { useRouter } from "@zen/router-adapters/preact"\n' +
      '  import { useRouter } from "@zen/router-adapters/zen"',
  );
}

// Create hooks with auto-detected framework
const hooks = detectFramework();

export const useRouter = createUseRouter(hooks);
export const useParams = createUseParams(hooks);
export const useSearchParams = createUseSearchParams(hooks);
export const useNavigate = createUseNavigate();

// Re-export types
export type { RouterState, Params, Search } from '@zen/router';

// Re-export core for advanced usage
export { createUseRouter, createUseParams, createUseSearchParams } from './core/create-hooks';
export type { ReactiveHooks } from './core/create-hooks';
