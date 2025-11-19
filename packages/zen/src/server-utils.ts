/**
 * Server-side utilities
 *
 * Provides environment detection and SSR-safe ID generation
 */

/**
 * Detect if running on server
 *
 * @example
 * ```tsx
 * function Component() {
 *   const data = isServer
 *     ? await loadServerData()
 *     : loadClientData();
 * }
 * ```
 */
export const isServer = typeof window === 'undefined';

// ID generation state
let idCounter = 0;
let serverIdPrefix = '';

/**
 * Set prefix for server-generated IDs
 * Should be unique per request to avoid conflicts
 *
 * @example
 * ```typescript
 * // Server
 * app.get('/', (req, res) => {
 *   setServerIdPrefix(req.id);
 *   const html = renderToString(() => <App />);
 * });
 * ```
 */
export function setServerIdPrefix(prefix: string): void {
  serverIdPrefix = prefix;
}

/**
 * Reset ID counter
 * Should be called at the start of each SSR request
 *
 * @example
 * ```typescript
 * app.get('/', (req, res) => {
 *   resetIdCounter();
 *   const html = renderToString(() => <App />);
 * });
 * ```
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Generate unique ID that's consistent between server and client
 *
 * Critical for SSR to avoid hydration mismatches.
 * IDs are deterministic based on execution order.
 *
 * @example
 * ```tsx
 * function Form() {
 *   const id = createUniqueId();
 *
 *   return (
 *     <>
 *       <label htmlFor={id}>Name</label>
 *       <input id={id} />
 *     </>
 *   );
 * }
 * ```
 */
export function createUniqueId(): string {
  return `zen-${serverIdPrefix}${idCounter++}`;
}
