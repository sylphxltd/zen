/**
 * Footer Component
 */

export function Footer() {
  const footer = document.createElement('footer');
  footer.className = 'footer';

  const container = document.createElement('div');
  container.className = 'container';

  const text = document.createElement('p');
  text.innerHTML = `
    Built with ⚡ ZenJS |
    <a href="https://github.com/SylphxAI/zen" target="_blank">GitHub</a> |
    MIT License
  `;

  container.appendChild(text);
  footer.appendChild(container);

  return footer;
}
