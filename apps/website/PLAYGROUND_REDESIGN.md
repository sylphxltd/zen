# Playground Redesign Plan

## Core Goal
讓 user 在 browser 親身感受 Rapid 的 **runtime-first fine-grained reactive framework** 有多強大。

## Current Problems
1. **看不出 Rapid 的特別之處** - 只係普通 code editor + preview
2. **1 秒延遲** - 感覺唔夠即時
3. **Performance metrics 無意義** - ops/sec benchmark 同 example 無關
4. **Examples 太多 styling code** - 分散注意力
5. **UI 太複雜** - Categories + Examples + Tips 佔太多空間

## Design Principles
1. **Show, Don't Tell** - 視覺化展示 fine-grained updates
2. **Instant Feedback** - 即時 run，無延遲
3. **Focus on Reactivity** - 一切圍繞展示 reactivity
4. **Clean UI** - 簡潔，focus on code + preview

---

## New Features

### 1. Reactivity Visualizer
當 signal 改變時，**highlight 邊個 DOM element 更新**：
- 閃爍/邊框顯示更新的元素
- 顯示每個元素的更新次數
- 讓 user 看到「只有相關部分更新，其他完全唔動」

```
┌─────────────────────────────────────────────────┐
│  Preview                          [Updates: 5]  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Counter: [42]  ← 只有呢度 flash            │ │
│ │ Doubled: [84]  ← 同呢度                    │ │
│ │ [Static text never updates]                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 2. Signal Inspector Panel
側邊顯示所有 signals 同佢哋嘅 dependencies：
```
┌─ Signals ──────────────────┐
│ count: 42        [+] [-]   │
│ doubled: 84      (computed)│
│                            │
│ ┌─ Dependencies ─────────┐ │
│ │ doubled ← count        │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```
- 可以直接改 signal value
- 顯示 dependency graph
- 顯示邊個 effect 正在 track 緊

### 3. Performance Metrics (Meaningful)
唔係 benchmark，係實際運行數據：
- **DOM Updates**: 幾多次 DOM 操作
- **Signal Updates**: 幾多次 signal 改變
- **Re-renders**: 0（因為 Rapid 冇 re-render！）
- **Comparison**: 「React 會需要 X 次 re-render」

### 4. Instant Execution
- 移除 1 秒延遲
- 用 debounce 50ms（打字時唔會太 lag）
- 或者用 "Run" button 手動觸發

### 5. URL Sharing
- Code encode 落 URL hash
- 用 LZ-string 壓縮
- 格式：`/playground#code=xxx`

---

## UI Layout

### Option A: Three Panel
```
┌────────────────────────────────────────────────────────────┐
│ [Examples ▼]  [Share]  [Settings]              Rapid Playground │
├──────────────────┬───────────────────┬─────────────────────┤
│                  │                   │                     │
│   Code Editor    │   Live Preview    │  Signal Inspector   │
│                  │                   │                     │
│                  │   [Reactivity     │  count: 42          │
│                  │    highlights]    │  doubled: 84        │
│                  │                   │                     │
├──────────────────┴───────────────────┴─────────────────────┤
│ DOM Updates: 2  │  Signal Changes: 1  │  Re-renders: 0     │
└────────────────────────────────────────────────────────────┘
```

### Option B: Two Panel + Bottom Inspector
```
┌────────────────────────────────────────────────────────────┐
│ [Examples ▼]  [Share]                        Rapid Playground │
├────────────────────────────┬───────────────────────────────┤
│                            │                               │
│       Code Editor          │        Live Preview           │
│                            │    [Reactivity highlights]    │
│                            │                               │
├────────────────────────────┴───────────────────────────────┤
│ Signals: count=42, doubled=84  │  Updates: 2  │  Time: 0.1ms │
└────────────────────────────────────────────────────────────┘
```

**推薦 Option B** - 更簡潔，Inspector 在底部不會分散注意力。

---

## Implementation Plan

### Phase 1: Core Improvements
1. [ ] 移除 1 秒延遲，改用 debounce 100ms
2. [ ] 簡化 UI - 移除 sidebar，examples 改用 dropdown
3. [ ] 加 URL sharing (LZ-string encoding)
4. [ ] 清理 examples - 移除多餘 styling code

### Phase 2: Reactivity Visualization
1. [ ] 實作 DOM update highlighting
2. [ ] 追蹤 signal changes
3. [ ] 顯示 meaningful metrics (DOM updates, signal changes)

### Phase 3: Signal Inspector
1. [ ] 顯示所有 active signals
2. [ ] 允許直接修改 signal values
3. [ ] 顯示 dependency graph

### Phase 4: Polish
1. [ ] Mobile responsive
2. [ ] Keyboard shortcuts
3. [ ] Better error display
4. [ ] Loading states

---

## Technical Considerations

### DOM Update Tracking
需要 patch Rapid 的 DOM operations 來追蹤：
```typescript
// Wrapper to track DOM updates
const trackDOMUpdate = (element: Element) => {
  element.classList.add('zen-updated');
  setTimeout(() => element.classList.remove('zen-updated'), 300);
  updateCount.value++;
};
```

### Signal Tracking
可以用 Rapid 的 effect 來追蹤 signal reads：
```typescript
// Track all signals in scope
const signals = new Map<string, Signal<unknown>>();
const trackSignal = (name: string, signal: Signal<unknown>) => {
  signals.set(name, signal);
};
```

### URL Encoding
```typescript
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

const shareUrl = () => {
  const compressed = compressToEncodedURIComponent(code.value);
  return `${location.origin}/playground#code=${compressed}`;
};
```

---

## Questions to Resolve
1. Signal Inspector 要幾詳細？
2. Examples dropdown 定係 modal？
3. 需唔需要 console output panel？
4. Dark/light theme 切換？
