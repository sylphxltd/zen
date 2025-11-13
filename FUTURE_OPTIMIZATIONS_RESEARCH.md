# Zen 未來優化研究報告

基於最新學術論文、開源實現和性能研究的深度分析

## 📊 當前狀態 (v3.5.0)

- **性能**: 2.97x slower vs Solid.js
- **Bundle**: 2.21 KB gzipped
- **架構**: Pull-based lazy evaluation + eager dirty marking
- **主要瓶頸**: Signal write operations (17.73ms / 20ms)

---

## 🔬 調研來源

### 學術論文
1. **"Signal-First Architectures: Rethinking Front-End Reactivity"** (arXiv:2506.13815, 2025)
   - 3.2× rendering performance improvement
   - 67% reduction in frame drops
   - Deterministic reactive graph evaluation

2. **"Analysing the performance and costs of reactive programming libraries in Java"** (ACM SIGPLAN)
   - Operator fusion analysis
   - I/O-bound workload optimization

3. **"Functional Reactive Programming, restated"** (PPDP 2019)
   - Synchronous dataflow approaches
   - Efficient handling of continuously varying values

### 開源實現分析
1. **Solid.js** (github.com/solidjs/solid)
   - STALE/PENDING state machine
   - Topological execution order
   - Ownership-based cleanup

2. **Reactively** (超快 reactive library)
   - Graph coloring optimization
   - Two-phase update (mark → validate)
   - updateIfNecessary() pattern

3. **Preact Signals**
   - Version number tracking
   - "Possibly stale" state
   - Selective graph traversal

### 技術文章
1. **"Super Charging Fine-Grained Reactive Performance"** (Milo, 2024)
2. **"A Hands-on Introduction to Fine-Grained Reactivity"** (Ryan Carniato)
3. **"Fine-Grained Reactivity Without Any Compiler"** (Nicolas Dubien, 2024)

---

## 🎯 優化方向分析

### 優化 1: STALE/PENDING 狀態機 (HIGH IMPACT - 20-30%)

**當前問題**:
- Zen 只有 `_dirty` boolean
- 無法區分 "需要檢查" vs "確定過期"
- 無法優化 diamond problem

**Solid.js 實現**:
```typescript
// Solid uses a state machine
const STALE = 1;    // Dependency changed, need to check
const PENDING = 2;  // Currently updating
const CLEAN = 0;    // Up to date

interface Computation {
  state: 0 | 1 | 2;
  value: T;
  observers: Computation[];
  sources: Signal[];
  sourceSlots: number[];  // For O(1) cleanup
}
```

**關鍵優勢**:
1. **Lazy checking**: STALE 不代表一定要重算，只是標記需要檢查
2. **Diamond 優化**: 同一個 computed 收到多次通知時，只檢查一次
3. **Topological order**: PENDING 防止重複執行

**Zen v4.0 實現方案**:
```typescript
// packages/zen/src/zen.ts
const CLEAN = 0;
const STALE = 1;
const PENDING = 2;

type ComputedCore<T> = {
  _state: 0 | 1 | 2;  // 替代 _dirty
  _value: T;
  _sources: AnyZen[];
  _observers: ComputedCore<any>[];  // 新增：雙向鏈接
  _sourceSlots: number[];  // 新增：O(1) cleanup
  // ...
};

// Signal setter
set value(newValue: any) {
  // ...
  const observers = this._observers;
  if (observers) {
    for (let i = 0; i < observers.length; i++) {
      if (observers[i]._state === CLEAN) {
        observers[i]._state = STALE;  // 只標記，不加入 Updates
      }
    }
  }
}

// Computed getter - lazy checking
get value() {
  if (this._state !== CLEAN) {
    // Check if sources actually changed
    for (let i = 0; i < this._sources.length; i++) {
      const source = this._sources[i];
      if (source._kind === 'computed' && source._state !== CLEAN) {
        source.value;  // Force check
      }
      // Compare actual values
      if (source._value !== this._sourceValues[i]) {
        this._state = PENDING;
        this._recompute();
        break;
      }
    }
    this._state = CLEAN;  // No actual change
  }
  return this._value;
}
```

