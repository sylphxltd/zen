/**
 * Type definitions for Rapid
 * Simplified - only types needed for current API
 */

import type { AnySignal, SignalValue } from './signal';

/**
 * Utility type to extract the value type from any signal type.
 */
export type { SignalValue };

/**
 * @deprecated Use SignalValue instead
 */
export type ZenValue<A extends AnySignal> = SignalValue<A>;
