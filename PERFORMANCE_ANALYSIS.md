# Zen v3.3 性能分析報告

## 優化成果

### v3.3 Lazy Optimization 實現

✅ **成功實現 Pull-Based Lazy Evaluation**
- Batch 結束時，只處理有監聽器的 computed
- 無監聽器的 computed 保持 dirty，等待訪問時才計算
- Test 3 證明：無訪問時，compute count = 0（完全 lazy）

### Benchmark 結果對比

#### Test 1: Unobserved Computed (無訂閱)
```
Zen v3.3:   25.34ms (100,000 computes)
Solid:       1.98ms (0 computes)
Ratio:      12.82x slower
```

**問題：為什麼 Zen 還在計算？**
- Zen: 每次訪問 `c.value` 時，因為 dirty 而重新計算（pull）
- Solid: 訪問 `c()` 時，也是因為 dirty 而重新計算（pull）
- **理論上應該一樣！但 Solid 顯示 0 computes？**

**可能原因：**
1. Solid 的 memo 可能有更激進的緩存策略
2. Solid 可能在 batch 內就判斷出不需要 dirty（相等性檢查？）
3. Benchmark 統計方式不同

#### Test 2: Observed Computed (有訂閱)
```
Zen v3.3:   28.05ms (100,000 computes, 100,000 listener calls)
Solid:       2.69ms (0 computes, 0 listener calls)
Ratio:      10.44x slower
```

**問題：Solid 的 listener calls = 0？**
- 這表示 Solid 的 createEffect 可能沒有正常工作
- 或者 Solid 在 batch 內完全跳過了 effect 執行
- 需要重新檢查 Solid 的測試設置

#### Test 3: Batch Without Access (無訪問)
```
Zen v3.3:   13.83ms (0 computes)
Solid:       2.38ms (0 computes)
Ratio:      5.82x slower
```

**✅ 成功：兩者都是 0 computes**
- 證明 v3.3 的 lazy optimization 有效
- 但 Zen 仍然慢 5.8x

**性能差距來源：**
- 不是計算本身（都是 0）
- 是 batch 的開銷：
  - Zen: 創建 Set、處理 Updates 佇列、清理狀態
  - Solid: 更輕量級的 batch 處理

---

## 問題診斷

### 為什麼 Solid 在 Test 1 顯示 0 computes？

需要驗證 Solid 的行為：

```typescript
// 測試代碼
const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);
let computeCount = 0;
const c = createMemo(() => {
  computeCount++;
  return a() + b();
});

// 初始訪問
c(); // computeCount = 1

computeCount = 0;
batch(() => {
  setA(10);
  setB(20);
});
// batch 結束，computeCount = ?
c(); // 這裡重新計算？computeCount = ?
```

**假設 1：Solid 在 batch 結束時已經計算了**
- 如果是這樣，Test 1 的 0 computes 就是統計錯誤

**假設 2：Solid 有更聰明的 dirty 檢查**
- 可能檢查到新舊值相同，就不標記 dirty
- 但我們的測試每次都用不同的值（`i` 遞增）

**假設 3：Benchmark 計數器位置有問題**
- 可能在錯誤的位置重置了計數器

### 為什麼 Solid 在 Test 2 的 listener calls = 0？

```typescript
createEffect(() => {
  solidC2();
  solidListenerCalls2++;
});
```

**問題：createEffect 可能只執行一次（初始化時）**
- 後續的 batch 更新沒有觸發 effect

**Solid 的 effect 行為：**
- Effect 在創建時執行一次
- 之後只有當依賴變更時才執行
- 但如果 memo 沒有變更（相等性檢查），effect 不會觸發

**需要修復：**
```typescript
// 在每次 batch 後手動訪問
batch(() => {
  setSolidA2(i);
  setSolidB2(i * 2);
});
solidC2(); // 強制訪問
```

---

## 剩餘性能差距分析

即使在 Test 3（0 computes）中，Zen 仍然慢 5.8x。

### Batch 開銷對比

#### Zen v3.3 的 batch 做了什麼？

```typescript
export function batch<T>(fn: () => T): T {
  batchDepth = 1;
  Updates = new Set();      // 創建 Set
  Effects = [];             // 創建 Array

  try {
    const result = fn();

    // STEP 1: 處理 Updates（即使是空的也要檢查）
    if (Updates.size > 0) { ... }

    // STEP 2: 處理 pendingNotifications
    if (pendingNotifications.size > 0) { ... }

    // STEP 3: 處理 Effects
    if (Effects && Effects.length > 0) { ... }

    return result;
  } finally {
    batchDepth = 0;
    Updates = null;
    Effects = null;
    isProcessingUpdates = false;
  }
}
```

**開銷來源：**
1. 每次 batch 都創建新的 Set 和 Array
2. 3 個條件檢查（即使都是空的）
3. finally 清理 4 個全局變量

