/**
 * Rapid Signal - Vue JSX Runtime
 *
 * Runtime-first signal integration for Vue.
 * Auto-detects and unwraps Rapid signals without compiler transformations.
 *
 * Usage:
 * ```vue
 * <script setup>
 * import { signal } from '@rapid/signal-core';
 *
 * const count = signal(0);
 * </script>
 *
 * <template>
 *   <div>{{ count }}</div>  <!-- Automatically reactive! -->
 * </template>
 * ```
 */

import { type VNode, ref, h as vueH, watchEffect } from 'vue';

// ============================================================================
// SIGNAL DETECTION
// ============================================================================

/**
 * Check if value is a Rapid signal
 * Matches Rapid framework's isReactive check
 */
// biome-ignore lint/suspicious/noExplicitAny: Runtime detection requires dynamic type
function isZenSignal(value: any): boolean {
  return value !== null && typeof value === 'object' && '_kind' in value;
}

// ============================================================================
// SIGNAL WRAPPER
// ============================================================================

/**
 * Wrap a Rapid signal in a Vue ref that auto-updates
 *
 * Strategy:
 * 1. Create a Vue ref with initial signal value
 * 2. Use watchEffect to track signal changes
 * 3. Update Vue ref when signal changes
 */
// biome-ignore lint/suspicious/noExplicitAny: Signal wrapper requires dynamic type
function wrapSignal(signal: any): any {
  const vueRef = ref(signal.value);

  watchEffect(() => {
    vueRef.value = signal.value;
  });

  return vueRef;
}

// Cache wrapped signals to avoid creating multiple refs for the same signal
// biome-ignore lint/suspicious/noExplicitAny: WeakMap requires dynamic types for signals
const signalCache = new WeakMap<any, any>();

// biome-ignore lint/suspicious/noExplicitAny: Signal cache getter requires dynamic type
function getOrWrapSignal(signal: any): any {
  let wrapped = signalCache.get(signal);
  if (!wrapped) {
    wrapped = wrapSignal(signal);
    signalCache.set(signal, wrapped);
  }
  return wrapped;
}

// ============================================================================
// JSX/TEMPLATE RUNTIME
// ============================================================================

/**
 * Process children to unwrap signals
 */
// biome-ignore lint/suspicious/noExplicitAny: Children processing requires dynamic type
function processChildren(children: any): any {
  if (children === null || children === undefined) {
    return children;
  }

  // Single child - check if it's a signal
  if (isZenSignal(children)) {
    return getOrWrapSignal(children);
  }

  // Array of children - process each
  if (Array.isArray(children)) {
    return children.map((child) => (isZenSignal(child) ? getOrWrapSignal(child) : child));
  }

  // String, number, etc. - pass through
  return children;
}

/**
 * Custom h() function that auto-detects signals
 *
 * Process:
 * 1. Check if children contain signals
 * 2. Wrap signals in Vue refs with watchEffect
 * 3. Pass through to Vue's h() function
 */
// biome-ignore lint/suspicious/noExplicitAny: Vue h() function requires dynamic types
export function h(type: any, props?: any, children?: any): VNode {
  // If props is actually children (Vue's h() overload)
  if (
    props &&
    !children &&
    (typeof props === 'string' || Array.isArray(props) || isZenSignal(props))
  ) {
    children = props;
    props = null;
  }

  // Process children to unwrap signals
  const processedChildren = processChildren(children);

  // Call Vue's h() with processed children
  if (props) {
    return vueH(type, props, processedChildren);
  }
  return vueH(type, processedChildren);
}

// Re-export everything from Vue for compatibility
export * from 'vue';
