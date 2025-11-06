// Lightweight single-source selector implementation (like Zustand/Reselect).
import type { AnyZen, SelectZen, Unsubscribe, ZenValue, ZenWithValue } from './types';
import { notifyListeners } from './zen';

// --- Internal Select Logic ---

/**
 * Recalculates the selected value based on current source value.
 * Updates the internal `_value` and returns true if the value changed.
 * @returns True if the value changed, false otherwise.
 * @internal
 */
function updateSelectValue<T, S>(zen: SelectZen<T, S>): boolean {
  const source = zen._source;

  // Get current source value
  let sourceValue: unknown;
  const kind = source._kind;

  // Handle all source types
  if (kind === 'zen' || kind === 'map' || kind === 'deepMap') {
    sourceValue = source._value;
  } else if (kind === 'computed') {
    // Cast to access computed properties
    const computedSource = source as { _dirty: boolean; _value: unknown; _update: () => boolean };
    if (computedSource._dirty || computedSource._value === null) {
      computedSource._update();
      if (computedSource._dirty || computedSource._value === null) {
        zen._dirty = true;
        return false; // Source not ready
      }
    }
    sourceValue = computedSource._value;
  } else if (kind === 'select') {
    // Handle select depending on select
    const selectSource = source as SelectZen<unknown, unknown>;
    if (selectSource._dirty || selectSource._value === null) {
      selectSource._update();
      if (selectSource._dirty || selectSource._value === null) {
        zen._dirty = true;
        return false; // Source not ready
      }
    }
    sourceValue = selectSource._value;
  } else {
    // batched or karma
    const batchedSource = source as { _dirty?: boolean; _value: unknown };
    if (batchedSource._dirty) {
      zen._dirty = true;
      return false;
    }
    sourceValue = batchedSource._value;
  }

  const old = zen._value; // Capture value BEFORE recalculation (could be null)

  // Apply selector function
  const newValue = zen._selector(sourceValue as S);
  zen._dirty = false; // Mark as clean after calculation

  // Check if the value actually changed using the equality function
  if (old !== null && zen._equalityFn(newValue, old)) {
    return false; // No change
  }

  // Update internal value
  zen._value = newValue;

  return true; // Value changed
}

/**
 * Handler called when the source zen changes.
 * Marks the select zen as dirty and triggers an update if active.
 * @internal
 */
function selectSourceChanged<T, S>(zen: SelectZen<T, S>): void {
  if (zen._dirty) return; // Already dirty

  zen._dirty = true;

  // If there are active listeners, trigger an update and notify if the value changed
  if (zen._listeners?.size) {
    const oldValue = zen._value;
    const changed = updateSelectValue(zen);
    if (changed) {
      try {
        notifyListeners(zen as AnyZen, zen._value, oldValue);
      } catch (_e) {}
    }
  }
}

/**
 * Subscribes to the source zen.
 * @internal
 */
function subscribeSelectToSource<T, S>(zen: SelectZen<T, S>): void {
  if (zen._unsubscriber) return; // Already subscribed

  const source = zen._source;
  const onChangeHandler = () => selectSourceChanged(zen);

  const baseSource = source as ZenWithValue<unknown>;
  const isFirstSourceListener = !baseSource._listeners?.size;
  baseSource._listeners ??= new Set();
  baseSource._listeners.add(onChangeHandler);

  // If the source is computed or select, trigger its source subscription
  if (isFirstSourceListener) {
    if (source._kind === 'computed') {
      const computedSource = source as { _subscribeToSources?: () => void };
      if (typeof computedSource._subscribeToSources === 'function') {
        computedSource._subscribeToSources();
      }
    } else if (source._kind === 'select') {
      const selectSource = source as SelectZen<unknown, unknown>;
      if (typeof selectSource._subscribeToSource === 'function') {
        selectSource._subscribeToSource();
      }
    }
  }

  // Store unsubscribe function
  zen._unsubscriber = () => {
    const srcListeners = baseSource._listeners;
    if (!srcListeners?.has(onChangeHandler)) return;

    srcListeners.delete(onChangeHandler);

    if (!srcListeners.size) {
      baseSource._listeners = undefined;
      // Trigger source cleanup
      if (source._kind === 'computed') {
        const computedSource = source as { _unsubscribeFromSources?: () => void };
        if (typeof computedSource._unsubscribeFromSources === 'function') {
          computedSource._unsubscribeFromSources();
        }
      } else if (source._kind === 'select') {
        const selectSource = source as SelectZen<unknown, unknown>;
        if (typeof selectSource._unsubscribeFromSource === 'function') {
          selectSource._unsubscribeFromSource();
        }
      }
    }
  };
}

/**
 * Unsubscribes from the source zen.
 * @internal
 */
function unsubscribeSelectFromSource<T, S>(zen: SelectZen<T, S>): void {
  if (!zen._unsubscriber) return;

  zen._unsubscriber();
  zen._unsubscriber = undefined;
  zen._dirty = true; // Mark as dirty when inactive
}

// --- Select Factory (Functional Style) ---

/**
 * Creates a lightweight read-only selector zen (like Zustand/Reselect).
 * Optimized for single-source derivations with minimal overhead.
 *
 * For multi-source dependencies or complex scenarios, use `computed()` instead.
 *
 * @template T The type of the selected value.
 * @template S The type of the source value.
 * @param source A single source zen.
 * @param selector A function that transforms the source value to the selected value.
 * @param equalityFn Optional function to compare old and new selected values.
 *   Defaults to `Object.is`. If it returns true, listeners are not notified.
 * @returns A ReadonlySelectZen representing the selected value.
 */
export function select<T, S = unknown>(
  source: AnyZen,
  selector: (value: S) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is,
): SelectZen<T, S> {
  // Define the structure adhering to SelectZen<T, S> type
  const selectZen: SelectZen<T, S> = {
    _kind: 'select',
    _value: null, // Start as null
    _dirty: true,
    _source: source,
    _selector: selector,
    _equalityFn: equalityFn,
    // Internal methods
    _subscribeToSource: () => subscribeSelectToSource(selectZen),
    _unsubscribeFromSource: () => unsubscribeSelectFromSource(selectZen),
    _update: () => updateSelectValue(selectZen),
  };

  return selectZen;
}
