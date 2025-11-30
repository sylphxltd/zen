/**
 * Granular Update Demo
 *
 * 展示細粒度更新 - 只重繪變化的行，不是整個畫面
 */

import { signal, render, FullscreenLayout } from '@zen/tui';
import { Box, Text } from '@zen/tui';

// 多個獨立的 counter
const counter1 = signal(0);
const counter2 = signal(0);
const counter3 = signal(0);
const lastUpdate = signal('None');

// Counter 1: 每秒更新
setInterval(() => {
  counter1.value++;
  lastUpdate.value = 'Counter 1 (fast)';
}, 1000);

// Counter 2: 每3秒更新
setInterval(() => {
  counter2.value++;
  lastUpdate.value = 'Counter 2 (medium)';
}, 3000);

// Counter 3: 每5秒更新
setInterval(() => {
  counter3.value++;
  lastUpdate.value = 'Counter 3 (slow)';
}, 5000);

function App() {
  return (
    <Box
      style={{
        width: 70, padding: 2, borderStyle: 'double', borderColor: 'cyan'}}
    >
      <Text style={{ bold: true, color: 'green' }}>🎯 細粒度更新 Demo (Granular Updates)</Text>

      <Box style={{ padding: 1 }}>
        <Text style={{ dim: true }}>觀察：只有變化的行會重繪，不是整個畫面！</Text>
      </Box>

      <Box
        style={{
          padding: 1, borderStyle: 'single', borderColor: 'blue'}}
      >
        <Text style={{ bold: true }}>Counter 1 (每秒): </Text>
        <Text style={{ color: 'yellow' }}>{counter1}</Text>
      </Box>

      <Box
        style={{
          padding: 1, borderStyle: 'single', borderColor: 'green'}}
      >
        <Text style={{ bold: true }}>Counter 2 (3秒): </Text>
        <Text style={{ color: 'cyan' }}>{counter2}</Text>
      </Box>

      <Box
        style={{
          padding: 1, borderStyle: 'single', borderColor: 'magenta'}}
      >
        <Text style={{ bold: true }}>Counter 3 (5秒): </Text>
        <Text style={{ color: 'red' }}>{counter3}</Text>
      </Box>

      <Box style={{ padding: 1 }}>
        <Text>最後更新: </Text>
        <Text style={{ bold: true, color: 'magenta' }}>{lastUpdate}</Text>
      </Box>

      <Box>
        <Text style={{ dim: true }}>按 q 或 Ctrl+C 退出</Text>
      </Box>
    </Box>
  );
}

// 啟動 reactive 渲染
await render(() => (
  <FullscreenLayout>
    <App />
  </FullscreenLayout>
));
