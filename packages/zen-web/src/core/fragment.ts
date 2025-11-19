/**
 * Fragment component for grouping children
 */

export function Fragment(props: { children?: any }): DocumentFragment {
  const fragment = document.createDocumentFragment();

  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];

    for (const child of children) {
      if (child instanceof Node) {
        fragment.appendChild(child);
      } else if (child) {
        fragment.appendChild(document.createTextNode(String(child)));
      }
    }
  }

  return fragment;
}
