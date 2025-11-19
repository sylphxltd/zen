/**
 * Vue transformer
 *
 * Transforms:
 *   const count = signal(0);
 *   <div>{{ count.value }}</div>
 *
 * Into:
 *   const count = signal(0);
 *   const count$ = computed(() => count.value);
 *   <div>{{ count$ }}</div>
 */

import type MagicString from 'magic-string';

export function transformVue(_code: string, _s: MagicString, _id: string, debug: boolean): void {
  // TODO: Implement Vue transformation
  // This requires parsing Vue SFC and transforming the <script> section

  if (debug) {
  }
}
