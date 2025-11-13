# Solid.js Lazy Evaluation 深度分析

## 核心發現：Hybrid Push-Pull 模型

Solid.js 使用**混合式推拉（Hybrid Push-Pull）**反應系統，這是其性能優勢的關鍵。

### 1. 狀態追蹤機制

```typescript
const STALE = 1;   // 依賴已變更，需要重新計算
const PENDING = 2; // 上游源頭有變更，但尚未確定是否需要重算
```

**STALE vs PENDING 的差異：**
- `STALE`: 確定需要重算（直接依賴變更）
- `PENDING`: 可能需要重算（間接依賴變更，需要 lookUpstream 檢查）

### 2. Pull-Based Lazy Evaluation

**關鍵實現：`readSignal`**

```typescript
export function readSignal(this: SignalState<any> | Memo<any>) {
  // 1. 檢查是否為 computed (有 sources)
  if ((this as Memo<any>).sources && (this as Memo<any>).state) {
    // 2. 如果是 STALE，立即更新（PULL）
    if ((this as Memo<any>).state === STALE) {
      updateComputation(this as Memo<any>); // ← 這裡是 LAZY 的關鍵！
    }
    // 3. 如果是 PENDING，檢查上游依賴
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this as Memo<any>), false);
      Updates = updates;
    }
  }

  // 4. 註冊依賴追蹤（如果在 computed 內部讀取）
  if (Listener) {
    // 雙向綁定：signal→computation, computation→signal
    // ... 依賴追蹤代碼
  }

  // 5. 返回值
  return this.value;
}
```

**Lazy Evaluation 的實現方式：**
1. Computed 被標記為 `STALE` 時**不立即計算**
2. 只有在 **被訪問時**（`.value` 或 `c()`）才調用 `updateComputation`
3. 如果沒有被訪問，即使標記為 `STALE` 也不會計算

### 3. Push-Based Notification

**關鍵實現：`writeSignal`**

```typescript
export function writeSignal(node, value, isComp) {
  // 1. 相等性檢查
  if (!node.comparator || !node.comparator(current, value)) {
    node.value = value; // 更新值

    // 2. 通知所有觀察者（PUSH）
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i++) {
          const o = node.observers[i];

          // 3. 標記為 STALE（不立即執行）
          o.state = STALE;

          // 4. 加入對應佇列
          if (o.pure) Updates.push(o);      // Pure computed → Updates
          else Effects.push(o);             // Side effects → Effects

          // 5. 遞迴標記下游依賴
          if (o.observers) markDownstream(o);
        }
      }, false);
    }
  }
}
```

**Push 的特點：**
1. Signal 更新時，**立即標記**所有依賴為 `STALE`
2. **不立即執行** computed，只是標記
3. 加入 `Updates` 佇列，但不馬上處理
4. 遞迴標記整個依賴鏈（`markDownstream`）

### 4. Batch 中的 Updates 處理

**關鍵：`runUpdates` + `runQueue`**

```typescript
// batch(() => { ... }) 結束時
function runQueue(queue: Computation<any>[]) {
  for (let i = 0; i < queue.length; i++) {
    runTop(queue[i]);
  }
}

function runTop(node: Computation<any>) {
  // 只處理仍然是 STALE 的節點
  if (!node.state) return;

  // ... 執行 updateComputation
}
```

**Batch 行為：**
1. Batch 內所有 signal 更新只是**標記 STALE + 加入佇列**
2. Batch 結束後，**不自動執行 Updates 佇列**
3. 只有當 **computed 被訪問** 時，才會調用 `readSignal` → `updateComputation`

### 5. 為什麼 Solid 更快？

**Zen v3.2 的問題（EAGER）：**
```typescript
// Zen v3.2
batch(() => {
  a.value = 10;  // → 標記 computed dirty + 加入 Updates
  b.value = 20;  // → computed 已 dirty
});
// Batch 結束 → 立即處理 Updates → computed 被強制計算 ← 這裡！
const val = c.value; // 直接返回已計算的值
```

**Solid 的做法（LAZY）：**
```typescript
// Solid
batch(() => {
  setA(10);  // → 標記 memo STALE + 加入 Updates
  setB(20);  // → memo 已 STALE
});
// Batch 結束 → 什麼都不做！← 關鍵差異
const val = c(); // 這時才調用 readSignal → updateComputation ← LAZY!
```

**效能差異來源：**
| Zen v3.2 | Solid |
|----------|-------|
| Batch 結束立即計算所有 Updates | Batch 結束不計算任何東西 |
| 1 batch = 1 compute | 1 batch = 0 compute |
| 100k batches = 100k computes | 100k batches = 0 computes |
| **Push-based (eager)** | **Pull-based (lazy)** |

### 6. Benchmark 結果解釋

