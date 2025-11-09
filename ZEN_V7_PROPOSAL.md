# Zen V7 提案：基於實證的下一步優化

## 🎯 目標

基於 V1-V6 的經驗，V7 的目標是：
1. **保持 V4 的簡潔性**
2. **改進複雜圖性能** (目標：接近 V1)
3. **不損害基礎操作性能** (目標：維持 V4 水平)
4. **縮小與 Solid 差距** (目標：<20x)

## 📊 當前性能瓶頸分析

### V6 vs Solid 差距來源

```typescript
// V6 的 signal getter (實測)
function getter(): T {
  if (Listener) {
    const sources = Listener.sources;
    if (!sources) {
      // 初始化：~10ns
      Listener.sources = [node];
      Listener.sourceSlots = [0];
      // ...
    } else {
      // ❌ 瓶頸 1: O(n) 重複檢查 (~20-50ns per check)
      for (let i = 0; i < sources.length; i++) {
        if (sources[i] === node) {
          found = true;
          break;
        }
      }
      // 添加依賴：~15ns
      if (!found) { ... }
    }
  }
  return node.value;  // ~2ns
}

// Solid 的 signal getter (推測)
function getter(): T {
  if (Listener) {
    // ✅ 無檢查，直接添加 (~8ns)
    sources[sources.length] = this;
    observers[observers.length] = Listener;
  }
  return this.value;  // ~2ns
}

// 性能差距來源：
// - 重複檢查：20-50ns
// - bidirectional slots 維護：~10ns
// - 總計：~30-60ns overhead per read
//
// 對於 1000 次讀取的 3-level chain:
// - V6: ~30-60µs overhead
// - Solid: ~8µs overhead
// - 差距：4-8x (與實測 44x 接近，考慮其他因素)
```

## 💡 V7 優化策略

### 方案 A：最小化依賴追蹤開銷（激進）

**核心理念**: 移除所有重複檢查，允許重複依賴

```typescript
/**
 * Zen V7a - Aggressive Inline (No Duplicate Check)
 */

export function signal<T>(initialValue: T): Signal<T> {
  const node: SNode<T> = {
    value: initialValue,
    updatedAt: 0,
    observers: null,
  };

  function getter(): T {
    // ✅ ZERO-OVERHEAD tracking
    if (Listener) {
      const sources = Listener.sources;
      if (!sources) {
        Listener.sources = [node];
        node.observers = [Listener];
      } else {
        // ✅ NO duplicate check - just append
        sources.push(node);
        (node.observers ??= []).push(Listener);
      }
    }
    return node.value;
  }

  function setter(newValue: T): void {
    if (Object.is(node.value, newValue)) return;
    node.value = newValue;
    ExecCount++;
    node.updatedAt = ExecCount;
  }

  // ... rest
}

export function computed<T>(fn: () => T): Computed<T> {
  const node: CNode<T> = {
    value: null,
    updatedAt: null,
    fn,
    sources: null,
    observers: null,
    equals: Object.is,
  };

  function getter(): T | null {
    if (needsUpdate(node)) {
      update(node);
    }

    // ✅ ZERO-OVERHEAD tracking
    if (Listener) {
      const sources = Listener.sources;
      if (!sources) {
        Listener.sources = [node];
        node.observers = [Listener];
      } else {
        sources.push(node);
        (node.observers ??= []).push(Listener);
      }
    }

    return node.value;
  }

  // ... rest
}

function update<T>(node: CNode<T>): void {
  const time = ++ExecCount;
  const isFirstRun = node.sources === null;

  let prevListener = null;
  if (isFirstRun) {
    prevListener = Listener;
    Listener = node;
  }

  let newValue: T;
  try {
    newValue = node.fn();
  } finally {
    if (isFirstRun) {
      Listener = prevListener;
    } else {
      // ✅ 去重：移除重複的依賴（只在非首次運行時）
      // 這樣攤銷成本，避免每次讀取都檢查
      deduplicateSources(node);
    }
  }

  const old = node.value;
  if (old !== null && node.equals(newValue, old)) {
    node.updatedAt = time;
    return;
  }

  node.value = newValue;
  node.updatedAt = time;
}

/**
 * 去重依賴（只在 computed 更新後調用一次）
 * 攤銷成本：O(n²) 但只在更新時運行，不在讀取時
 */
function deduplicateSources(node: CNode<any>): void {
  const srcs = node.sources;
  if (!srcs || srcs.length <= 1) return;

  const seen = new Set();
  let writeIdx = 0;

  for (let i = 0; i < srcs.length; i++) {
    const src = srcs[i];
    if (!seen.has(src)) {
      seen.add(src);
      srcs[writeIdx++] = src;
    }
  }

  // 截斷重複項
  if (writeIdx < srcs.length) {
    srcs.length = writeIdx;
  }
}
```

