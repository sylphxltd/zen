/**
 * Type definitions for Zen
 * Simplified - only types needed for current API
 */

import type { AnyZen } from './zen';

/**
 * Utility type to extract the value type from any zen type.
 */
export type ZenValue<A extends AnyZen> = A extends { _value: infer V } ? V : never;
