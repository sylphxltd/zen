/** @jsxImportSource @rapid/web */
/**
 * Link component for Rapid framework
 * Powered by @rapid/router-core
 */

import { open } from '@rapid/router-core';

export interface LinkProps {
  href: string;
  children?: unknown;
  class?: string;
  [key: string]: unknown;
}

/**
 * Link component - Navigation link with client-side routing
 *
 * Uses JSX to leverage framework's descriptor pattern and automatic children handling.
 *
 * @example
 * ```tsx
 * <Link href="/about">About Us</Link>
 * <Link href="/users/123" class="active">User Profile</Link>
 * <Link href="/"><Icon icon="zap" /><span>Logo</span></Link>
 * ```
 */
export function Link(props: LinkProps): Node {
  const { href, children, ...restProps } = props;

  return (
    <a
      href={href}
      {...restProps}
      onClick={(e: MouseEvent) => {
        // Allow modified clicks to open in new tab
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
          return;
        }

        e.preventDefault();
        open(href);
      }}
    >
      {children}
    </a>
  );
}
