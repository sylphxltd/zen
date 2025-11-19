/**
 * Type declarations for unplugin-icons virtual imports
 * @see https://github.com/unplugin/unplugin-icons
 */

declare module '~icons/*' {
  const component: (props?: any) => Node;
  export default component;
}
