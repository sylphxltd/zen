/**
 * Header Component
 */

import { Link, currentRoute } from '../../../src/index.js';

export function Header() {
  const nav = document.createElement('nav');
  nav.className = 'nav';

  const links = [
    { href: '/', text: 'Home' },
    { href: '/docs', text: 'Docs' },
    { href: '/examples', text: 'Examples' },
    { href: '/benchmark', text: 'Benchmark' },
  ];

  links.forEach(({ href, text }) => {
    const link = Link({
      href,
      children: text,
      class: currentRoute.value === href ? 'active' : '',
    });
    nav.appendChild(link);
  });

  const header = document.createElement('header');
  header.className = 'header';

  const container = document.createElement('div');
  container.className = 'container';

  const headerContent = document.createElement('div');
  headerContent.className = 'header-content';

  const logo = document.createElement('a');
  logo.href = '#/';
  logo.className = 'logo';
  logo.textContent = '⚡ ZenJS';

  headerContent.appendChild(logo);
  headerContent.appendChild(nav);
  container.appendChild(headerContent);
  header.appendChild(container);

  return header;
}