**預期性能：**
- Read: 維持 1.1M ops/s
- Write: **回到 1.28M ops/s** (移除 getter 中的重複檢查)
- 3-Level Chain: **+30-50%** (less overhead per read)
- Diamond: **+20-40%** (less overhead per read)

**風險：**
- 去重邏輯可能有 bug
- 非首次運行時的去重開銷

---

### 方案 B：單態化 + 最小字段（穩健）

**核心理念**: 減少數據結構開銷，單態函數

```typescript
/**
 * Zen V7b - Monomorphic + Minimal Fields
 */

// ✅ Signal 和 Computed 完全分離
type SNode<T> = {
  value: T;
  updatedAt: number;
  observers: CNode<any>[] | null;
};

type CNode<T> = {
  value: T | null;
  updatedAt: number | null;
  fn: () => T;
  sources: (SNode<any> | CNode<any>)[] | null;
  observers: CNode<any>[] | null;
  equals: (a: T, b: T) => boolean;
};

// ✅ 移除 observerSlots（簡化）
// Unsubscribe 時用 O(n) 查找，但實際很少 unsubscribe

function addSignalDependency(listener: CNode<any>, signal: SNode<any>): void {
  // ✅ 單態函數 - V8 優化友好
  const sources = listener.sources;
  if (!sources) {
    listener.sources = [signal];
    signal.observers = [listener];
  } else {
    // 簡化版本：只檢查最後一個（常見情況）
    if (sources[sources.length - 1] !== signal) {
      sources.push(signal);
      (signal.observers ??= []).push(listener);
    }
  }
}

function addComputedDependency(listener: CNode<any>, computed: CNode<any>): void {
  // ✅ 單態函數
  // ... 同樣邏輯
}
```

**預期性能：**
- 基礎操作: +5-10% (單態化 + 減少字段)
- 複雜圖: +10-20% (簡化邏輯)

**風險：**
- 較小，只是重構

---

### 方案 C：圖著色 + 永久依賴（結合最佳）

**核心理念**: V1 的圖著色 + V4 的永久依賴 + V6 的 inline

```typescript
/**
 * Zen V7c - Graph Coloring + Permanent Deps
 */

type SNode<T> = {
  value: T;
  color: 0 | 2;  // CLEAN or RED
  observers: CNode<any>[] | null;
};

type CNode<T> = {
  value: T | null;
  color: 0 | 1 | 2;  // CLEAN, GREEN, RED
  fn: () => T;
  sources: (SNode<any> | CNode<any>)[] | null;
  observers: CNode<any>[] | null;
  equals: (a: T, b: T) => boolean;
};

function setter(newValue: T): void {
  if (Object.is(node.value, newValue)) return;
  node.value = newValue;
  node.color = 2; // RED

  // ✅ 只標記直接依賴為 GREEN（不遞歸）
  const obs = node.observers;
  if (obs) {
    for (let i = 0; i < obs.length; i++) {
      const child = obs[i];
      if (child.color === 0) child.color = 1; // CLEAN -> GREEN
    }
  }
}

function getter(): T | null {
  // ✅ Graph coloring check
  if (node.color === 1) { // GREEN
    if (checkSourcesStillClean(node)) {
      node.color = 0; // CLEAN
      return node.value;
    }
    node.color = 2; // RED
  }

  if (node.color === 2) { // RED
    update(node);
  }

  // ✅ Permanent dependencies
  if (Listener && node.sources === null) {
    // Track dependency inline
  }

  return node.value;
}

function checkSourcesStillClean(node: CNode<any>): boolean {
  const srcs = node.sources;
  if (!srcs) return true;

  for (let i = 0; i < srcs.length; i++) {
    const src = srcs[i];
    if ('fn' in src) {
      // Computed source
      const csrc = src as CNode<any>;
      if (csrc.color === 2) return false; // RED
      if (csrc.color === 1) { // GREEN - check recursively
        if (!checkSourcesStillClean(csrc)) {
          csrc.color = 2;
          return false;
        }
        csrc.color = 0; // CLEAN
      }
    } else {
      // Signal source
      if (src.color === 2) return false; // RED
    }
  }

  return true;
}

function update<T>(node: CNode<T>): void {
  const isFirstRun = node.sources === null;

  let prevListener = null;
  if (isFirstRun) {
    prevListener = Listener;
    Listener = node;
  }

  let newValue: T;
  try {
    newValue = node.fn();
  } finally {
    if (isFirstRun) {
      Listener = prevListener;
    }
  }

  node.color = 0; // CLEAN

  const old = node.value;
  if (old !== null && node.equals(newValue, old)) {
    return;
  }

  node.value = newValue;

  // Mark downstream GREEN
  const obs = node.observers;
  if (obs) {
    for (let i = 0; i < obs.length; i++) {
      const child = obs[i];
      if (child.color === 0) child.color = 1; // CLEAN -> GREEN
    }
  }
}
```

