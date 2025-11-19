// Combined imports
import { type Signal, signal, subscribe } from '@zen/signal';
import { type MapStore, map } from '../patterns/map';

// --- Types ---

/** Storage interface compatible with localStorage and sessionStorage */
export interface StorageEngine {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Encoding/decoding functions */
export interface Serializer<Value> {
  encode: (value: Value) => string;
  decode: (raw: string) => Value;
}

/** Options for persistent stores */
export interface PersistentOptions<Value> {
  /** Web Storage engine. Defaults to `localStorage`. */
  storage?: StorageEngine;
  /** Custom JSON-like serializer. Defaults to `JSON`. */
  serializer?: Serializer<Value>;
  /** Optional: Listen for storage events (cross-tab sync). Defaults to true. */
  listen?: boolean;
}

// --- Implementation ---

const GenericJSONSerializer = {
  encode: JSON.stringify,
  decode: JSON.parse,
};

/** @internal Handles storage event updates for persistentZen */
function _handleStorageEventUpdate<Value>(
  event: StorageEvent,
  baseZen: Signal<Value>,
  serializer: Serializer<Value>,
  initialValue: Value, // Needed for reset case
): void {
  if (event.newValue === null) {
    // Key removed or cleared in another tab
    baseZen.value = initialValue;
  } else {
    try {
      const decodedValue = serializer.decode(event.newValue);
      // Check if the decoded value is different before setting to prevent loops
      if (baseZen.value !== decodedValue) {
        baseZen.value = decodedValue;
      }
    } catch (_error) {
      // Optionally reset to initial value on decode error
      // baseZen.value = initialValue;
    }
  }
}

/**
 * Creates a persistent zen that synchronizes its state with Web Storage
 * (localStorage or sessionStorage) and across browser tabs.
 *
 * @param key Unique key for the storage entry.
 * @param initialValue Initial value if nothing is found in storage.
 * @param options Configuration options.
 * @returns A writable zen synchronized with storage.
 */
export function persistentZen<Value>(
  key: string,
  initialValue: Value,
  options?: PersistentOptions<Value>,
): Signal<Value> {
  // Use Zen<Value> type
  const storage = options?.storage ?? (typeof window !== 'undefined' ? localStorage : undefined);
  const serializer = options?.serializer ?? GenericJSONSerializer;
  const shouldListen = options?.listen ?? true;

  if (typeof window === 'undefined' || !storage) {
    return signal<Value>(initialValue); // Fallback to regular signal if no storage
  }

  // --- Revised Initialization ---
  let initialValueFromStorage: Value | undefined;
  let storageIsEmpty = true;
  try {
    const raw = storage.getItem(key);
    if (raw !== null) {
      initialValueFromStorage = serializer.decode(raw);
      storageIsEmpty = false;
    }
  } catch (_error) {
    /* Ignore decode error */
  }

  const actualInitialValue = initialValueFromStorage ?? initialValue;
  const baseZen = signal<Value>(actualInitialValue);
  // --- End Revised Initialization ---

  let ignoreNextStorageEvent = false; // Flag to prevent echo from self-triggered events

  // Function to write the current zen value to storage
  const writeToStorage = (value: Value) => {
    try {
      const encoded = serializer.encode(value);
      ignoreNextStorageEvent = true; // Mark that we are causing the potential storage event
      storage.setItem(key, encoded);
    } catch (_error) {
    } finally {
      // Reset flag immediately
      ignoreNextStorageEvent = false;
    }
  };

  // If storage was initially empty, write the determined initial value now.
  if (storageIsEmpty) {
    writeToStorage(actualInitialValue);
  }

  // Subscribe to persist future changes immediately after creation.
  // We don't need to store the unsubscribe function unless we plan to stop persisting later.
  subscribe(baseZen, (newValue: Value) => {
    writeToStorage(newValue);
  });

  // Handler for storage events (cross-tab sync)
  const storageEventHandler = (event: StorageEvent) => {
    // Check if the event is for the correct key and storage area
    if (event.key === key && event.storageArea === storage) {
      // Check if this event was triggered by the current instance
      if (ignoreNextStorageEvent) {
        return; // Ignore event triggered by this instance
      }
      // Handle the update using the helper function
      _handleStorageEventUpdate(event, baseZen, serializer, initialValue);
    }
  };

  // Setup cross-tab sync listener
  if (shouldListen && typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', storageEventHandler);
  }

  return baseZen;
}

/**
 * Creates a persistent map store that synchronizes its state with Web Storage
 * (localStorage or sessionStorage) and across browser tabs.
 *
 * Note: Currently, cross-tab synchronization updates the entire map object,
 * not individual keys.
 *
 * @param key Unique key for the storage entry.
 * @param initialValue Initial value if nothing is found in storage.
 * @param options Configuration options.
 * @returns A map store synchronized with storage.
 */

export function persistentMap<Value extends object>(
  // Remove blank lines
  key: string,
  initialValue: Value,
  options?: PersistentOptions<Value>,
): MapStore<Value> {
  const storage = options?.storage ?? (typeof window !== 'undefined' ? localStorage : undefined);
  const serializer = options?.serializer ?? GenericJSONSerializer;
  const shouldListen = options?.listen ?? true;

  if (typeof window === 'undefined' || !storage) {
    return map<Value>(initialValue); // Fallback to regular map if no storage
  }

  // --- Revised Initialization ---
  let initialValueFromStorage: Value | undefined;
  let storageIsEmpty = true;
  try {
    const raw = storage.getItem(key);
    if (raw !== null) {
      initialValueFromStorage = serializer.decode(raw);
      storageIsEmpty = false;
    }
  } catch (_error) {
    /* Ignore decode error */
  }

  const actualInitialValue = initialValueFromStorage ?? initialValue;
  const baseMap = map<Value>(actualInitialValue);
  // --- End Revised Initialization ---

  let ignoreNextStorageEvent = false; // Flag to prevent echo from self-triggered events

  // Function to write the current map value to storage
  const writeToStorage = (value: Value) => {
    try {
      const encoded = serializer.encode(value);
      ignoreNextStorageEvent = true; // Mark that we are causing the potential storage event
      storage.setItem(key, encoded);
    } catch (_error) {
    } finally {
      // Reset flag immediately
      ignoreNextStorageEvent = false;
    }
  };

  // If storage was initially empty, write the determined initial value now.
  if (storageIsEmpty) {
    writeToStorage(actualInitialValue);
  }

  // Subscribe to persist future changes immediately after creation.
  // Use _state to subscribe to the underlying zen atom instead of the MapStore
  subscribe(baseMap._state, (newValue: Value) => {
    writeToStorage(newValue);
  });

  // Handler for storage events (cross-tab sync)
  const storageEventHandler = (event: StorageEvent) => {
    if (event.key === key && event.storageArea === storage) {
      if (ignoreNextStorageEvent) {
        return; // Ignore event triggered by this instance
      }
      if (event.newValue === null) {
        // Key removed or cleared in another tab
        baseMap.value = initialValue; // Reset to initial value (updates the whole map)
      } else {
        try {
          const decodedValue = serializer.decode(event.newValue);
          // Update the whole map. Consider deep comparison if performance becomes an issue.
          baseMap.value = decodedValue;
        } catch (_error) {}
      }
    }
  };

  // Setup cross-tab sync listener
  if (shouldListen && typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', storageEventHandler);
  }

  // Return the original map store. Its value is managed by the listeners.
  // Functions like setKey will modify the baseMap, triggering the subscribe listener.
  return baseMap;
}

// Removed redundant export
