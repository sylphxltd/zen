/**
 * CodeBlock Component
 */

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock(props: CodeBlockProps) {
  const { code, language = 'typescript' } = props;

  const block = document.createElement('div');
  block.className = 'code-block';

  const header = document.createElement('div');
  header.className = 'code-header';

  const lang = document.createElement('span');
  lang.className = 'code-lang';
  lang.textContent = language;

  header.appendChild(lang);

  const content = document.createElement('div');
  content.className = 'code-content';

  const pre = document.createElement('pre');
  const codeEl = document.createElement('code');
  codeEl.textContent = code;

  pre.appendChild(codeEl);
  content.appendChild(pre);

  block.appendChild(header);
  block.appendChild(content);

  return block;
}
