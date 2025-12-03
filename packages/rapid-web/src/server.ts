/**
 * Server-side rendering utilities
 *
 * Render Rapid components to HTML strings for SSR
 */

import { resetIdCounter } from '@rapid/runtime';
import { createOwner, getOwner, setOwner, setServerMode } from '@rapid/signal';

/**
 * Render component tree to HTML string
 *
 * Executes components in SSR mode where:
 * - No DOM operations
 * - Effects/mounts are skipped
 * - Output is HTML string
 *
 * @example
 * ```typescript
 * // Express server
 * app.get('/', (req, res) => {
 *   const html = renderToString(() => <App />);
 *   res.send(`
 *     <!DOCTYPE html>
 *     <html>
 *       <body>
 *         <div id="root">${html}</div>
 *         <script src="/client.js"></script>
 *       </body>
 *     </html>
 *   `);
 * });
 * ```
 */
export function renderToString(fn: () => any): string {
  // Reset ID counter for deterministic IDs
  resetIdCounter();

  // Enable server mode (disables effects/mounts)
  setServerMode(true);

  // Create isolated owner for SSR
  const owner = createOwner();
  const prev = getOwner();
  setOwner(owner);

  try {
    // Execute component tree
    // (jsx-runtime-server will return SafeHtml objects)
    const result = fn();

    // Extract HTML string from SafeHtml wrapper
    if (result && typeof result === 'object' && 'html' in result) {
      return result.html;
    }

    // Fallback for plain strings
    return String(result);
  } finally {
    setOwner(prev);
    setServerMode(false);
  }
}

/**
 * Render component to static HTML
 * Alias for renderToString (for clarity)
 */
export const renderToStaticMarkup = renderToString;