#### Solid 的 batch 做了什麼？

（需要查看 Solid 源碼，但推測：）
```typescript
function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // 只在最外層 batch 結束時處理
      runQueue();
    }
  }
}
```

**Solid 可能更輕量：**
1. 不在每次 batch 都創建新的佇列
2. 使用全局佇列，只在需要時添加
3. 更少的條件檢查和狀態管理

---

## 優化方向

### 1. 減少 Batch 開銷（Quick Win）

**問題：每次 batch 都創建新的 Set 和 Array**

```typescript
// 當前做法（v3.3）
export function batch<T>(fn: () => T): T {
  Updates = new Set();  // ← 每次都創建
  Effects = [];         // ← 每次都創建
  // ...
}
```

**優化方案：使用全局佇列 + 重用**

```typescript
// 全局佇列（重用）
let Updates: Set<ComputedCore<any>> = new Set();
let Effects: Array<() => void> = [];
let isProcessing = false;

export function batch<T>(fn: () => T): T {
  // 已在處理中，直接嵌套
  if (isProcessing) {
    return fn();
  }

  isProcessing = true;

  try {
    const result = fn();

    // 只在有內容時處理
    if (Updates.size > 0 || Effects.length > 0) {
      processUpdates();
    }

    return result;
  } finally {
    isProcessing = false;
    // 清空但不重新分配
    Updates.clear();
    Effects.length = 0;
  }
}
```

**預期提升：減少 20-30% 開銷**

### 2. 優化 dirty 追蹤（Medium Term）

**當前做法：每次 signal 更新都標記 computed dirty**

```typescript
// zenProto.set value()
if (listeners) {
  for (let i = 0; i < listeners.length; i++) {
    const computedZen = (listener as any)._computedZen;
    if (computedZen) {
      computedZen._dirty = true;  // ← 總是標記
      if (Updates) {
        Updates.add(computedZen);
      }
    }
  }
}
```

**優化方案：條件式 dirty 標記**

```typescript
if (listeners) {
  for (let i = 0; i < listeners.length; i++) {
    const computedZen = (listener as any)._computedZen;
    if (computedZen && !computedZen._dirty) {  // ← 只標記未 dirty 的
      computedZen._dirty = true;
      if (Updates) {
        Updates.add(computedZen);
      }
    }
  }
}
```

**預期提升：減少重複操作**

### 3. 更激進的相等性檢查（Solid-like）

**Solid 的做法：在 writeSignal 就做相等性檢查**

```typescript
export function writeSignal(node, value) {
  let current = node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    node.value = value;
    // 只有真正變更時才通知
    // ...
  }
}
```

**Zen 的當前做法：在 zenProto.set 檢查**

```typescript
set value(newValue: any) {
  const oldValue = this._value;
  if (Object.is(newValue, oldValue)) return;  // ✅ 已經有
  // ...
}
```

**✅ 已經有相等性檢查，這不是性能差距的原因**

### 4. 移除不必要的狀態管理（Aggressive）

**當前 v3.3：**
- `batchDepth`
- `Updates`
- `Effects`
- `pendingNotifications`
- `isProcessingUpdates`

**5 個全局變量需要管理**

**簡化方案：**
```typescript
let batchDepth = 0;
const Updates: Set<ComputedCore<any>> = new Set();
const Effects: (() => void)[] = [];

export function batch<T>(fn: () => T): T {
  batchDepth++;

  try {
    const result = fn();

    if (batchDepth === 1) {  // 只在最外層處理
      processUpdates();
    }

    return result;
  } finally {
    batchDepth--;
  }
}
```

**預期提升：減少狀態管理開銷**

---

## 下一步行動計劃

### Phase 1: 快速優化（預期 2-3x 提升）

1. ✅ 全局佇列重用（減少 GC）
2. ✅ 條件式 dirty 檢查
3. ✅ 移除不必要的狀態檢查

### Phase 2: 架構優化（預期 2-3x 提升）

1. 簡化 batch 嵌套邏輯
2. 優化 computed 的 _update 方法
3. 內聯關鍵路徑（減少函數調用）

### Phase 3: 深度優化（預期 2x 提升）

1. 學習 Solid 的 STALE/PENDING 狀態機
2. 實現 lookUpstream 依賴追蹤
3. 優化通知傳播路徑

### 目標

- **當前：** 12.8x slower than Solid
- **Phase 1 後：** ~4-6x slower (可接受範圍)
- **Phase 2 後：** ~2-3x slower (優秀)
- **Phase 3 後：** ~1-1.5x slower (接近 Solid)

---

## Benchmark 修復

需要修復 Test 1 和 Test 2 的統計問題，確保：
1. Solid 的 computeCount 正確統計
2. Effect 正確觸發並統計
3. 對比是公平的（相同的測試條件）