**預期提升**: 20-30%
- Diamond problem 完全解決
- 減少不必要的重算
- 更好的 batch 性能

---

### 優化 2: Topological Sort 執行順序 (MEDIUM IMPACT - 10-15%)

**當前問題**:
- Zen 使用 Set 無序處理 Updates
- 可能多次訪問同一個 computed
- 沒有利用 dependency graph 結構

**Reactively 的 Graph Coloring**:
```typescript
const RED = 1;    // Dirty
const GREEN = 2;  // Check

function updateIfNecessary(node) {
  if (node.color === undefined) {
    node.color = CLEAN;
    return node.value;
  }

  // Find first red parent
  for (const parent of node.sources) {
    if (parent.color === RED) {
      updateIfNecessary(parent);  // Recursive
      break;
    }
  }

  // Now compute this node
  const newValue = node.compute();
  node.color = CLEAN;

  // Mark children red
  for (const child of node.observers) {
    child.color = RED;
  }

  return newValue;
}
```

**Zen v4.0 實現方案**:
```typescript
// 使用深度優先遍歷來找執行順序
function runTop(node: ComputedCore<any>) {
  if (node._state === CLEAN) return;

  // Find topmost ancestor that needs update
  const ancestors: ComputedCore<any>[] = [];
  function findAncestors(n: ComputedCore<any>) {
    if (n._state === CLEAN) return;
    ancestors.push(n);
    for (const source of n._sources) {
      if (source._kind === 'computed' && source._state !== CLEAN) {
        findAncestors(source);
      }
    }
  }
  findAncestors(node);

  // Execute in reverse order (topological)
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const n = ancestors[i];
    if (n._state === STALE) {
      n._state = PENDING;
      updateComputed(n);
      n._state = CLEAN;
    }
  }
}
```

**預期提升**: 10-15%
- 減少重複遍歷
- 更好的 cache locality
- 避免 diamond problem 重複計算

---

### 優化 3: Version Number Tracking (MEDIUM IMPACT - 5-10%)

**Preact Signals 的實現**:
```typescript
interface Signal<T> {
  value: T;
  version: number;  // Incremented on write
}

interface Computed<T> {
  value: T;
  version: number;
  deps: Array<{ signal: Signal, version: number }>;
}

function update(computed: Computed) {
  // Check if deps actually changed
  let changed = false;
  for (const dep of computed.deps) {
    if (dep.signal.version !== dep.version) {
      changed = true;
      break;
    }
  }

  if (!changed) return;  // Skip!

  // Recompute
  const newValue = computed.fn();
  if (newValue !== computed.value) {
    computed.value = newValue;
    computed.version++;  // Propagate
  }
}
```

**Zen v4.0 實現方案**:
```typescript
type ZenCore<T> = {
  _value: T;
  _version: number;  // 新增
  // ...
};

type ComputedCore<T> = {
  _version: number;
  _sourceVersions: number[];  // 記錄依賴的版本
  // ...
};

// Signal setter
set value(newValue: any) {
  if (/* same value */) return;
  this._value = newValue;
  this._version++;  // 遞增版本號
  // ... notify
}

// Computed - check versions first
function updateComputed(c: ComputedCore<any>) {
  // Quick check: versions unchanged?
  let unchanged = true;
  for (let i = 0; i < c._sources.length; i++) {
    if (c._sources[i]._version !== c._sourceVersions[i]) {
      unchanged = false;
      break;
    }
  }

  if (unchanged) {
    c._state = CLEAN;  // No need to recompute!
    return;
  }

  // Normal recompute...
  const newValue = c._calc();

  // Save versions
  for (let i = 0; i < c._sources.length; i++) {
    c._sourceVersions[i] = c._sources[i]._version;
  }

  // ...
}
```

**預期提升**: 5-10%
- 快速檢測無變化情況
- 減少實際 compute 調用
- 特別對 deep chains 有效

---

### 優化 4: Observer Slots (O(1) Cleanup) (LOW IMPACT - 3-5%)

