# Zen V2 性能分析報告

## 📊 三方對比：Zen V1 vs Zen V2 (Bound Function) vs SolidJS

---

## ✅ Zen V2 顯著改進

### 1. **Read Performance** (1000x)
```
Zen V1:   192,640 ops/s
Zen V2: 1,095,424 ops/s  ⬆️ 5.69x faster
Solid:  3,759,209 ops/s
```
**改進原因**: Bound function 消除了參數傳遞和 switch case overhead

### 2. **Write Performance** (1000x)
```
Zen V1:   195,306 ops/s
Zen V2: 3,166,687 ops/s  ⬆️ 16.21x faster
Solid:  3,703,741 ops/s
```
**改進原因**: 直接 setter，無需 `set(zen, value)` 的函數調用開銷

### 3. **Mixed Read/Write** (1000x)
```
Zen V1:  76,517 ops/s
Zen V2: 358,256 ops/s  ⬆️ 4.68x faster
Solid: 1,255,262 ops/s
```

### 4. **Computed Cached Read** (1000x)
```
Zen V1:   184,191 ops/s
Zen V2:   968,498 ops/s  ⬆️ 5.26x faster
Solid:  3,679,958 ops/s
```
**改進原因**: Bound function getter，但仍與 Solid 差 3.8x

### 5. **Batching** (100 updates)
```
Zen V1:   441,650 ops/s
Zen V2: 2,405,539 ops/s  ⬆️ 5.45x faster
Solid:  8,851,537 ops/s
```

### 6. **100 Independent Signals**
```
Zen V1:  4,818 ops/s
Zen V2: 21,775 ops/s  ⬆️ 4.52x faster
Solid:  39,623 ops/s
```

---

## ❌ Zen V2 性能退化（嚴重問題）

### 1. **3-Level Chained Computed** ⚠️ 最嚴重
```
Zen V1: 66,656 ops/s
Zen V2:  9,339 ops/s  ⬇️ 7.14x SLOWER
Solid:  887,177 ops/s (94.99x faster than V2)
```

### 2. **Diamond Dependency Graph**
```
Zen V1: 522,054 ops/s
Zen V2:  76,468 ops/s  ⬇️ 6.82x SLOWER
Solid: 5,835,197 ops/s (76.31x faster than V2)
```

### 3. **5-Level Deep Tree**
```
Zen V1: 457,346 ops/s
Zen V2:  66,506 ops/s  ⬇️ 6.88x SLOWER
Solid: 5,696,596 ops/s (85.65x faster than V2)
```

### 4. **10 Sources (Auto-track)**
```
Zen V1: 402,584 ops/s
Zen V2:  74,828 ops/s  ⬇️ 5.38x SLOWER
Solid: 1,605,960 ops/s (21.46x faster than V2)
```

### 5. **Computed Update Source** (100x)
```
Zen V1: 294,818 ops/s
Zen V2: 278,557 ops/s  ⬇️ 1.06x SLOWER
Solid: 7,156,798 ops/s (25.69x faster than V2)
```

---

## 🔍 問題根因分析

### **過度更新（Push-based Reactivity 的缺陷）**

#### Zen V2 當前實現（錯誤）
```typescript
// Signal setter - 立即更新所有 observers
function setter(newValue: T): void {
  node.value = newValue;

  // ❌ 立即更新所有 computed（即使沒人讀取）
  if (node.observers && batchDepth === 0) {
    const toUpdate = [...node.observers];
    for (let i = 0; i < toUpdate.length; i++) {
      updateComputed(toUpdate[i]);  // 強制計算
    }
  }
}
```

#### 3-Level Chain 場景
```typescript
const a = signal(1);
const b = computed(() => a() * 2);    // Level 1
const c = computed(() => b()! + 10);  // Level 2
const d = computed(() => c()! / 2);   // Level 3

a.set(5);  // 觸發瀑布式更新
```

**執行流程（Zen V2）**：
1. `a.set(5)` → 立即更新 `b` → 計算 `b()` → 立即更新 `c` → 計算 `c()` → 立即更新 `d` → 計算 `d()`
2. 總共：**3 次強制計算**（即使沒人讀取 d 的值）

