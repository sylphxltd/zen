/**
 * React adapter for Rapid Router
 *
 * @example
 * ```tsx
 * import { useRouter, useParams } from '@rapid/router-adapters/react';
 *
 * function UserProfile() {
 *   const params = useParams();
 *   return <div>User ID: {params.id}</div>;
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import {
  createUseNavigate,
  createUseParams,
  createUseRouter,
  createUseSearchParams,
} from './core/create-hooks';

// Create React-specific hooks
const hooks = { useState, useEffect };

export const useRouter: () => import('@rapid/router-core').RouterState = createUseRouter(hooks);
export const useParams: () => import('@rapid/router-core').Params = createUseParams(hooks);
export const useSearchParams: () => import('@rapid/router-core').Search =
  createUseSearchParams(hooks);
export const useNavigate: () => typeof import('@rapid/router-core').open = createUseNavigate();

// Re-export types
export type { RouterState, Params, Search } from '@rapid/router-core';
