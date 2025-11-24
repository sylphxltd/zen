import { Box, Text, render } from '@zen/tui';
import { executeDescriptor, isDescriptor } from '@zen/runtime';

const Demo = () => (
  <Box flexDirection="column" padding={1}>
    <Text color="cyan" bold>🍎 ZenOS Test</Text>
    <Text color="green">This should render!</Text>
  </Box>
);

// Execute descriptor to get TUINode
let node: any = <Demo />;
if (isDescriptor(node)) {
  node = executeDescriptor(node);
}

const output = render(node);
console.log(output);