**執行流程（Solid）**：
1. `a.set(5)` → 標記 `b`, `c`, `d` 為 dirty
2. 只有在 `d()` 被調用時才計算
3. 總共：**1 次按需計算**

---

## 🎯 SolidJS 的優勢策略

### 1. **Pull-Based Lazy Evaluation**
```javascript
// Solid: 只在讀取時計算
function readSignal() {
  if (this.dirty && this.sources) {
    // Pull: 先檢查上游是否真的改變
    updateComputation(this);
  }
  return this.value;
}
```

### 2. **Graph Coloring (避免重複計算)**
```
States:
- CLEAN (0): 確定乾淨
- GREEN (1): 可能受影響（需驗證）
- RED (2): 確定髒了

Phase 1 (Down): 源改變 → 標記下游為 GREEN
Phase 2 (Up): 讀取時 → 向上檢查，確定是否真的髒
```

### 3. **Bidirectional Slots (O(1) Unsubscribe)**
```javascript
// SolidJS
node.observers = [c1, c2, c3];
node.observerSlots = [0, 1, 2];  // ✅ O(1) removal

c1.sources = [a, b];
c1.sourceSlots = [0, 0];  // 反向索引
```

---

## 📈 改進建議

### **優先級 1: 實現 Pull-Based Lazy Evaluation**
```typescript
// 修改 setter - 只標記 dirty，不立即計算
function setter(newValue: T): void {
  if (Object.is(node.value, newValue)) return;

  node.value = newValue;

  // ✅ 只標記為 dirty，不計算
  if (node.observers && batchDepth === 0) {
    for (let i = 0; i < node.observers.length; i++) {
      markDirtyRecursive(node.observers[i]);
    }
  }
}

// getter 中才計算
function getter(): T | null {
  if (node.dirty) {
    updateComputed(node);  // Pull-based
  }
  return node.value;
}
```

### **優先級 2: Graph Coloring**
Zen V1 已有 Graph Coloring，Zen V2 應該採用。

### **優先級 3: 避免重複依賴追蹤**
當前 Zen V2 每次 `updateComputed` 都會重新訂閱所有 sources。應該只在真正需要時才重建依賴。

---

## 🎬 結論

### **Zen V2 適合的場景**
✅ 簡單狀態管理（讀寫頻繁，無複雜依賴）
✅ 獨立 signals（無依賴圖）
✅ Batching 操作

### **Zen V2 不適合的場景**
❌ 深層依賴鏈（3+ levels）
❌ 複雜依賴圖（diamond, fan-out）
❌ 大量 computed 但讀取不頻繁

### **最終建議**
**混合策略**：
- Zen V2 用於簡單狀態（signal, 1-level computed）
- Zen V1 (Graph Coloring) 用於複雜依賴圖
- 或者修復 Zen V2 的 push-based 問題，改為 pull-based

---

## 📊 性能對比總表

| 場景 | Zen V1 | Zen V2 | Solid | V2 vs V1 | V2 vs Solid |
|------|--------|--------|-------|----------|-------------|
| Creation | 45.1M | 45.8M | 48.4M | ✅ +1.6% | ⚠️ -5.5% |
| Read (1000x) | 192K | 1.1M | 3.8M | ✅ +469% | ⚠️ -70% |
| Write (1000x) | 195K | 3.2M | 3.7M | ✅ +1521% | ⚠️ -14% |
| Computed Read | 184K | 968K | 3.7M | ✅ +426% | ⚠️ -74% |
| 3-Level Chain | 66.7K | 9.3K | 887K | ❌ -86% | ❌ -99% |
| Diamond Graph | 522K | 76.5K | 5.8M | ❌ -85% | ❌ -99% |
| Batch | 442K | 2.4M | 8.9M | ✅ +445% | ⚠️ -73% |

**符號說明**:
- ✅ 顯著改進 (+50%以上)
- ⚠️ 落後但可接受 (-50%以內)
- ❌ 嚴重退化 (-50%以上)
