/**
 * Dynamic Size Demo
 *
 * 測試當 content size 不停變化時，fine-grained updates 係咪仍然有效
 */

import { renderToTerminalReactive, signal } from '@zen/tui';
import { Box, Text } from '@zen/tui';

// 不同長度的訊息
const messages = [
  'Short',
  'A bit longer message',
  'This is a much longer message that takes more space',
  'X',
  'Medium length text here',
  'Another message with different length altogether',
  '🎯',
];

const currentMessage = signal(messages[0]);
const counter = signal(0);
let messageIndex = 0;

// 每秒換訊息（不同長度）
setInterval(() => {
  messageIndex = (messageIndex + 1) % messages.length;
  currentMessage.value = messages[messageIndex];
  counter.value++;
}, 1000);

function App() {
  return (
    <Box
      style={{
        width: 70,
        padding: 2,
        borderStyle: 'double',
        borderColor: 'cyan',
      }}
    >
      <Text style={{ bold: true, color: 'green' }}>
        🧪 動態大小測試 (Dynamic Size Test)
      </Text>

      <Box style={{ padding: 1 }}>
        <Text style={{ dim: true }}>
          觀察：訊息長度不停變化，但只重繪變化的行！
        </Text>
      </Box>

      <Box
        style={{
          padding: 1,
          borderStyle: 'single',
          borderColor: 'blue',
        }}
      >
        <Text style={{ bold: true }}>動態訊息: </Text>
        <Text style={{ color: 'yellow' }}>{currentMessage}</Text>
      </Box>

      <Box
        style={{
          padding: 1,
          borderStyle: 'single',
          borderColor: 'green',
        }}
      >
        <Text style={{ bold: true }}>更新次數: </Text>
        <Text style={{ color: 'cyan' }}>{counter}</Text>
      </Box>

      <Box style={{ padding: 1 }}>
        <Text style={{ dim: true }}>
          提示：如果 fine-grained 有效，你會見到只有變化的內容在閃爍，
        </Text>
        <Text style={{ dim: true }}>
          而唔係成個畫面重繪！
        </Text>
      </Box>

      <Box>
        <Text style={{ dim: true }}>按 q 或 Ctrl+C 退出</Text>
      </Box>
    </Box>
  );
}

// 啟動 reactive 渲染
await renderToTerminalReactive(() => <App />, {
  fps: 10,
});