**預期性能：**
- 接近 V1 在複雜圖的性能
- 保持 V4 的基礎操作性能
- Diamond: 400-500K ops/s (目標：接近 V1 的 575K)
- 3-Level: 40-60K ops/s (目標：接近 V1 的 75K)

**風險：**
- Graph coloring 實現複雜度
- 可能重蹈 V3 的覆轍

---

## 📊 方案對比

| 方案 | 預期提升 | 實現難度 | 風險 | 推薦度 |
|------|----------|----------|------|--------|
| **A: 激進 inline** | +30-50% 複雜圖 | 中 | 中 | 🟡 實驗性 |
| **B: 單態化** | +10-20% 全面 | 低 | 低 | 🟢 穩健 |
| **C: 圖著色** | +100-200% 複雜圖 | 高 | 高 | 🟡 高風險高回報 |

## 🎯 推薦實施順序

### 階段 1：低風險優化（1-2週）

實施**方案 B**：
1. 移除 `observerSlots`（簡化）
2. 單態化 `addDependency`
3. 減少字段（如果可能）

預期收益：+10-20% 全面提升
風險：極低

### 階段 2：實驗性優化（2-4週）

實施**方案 A**：
1. 移除重複檢查
2. 實現去重邏輯
3. 大量測試邊緣情況

預期收益：+30-50% 複雜圖
風險：中等，需要充分測試

### 階段 3：激進優化（4-8週）

實施**方案 C**（如果前兩個方案不夠）：
1. 重新實現圖著色（參考 V1）
2. 結合永久依賴
3. inline dependency tracking

預期收益：+100-200% 複雜圖
風險：高，可能失敗

## 🔬 驗證標準

每個方案必須通過：

1. **功能測試**：所有 V6 測試通過
2. **性能測試**：
   - Read ≥ V4 (1.1M ops/s)
   - Write ≥ V6 (760K ops/s, 目標 V4 的 1.28M)
   - 3-Level ≥ V6 (20.9K ops/s)
   - Diamond ≥ V6 (241K ops/s)
3. **回歸測試**：不能有任何指標比 V6 差 >10%

## 📝 實施檢查清單

### 方案 B（推薦先做）

- [ ] 創建 `zen-v7.ts`
- [ ] 移除 `observerSlots` 字段
- [ ] 創建 `addSignalDependency()` 函數
- [ ] 創建 `addComputedDependency()` 函數
- [ ] 內聯所有 dependency tracking
- [ ] 運行測試
- [ ] 運行 benchmark
- [ ] 與 V6 對比
- [ ] 如果成功，考慮方案 A

### 方案 A（如果 B 成功）

- [ ] 基於 V7b 創建 `zen-v7a.ts`
- [ ] 移除重複檢查邏輯
- [ ] 實現 `deduplicateSources()`
- [ ] 測試邊緣情況（多重依賴）
- [ ] 測試 diamond 依賴
- [ ] 測試動態依賴變化
- [ ] Benchmark
- [ ] 與 V7b 對比

## 🎓 經驗教訓應用

基於 V1-V6 的教訓：

1. ✅ **保持簡單** - V4 之所以好就是因為簡單
2. ✅ **逐步優化** - 不要一次改太多（V5 的教訓）
3. ✅ **充分測試** - 每個優化都要 benchmark
4. ✅ **允許失敗** - 有些優化可能無效（V5）
5. ✅ **性能 tradeoff** - 寫入 vs 讀取（V6 的教訓）

## 🏁 成功標準

V7 成功的標準：

**最低要求：**
- Diamond: >260K ops/s (V6 的 +8%)
- Write: >800K ops/s (V6 的 +5%)
- 所有測試通過

**理想目標：**
- Diamond: >400K ops/s (接近 V1)
- Write: >1.2M ops/s (接近 V4)
- 與 Solid 差距 <20x

**夢想目標：**
- Diamond: >500K ops/s (= V1)
- Write: >1.5M ops/s (> V4)
- 與 Solid 差距 <10x

---

**下一步**: 實施方案 B，驗證假設
