#!/usr/bin/env bun
/**
 * Debug test for Context re-parenting
 */

import { signal, getOwner, getNodeOwner, createContext, useContext } from '@zen/runtime';

const TestContext = createContext({ value: 'default' });

function TestProvider(props: { children: any }) {
  console.log('=== TestProvider executing ===');
  const owner = getOwner();
  console.log('Provider owner:', owner);
  console.log('Provider owner parent:', owner?.parent);

  return (
    <TestContext.Provider value={{ value: 'provided' }}>
      {props.children}
    </TestContext.Provider>
  );
}

function TestChild() {
  console.log('=== TestChild executing ===');
  const owner = getOwner();
  console.log('Child owner:', owner);
  console.log('Child owner parent:', owner?.parent);

  const ctx = useContext(TestContext);
  console.log('Context value:', ctx.value);

  return <box>Child</box>;
}

function App() {
  return (
    <box>
      <TestProvider>
        <TestChild />
      </TestProvider>
    </box>
  );
}

// Render
import { renderToTerminal } from '@zen/tui';

console.log('=== Starting render ===');
const output = renderToTerminal(<App />);
console.log('\n=== Render output ===');
console.log(output);
