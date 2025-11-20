# Zen TUI Demo - Reactive Terminal UI

這個 demo 展示 Zen 的跨平台 reactive 能力，運行在終端（TUI）環境。

## 🎯 功能展示

- ✅ **Reactive Signal** - 自動更新的 counter（每秒 +1）
- ✅ **鍵盤交互** - 即時響應用戶輸入
- ✅ **實時渲染** - 10 FPS 持續刷新
- ✅ **跨平台組件** - 使用 `@zen/runtime` 組件

## 🚀 運行

```bash
# 從項目根目錄運行
bun examples/tui-demo/src/index.tsx
```

## ⌨️ 控制

- **↑ (上箭頭)** - 手動增加 counter (+1)
- **↓ (下箭頭)** - 手動減少 counter (-1)
- **Space** - 重置 counter 為 0
- **q 或 Ctrl+C** - 退出程序

## 🧪 測試 Reactive

運行後你會看到：

1. **自動更新** - Counter 每秒自動增加
2. **手動控制** - 按箭頭鍵立即更新
3. **即時反饋** - 消息區域顯示操作結果

## 📊 技術細節

### Reactive 實現

```typescript
// 創建 reactive signal
const count = signal(0);

// 自動更新（測試 reactive）
setInterval(() => {
  count.value++; // 修改 signal
}, 1000);

// 手動更新（鍵盤交互）
onKeyPress: (key) => {
  if (key === '\u001b[A') { // 上箭頭
    count.value++;
  }
}
```

### 渲染循環

```typescript
renderToTerminalReactive(() => <App />, {
  fps: 10,  // 10 次/秒刷新
  onKeyPress: handleKey,
});
```

每次 signal 改變或到達渲染間隔時，整個 UI 自動重新渲染。

## 🎨 組件使用

```tsx
<Box style={{ borderStyle: 'round', borderColor: 'cyan' }}>
  <Text style={{ bold: true, color: 'green' }}>
    標題
  </Text>
  <Text>Counter: {count}</Text>
</Box>
```

## 🔍 與 Web 版本對比

| 特性 | Web (@zen/web) | TUI (@zen/tui) |
|------|----------------|----------------|
| 組件 | `<div>`, `<span>` | `<Box>`, `<Text>` |
| 樣式 | CSS | Terminal colors |
| 交互 | Mouse events | Keyboard input |
| 渲染 | DOM updates | Terminal output |
| **Reactive** | ✅ 相同的 signal API | ✅ 相同的 signal API |

核心的 `signal`, `computed`, `effect` 在所有平台完全一致！
