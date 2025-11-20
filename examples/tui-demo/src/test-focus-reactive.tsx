/**
 * Test Focus with Reactive Rendering
 */

import { Box, Button, FocusProvider, renderToTerminalReactive, useFocusContext } from '@zen/tui';

function App() {
  return (
    <FocusProvider>
      <Box style={{ flexDirection: 'column', gap: 1, padding: 2 }}>
        <Button id="btn1" label="Button 1" variant="primary" width={20} />
        <Button id="btn2" label="Button 2" variant="secondary" width={20} />
        <Button id="btn3" label="Button 3" variant="danger" width={20} />
      </Box>
    </FocusProvider>
  );
}

renderToTerminalReactive(App, { fps: 10 });

console.log('\nPress Ctrl+C to exit');
console.log('Expected: First button should have round border and be bold (focused)');
