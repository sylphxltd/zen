/** @jsxImportSource @zen/tui */
import { renderToTerminalReactive, FocusProvider } from '@zen/tui';
import { Box, Text } from '@zen/tui';

console.log('=== JSX Execution Order Test ===\n');

const Parent = (props: { children?: unknown }) => {
  console.log('4. Parent component function executing');
  console.log('5. props.children type:', typeof props.children);
  console.log('6. props.children:', props.children);
  return Box({ children: props.children });
};

const Child = () => {
  console.log('2. Child component function executing');
  return Text({ children: 'Child content' });
};

console.log('1. About to call jsx(Parent, { children: jsx(Child, {}) })');

const App = () => {
  console.log('3. App component executing, creating Parent with Child');
  return (
    <Parent>
      <Child />
    </Parent>
  );
};

await renderToTerminalReactive(() => <App />);

process.on('SIGINT', () => {
  process.exit(0);
});