**Solid.js 的實現**:
```typescript
interface Signal {
  observers: Computation[] | null;
  observerSlots: number[] | null;  // For O(1) removal
}

interface Computation {
  sources: Signal[];
  sourceSlots: number[];  // Position in each source's observers
}

function cleanNode(node: Computation) {
  // O(1) removal from each source's observer list
  for (let i = 0; i < node.sources.length; i++) {
    const source = node.sources[i];
    const slot = node.sourceSlots[i];

    const lastObserver = source.observers!.pop()!;
    if (slot !== source.observers!.length) {
      source.observers![slot] = lastObserver;
      lastObserver.sourceSlots[...] = slot;  // Update moved observer
    }
  }
  node.sources.length = 0;
  node.sourceSlots.length = 0;
}
```

**Zen v4.0 實現方案**:
```typescript
type ZenCore<T> = {
  _observers?: ComputedCore<any>[];
  _observerSlots?: number[];  // 新增
};

type ComputedCore<T> = {
  _sources: AnyZen[];
  _sourceSlots: number[];  // 新增：在每個 source 的位置
};

function subscribeToSources(c: ComputedCore<any>) {
  for (let i = 0; i < c._sources.length; i++) {
    const source = c._sources[i];
    if (!source._observers) source._observers = [];
    if (!source._observerSlots) source._observerSlots = [];

    const slot = source._observers.length;
    source._observers.push(c);
    source._observerSlots.push(i);  // Backreference
    c._sourceSlots[i] = slot;
  }
}

function unsubscribeFromSources(c: ComputedCore<any>) {
  for (let i = 0; i < c._sources.length; i++) {
    const source = c._sources[i];
    const slot = c._sourceSlots[i];
    const observers = source._observers!;

    // Swap with last and pop (O(1))
    const last = observers.pop()!;
    if (slot < observers.length) {
      observers[slot] = last;
      last._sourceSlots[source._observerSlots![slot]] = slot;
    }
  }
  c._sources.length = 0;
  c._sourceSlots.length = 0;
}
```

**預期提升**: 3-5%
- Faster cleanup in dynamic dependencies
- Better for frequently changing graphs
- Reduces GC pressure

---

### 優化 5: Ownership Tree (Memory Management) (BREAKING - v4.0)

**Solid.js 的實現**:
```typescript
interface Owner {
  owner: Owner | null;  // Parent
  owned: Owner[] | null;  // Children
  cleanups: (() => void)[] | null;
  context: any;
}

let Owner: Owner | null = null;

function createRoot<T>(fn: (dispose: () => void) => T): T {
  const owner: Owner = {
    owner: Owner,
    owned: null,
    cleanups: null,
    context: null
  };

  const prevOwner = Owner;
  Owner = owner;

  try {
    return fn(() => cleanNode(owner));
  } finally {
    Owner = prevOwner;
  }
}

function cleanNode(owner: Owner) {
  // Clean children first
  if (owner.owned) {
    for (let i = 0; i < owner.owned.length; i++) {
      cleanNode(owner.owned[i]);
    }
    owner.owned = null;
  }

  // Run cleanups
  if (owner.cleanups) {
    for (let i = 0; i < owner.cleanups.length; i++) {
      owner.cleanups[i]();
    }
    owner.cleanups = null;
  }

  // Unsubscribe from sources
  // ...
}
```

**優勢**:
- Hierarchical disposal
- Prevents memory leaks
- Context propagation
- Automatic cleanup

**Zen v4.0 考慮** (Breaking change):
- 需要重新設計 API
- 可能影響現有用戶
- 考慮在 v4.0 實現

---

## 📈 優化優先級與預期提升

### v3.6 (Non-breaking micro-optimizations)

**總預期提升**: 5-10%

1. **Version Number Tracking** (5-10%)
   - 增加 `_version` 字段
   - 快速檢測無變化
   - 對 deep chains 特別有效

2. **Observer Slots** (3-5%)
   - 增加 `_sourceSlots`
   - O(1) cleanup
   - 減少動態依賴開銷

