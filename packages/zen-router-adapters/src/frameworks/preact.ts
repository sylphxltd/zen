/**
 * Preact adapter for Zen Router
 *
 * @example
 * ```tsx
 * import { useRouter, useParams } from '@zen/router-adapters/preact';
 *
 * function UserProfile() {
 *   const params = useParams();
 *   return <div>User ID: {params.id}</div>;
 * }
 * ```
 */

import { useEffect, useState } from 'preact/hooks';
import {
  createUseNavigate,
  createUseParams,
  createUseRouter,
  createUseSearchParams,
} from '../core/create-hooks';

// Create Preact-specific hooks
const hooks = { useState, useEffect };

export const useRouter: () => import('@zen/router').RouterState = createUseRouter(hooks);
export const useParams: () => import('@zen/router').Params = createUseParams(hooks);
export const useSearchParams: () => import('@zen/router').Search = createUseSearchParams(hooks);
export const useNavigate: () => typeof import('@zen/router').open = createUseNavigate();

// Re-export types
export type { RouterState, Params, Search } from '@zen/router';
