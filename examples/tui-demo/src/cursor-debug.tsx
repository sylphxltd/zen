import { signal } from '@zen/signal';
import { Box, renderToTerminalReactive, useInput } from '@zen/tui';

const counter = signal(0);

const DebugTest = () => {
  useInput((_input, _key) => {
    counter.value++;
  });

  return (
    <Box borderStyle="round" borderColor="cyan" padding={1}>
      <Box flexDirection="column">
        <Box>Simple Cursor Debug Test</Box>
        <Box marginTop={1}>Counter: {() => counter.value}</Box>
        <Box marginTop={1} dimColor={true}>
          Press any key to trigger console.log
        </Box>
        <Box marginTop={1} dimColor={true}>
          Press Ctrl+C to exit
        </Box>
      </Box>
    </Box>
  );
};

await renderToTerminalReactive(() => <DebugTest />);
