#!/usr/bin/env bun
/**
 * Test if executeComponent is actually being called
 */

import { getOwner } from '@zen/runtime';

function TestComponent() {
  console.log('TestComponent executing, owner:', getOwner());
  return <box>Test</box>;
}

function App() {
  console.log('App executing, owner:', getOwner());
  return (
    <box>
      <TestComponent />
    </box>
  );
}

// Render
import { renderToTerminal } from '@zen/tui';

console.log('=== Starting render ===');
const output = renderToTerminal(<App />);
console.log('\n=== Render output ===');
console.log(output);
