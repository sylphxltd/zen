import type { Signal } from '@rapid/signal';
import { craft, craftWithPatches } from '@sylphx/craft';
import type { CraftOptions, Patch } from './types';

/**
 * Craft-powered immutable updates for Rapid signals.
 * Applies a recipe function to a draft version of the atom's current state,
 * automatically updating the atom with structural sharing.
 *
 * @param targetSignal The Rapid signal to update.
 * @param recipe A function that receives a draft state and can mutate it.
 * @param options Options to enable patch generation.
 * @returns When options.patches or options.inversePatches is true, returns [Patch[], Patch[]]. Otherwise returns void.
 */
export function craftSignal<T>(targetRapid: Signal<T>, recipe: (draft: T) => undefined): void;

export function craftSignal<T>(
  targetRapid: Signal<T>,
  recipe: (draft: T) => undefined,
  options: CraftOptions,
): [Patch[], Patch[]];

export function craftSignal<T>(
  targetRapid: Signal<T>,
  recipe: (draft: T) => undefined,
  options?: CraftOptions,
): [Patch[], Patch[]] | undefined {
  const currentState = targetSignal.value;

  // Directly use craftWithPatches or craft to avoid intermediate produce layer
  if (options?.patches || options?.inversePatches) {
    const [nextState, patches, inversePatches] = craftWithPatches(
      currentState,
      recipe as (draft: T) => T | undefined,
    );
    if (nextState !== currentState) {
      targetSignal.value = nextState;
    }
    return [patches, inversePatches];
  }

  // Fast path: no patches needed
  const nextState = craft(currentState, recipe as (draft: T) => T | undefined);
  if (nextState !== currentState) {
    targetSignal.value = nextState;
  }
}
