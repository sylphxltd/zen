import { craft, craftWithPatches } from '@zen/craft';
import type { Zen } from '@zen/signal';
import type { CraftOptions, Patch } from './types';

/**
 * Craft-powered immutable updates for Zen atoms.
 * Applies a recipe function to a draft version of the atom's current state,
 * automatically updating the atom with structural sharing.
 *
 * @param targetZen The Zen atom to update.
 * @param recipe A function that receives a draft state and can mutate it.
 * @param options Options to enable patch generation.
 * @returns When options.patches or options.inversePatches is true, returns [Patch[], Patch[]]. Otherwise returns void.
 */
export function craftZen<T>(targetZen: Zen<T>, recipe: (draft: T) => undefined): void;

export function craftZen<T>(
  targetZen: Zen<T>,
  recipe: (draft: T) => undefined,
  options: CraftOptions,
): [Patch[], Patch[]];

export function craftZen<T>(
  targetZen: Zen<T>,
  recipe: (draft: T) => undefined,
  options?: CraftOptions,
): [Patch[], Patch[]] | undefined {
  const currentState = targetZen.value;

  // Directly use craftWithPatches or craft to avoid intermediate produce layer
  if (options?.patches || options?.inversePatches) {
    const [nextState, patches, inversePatches] = craftWithPatches(
      currentState,
      recipe as (draft: T) => T | undefined,
    );
    if (nextState !== currentState) {
      targetZen.value = nextState;
    }
    return [patches, inversePatches];
  }

  // Fast path: no patches needed
  const nextState = craft(currentState, recipe as (draft: T) => T | undefined);
  if (nextState !== currentState) {
    targetZen.value = nextState;
  }
}