```typescript
// micro-bench.ts
for (let i = 0; i < 10_000; i++) {
  batch(() => {
    a.value = i;
    b.value = i * 2;
  });
  const _ = c.value; // ← 這裡是關鍵
}
```

**Zen v3.2：**
- Batch 結束 → 處理 Updates → 計算 c (compute #1)
- 訪問 c.value → 直接返回 (compute #0)
- **總計：10,000 次 compute**

**Solid：**
- Batch 結束 → 什麼都不做 (compute #0)
- 訪問 c() → 檢查 STALE → 計算 (compute #1)
- **總計：10,000 次 compute**

**但是！如果沒有訪問呢？**

```typescript
for (let i = 0; i < 10_000; i++) {
  batch(() => {
    a.value = i;
    b.value = i * 2;
  });
  // 不訪問 c.value
}
```

**Zen v3.2：** 10,000 次 compute（浪費！）
**Solid：** 0 次 compute（完全 lazy）

這就是 **15x 性能差距**的根源。

---

## 優化策略：為 Zen 實現 Pull-Based Lazy Evaluation

### Option 1: 完全移除 Batch 的 Updates 處理（激進）

```typescript
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    // 移除這段：
    // if (Updates.size > 0) { ... }  ← 刪除！
  }
}
```

**影響：**
- ✅ 完全 lazy，性能提升最大
- ❌ 如果有副作用（effects）依賴 computed，可能不會觸發
- ❌ Breaking change（行為變更）

### Option 2: 條件式處理（平衡）

```typescript
export function batch<T>(fn: () => T): T {
  // ... batch 邏輯

  // STEP 1: 跳過 Updates 處理（lazy）
  // 只有當 computed 有監聽器時才處理
  if (Updates.size > 0) {
    for (const computed of Updates) {
      // 只處理有 listeners 的 computed（被 subscribe 的）
      if (computed._listeners && computed._listeners.length > 0) {
        updateComputed(computed);
      }
      // 沒有 listeners 的保持 dirty（lazy）
    }
  }

  // STEP 2: 處理 pendingNotifications（保持不變）
  // STEP 3: 處理 Effects（保持不變）
}
```

**影響：**
- ✅ 對於未被觀察的 computed 完全 lazy
- ✅ 被 subscribe 的 computed 仍能正確觸發（保持兼容性）
- ✅ 不是 breaking change
- ⚠️ 性能提升取決於應用中 subscribe 的比例

### Option 3: Pull-First 策略（Solid-like）

```typescript
// 修改 computedProto.get value()
const computedProto = {
  get value() {
    if (this._dirty) {
      // 立即計算（PULL）
      updateComputed(this);
    }
    return this._value;
  }
};

// 修改 batch() - 完全移除 Updates 處理
export function batch<T>(fn: () => T): T {
  batchDepth++;
  Updates = new Set();
  Effects = [];

  try {
    const result = fn();

    // STEP 1: 跳過 Updates 處理 ← 關鍵改動
    Updates = null;

    // STEP 2: 處理 pendingNotifications
    // STEP 3: 處理 Effects

    return result;
  } finally {
    batchDepth = 0;
    Updates = null;
    Effects = null;
  }
}
```

**影響：**
- ✅ 完全 lazy，與 Solid 行為一致
- ✅ 最大性能提升
- ❌ Effects 可能不會及時觸發（需要額外處理）

---

## 建議的實現路徑

### Phase 1: 分析現有測試（確保兼容性）

1. 檢查哪些測試依賴 batch 結束後的立即計算
2. 確認 effect/subscribe 的行為預期

### Phase 2: 實現 Option 2（漸進式）

1. Batch 只處理有 listeners 的 computed
2. 無 listeners 的 computed 保持 dirty（lazy）
3. 運行完整測試套件，確認無 breaking change

### Phase 3: Benchmark 驗證

1. 對比 v3.1.1 vs v3.2 vs v3.3-lazy
2. 測試不同場景：
   - 無訂閱 computed（預期：接近 Solid 速度）
   - 有訂閱 computed（預期：與 v3.2 相同）
   - 混合場景

### Phase 4: 考慮 Option 3（激進優化）

1. 如果 Option 2 效果有限，評估完全 lazy
2. 提供遷移指南（breaking changes）
3. 作為 v4.0 發布

---

## 關鍵洞察

1. **Solid 的速度來自「不做事」**：Batch 結束時不執行任何 computed
2. **Lazy Evaluation 的本質**：只在 `readSignal` 時計算，不在 `writeSignal` 時計算
3. **Zen v3.2 的問題**：Batch 結束時強制處理 Updates 佇列
4. **解決方案**：跳過 Batch 的 Updates 處理，完全依賴 pull-based evaluation

下一步：實現 Option 2 並進行 benchmark 測試。