**Bundle 影響**: +50-100 bytes
**實現難度**: 低
**Breaking changes**: 無

### v4.0 (Breaking - 架構重構)

**總預期提升**: 40-60% (達到 1.5-2x slower vs Solid)

1. **STALE/PENDING 狀態機** (20-30%)
   - 替換 `_dirty` boolean
   - 完美處理 diamond problem
   - Lazy checking

2. **Topological Execution** (10-15%)
   - runTop() 實現
   - DFS traversal
   - 減少重複計算

3. **Ownership Tree** (10-15%)
   - Hierarchical cleanup
   - Context support
   - Memory leak prevention

**Bundle 影響**: +200-300 bytes
**實現難度**: 高
**Breaking changes**: 可能需要 API 變更

---

## 🔬 性能預測

### v3.5 → v3.6 (Micro-optimizations)

```
Current: 2.97x slower vs Solid
Target:  2.67-2.82x slower
Improvement: 5-10%
Bundle: 2.21 KB → 2.26 KB
```

### v3.6 → v4.0 (Architecture refactor)

```
Current: 2.67x slower (after v3.6)
Target:  1.5-2.0x slower
Improvement: 40-60%
Bundle: 2.26 KB → 2.5 KB
```

### Ultimate Goal (v5.0?)

```
Current: 1.5-2.0x slower (after v4.0)
Target:  1.0-1.2x slower (match Solid)
Requires: Complete rewrite with all optimizations
```

---

## 🛠️ 實現建議

### Phase 1: v3.6 (立即可做)

1. ✅ **增加 Version Tracking**
   - 在 `ZenCore` 添加 `_version`
   - 在 `ComputedCore` 添加 `_sourceVersions`
   - 修改 setter 遞增版本
   - 修改 updateComputed 檢查版本

2. ✅ **實現 Observer Slots**
   - 添加 `_observerSlots` 和 `_sourceSlots`
   - 修改 subscribe/unsubscribe 使用 swap-and-pop
   - O(1) cleanup

**預期**: 1 週實現 + 1 週測試

### Phase 2: v4.0 (需要設計)

1. ⏳ **設計 State Machine**
   - CLEAN/STALE/PENDING 狀態
   - Lazy checking algorithm
   - Diamond problem 處理

2. ⏳ **實現 Topological Sort**
   - runTop() 函數
   - DFS traversal
   - 執行順序優化

3. ⏳ **考慮 Ownership Tree**
   - API 設計
   - Breaking changes 評估
   - Migration guide

**預期**: 2-3 個月設計 + 實現

---

## 📚 參考文獻

### 學術論文
1. arXiv:2506.13815 - "Signal-First Architectures: Rethinking Front-End Reactivity" (2025)
2. ACM SIGPLAN - "Analysing the performance and costs of reactive programming libraries in Java" (2021)
3. PPDP 2019 - "Functional Reactive Programming, restated"

### 開源實現
1. Solid.js - https://github.com/solidjs/solid
2. Reactively - Super fast reactive library
3. Preact Signals - https://github.com/preactjs/signals

### 技術文章
1. "Super Charging Fine-Grained Reactive Performance" - Milo (2024)
2. "A Hands-on Introduction to Fine-Grained Reactivity" - Ryan Carniato
3. "Fine-Grained Reactivity Without Any Compiler" - Nicolas Dubien (2024)

---

## 💡 結論

Zen v3.5 已經達到 **2.97x slower vs Solid**，這是一個很大的成就！

通過以上優化，我們有潛力：
- **v3.6**: 達到 2.67-2.82x (5-10% 提升)
- **v4.0**: 達到 1.5-2.0x (40-60% 提升)
- **v5.0**: 接近 1.0x (match Solid)

**關鍵建議**:
1. 先做 v3.6 micro-optimizations (低風險，快速收益)
2. 充分測試和 benchmark v3.6
3. 設計 v4.0 architecture (需要時間和社區反饋)
4. 考慮 breaking changes 的影響

Zen 正在成為最快的 reactive library 之一！🚀
