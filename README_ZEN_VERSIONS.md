# Zen 版本指南

## 📦 可用版本

本項目包含 Zen 響應式庫的 6 個主要版本，每個版本都有不同的設計理念和性能特徵。

## 🚀 快速選擇

```
你需要...                           → 使用這個版本
─────────────────────────────────────────────────────
✅ 最佳綜合性能                      → V4
✅ 讀密集 + 複雜依賴圖                → V6
✅ 極端複雜依賴圖（願意手動 API）      → V1
✅ 穩定生產環境                      → V1 或 V4
✅ 學習響應式原理                    → V4
🚫 不確定選哪個                      → V4
```

## 📋 版本概覽

### V1 - Production Stable (Current)
```typescript
import { zen, get, set } from './zen';
import { computed } from './computed';

const count = zen(0);
const doubled = computed([count], (x) => x * 2);

set(count, 5);
console.log(get(doubled)); // 10
```

**特點：**
- 🎨 Graph coloring algorithm
- 📝 Manual dependency declaration
- ⚡ **最快的複雜依賴圖性能** (Diamond: 575K ops/s)
- 🐌 較慢的基礎操作 (Read: 195K ops/s)
- ✅ 生產環境穩定

**適用場景：**
- 遺留代碼
- 極端複雜的依賴圖
- 需要最穩定的版本

---

### V2 - Push-based (⚠️ 不推薦)
```typescript
import { signal, computed } from './zen-v2';

const count = signal(0);
const doubled = computed(() => count() * 2);

count.set(5);
console.log(doubled()); // 10
```

**特點：**
- ✅ Bound function API
- ⚡ 快速基礎操作 (1.1M ops/s)
- ❌ Push-based 導致過度計算
- 🐌 **極慢的複雜依賴圖** (3-Level: 7.5K ops/s)

**為什麼不推薦：**
複雜依賴圖性能比 V1 慢 10 倍

---

### V3 - Failed Hybrid (⚠️ 不推薦)
```typescript
import { signal, computed } from './zen-v3';

const count = signal(0);
const doubled = computed(() => count() * 2);

count.set(5);
console.log(doubled()); // 10
```

**特點：**
- ✅ Bound function + Pull-based
- ⚠️ 依賴重新訂閱開銷大
- 🐌 寫入性能下降 (710K ops/s)

**為什麼不推薦：**
V4 在各方面都更好

---

### V4 - Best Balanced ⭐ (推薦)
```typescript
import { signal, computed } from './zen-v4';

const count = signal(0);
const doubled = computed(() => count() * 2);

count.set(5);
console.log(doubled()); // 10
```

**特點：**
- ✅ Bound function API
- ✅ Pure pull-based (lazy evaluation)
- ✅ Timestamp tracking (O(1) dirty check)
- ✅ **永久依賴** (no re-subscription overhead)
- ⚡ **最快寫入** (1.28M ops/s)
- ⚡ 平衡的複雜圖性能 (Diamond: 224K ops/s)
- 🎯 **代碼最簡潔易維護**

**性能數據：**
```
Read:     1.12M ops/s
Write:    1.28M ops/s (最快)
3-Level:  17.8K ops/s
Diamond:  224K ops/s
5-Level:  118K ops/s
```

**適用場景：**
- ✅ 新項目
- ✅ 平衡的讀寫需求
- ✅ 需要簡潔易維護的代碼
- ✅ 不確定選哪個版本

**為什麼推薦：**
最佳的性能與複雜度平衡

---

### V5 - Ambitious Failure ❌ (不推薦)
```typescript
import { signal, computed } from './zen-v5';

const count = signal(0);
const doubled = computed(() => count() * 2);

count.set(5);
console.log(doubled()); // 10
```

**特點：**
- ✅ Graph coloring
- ✅ Inline dependency tracking
- ❌ **SolidJS-style cleanup 開銷過大**
- 🐌 **所有指標都比 V4 差**

**性能數據：**
```
Write:    648K ops/s  (比 V4 慢 50%)
3-Level:  10.3K ops/s (比 V4 慢 42%)
Diamond:  79.9K ops/s (比 V4 慢 64%)
5-Level:  68.3K ops/s (比 V4 慢 42%)
```

**為什麼失敗：**
依賴清理/重建開銷 > inline 收益

**教訓：**
- 不要一次結合太多優化
- SolidJS 的模式不一定適用

---

### V6 - Refined Hybrid (特定場景推薦)
```typescript
import { signal, computed } from './zen-v6';

const count = signal(0);
const doubled = computed(() => count() * 2);

count.set(5);
console.log(doubled()); // 10
```

**特點：**
- ✅ V4 的 timestamp tracking (proven)
- ✅ Inline dependency tracking (selective)
- ✅ 永久依賴 (no cleanup like V5)
- ⚡ **複雜圖比 V4 快 8-17%**
- 🐌 寫入比 V4 慢 40%

**性能數據：**
```
Read:     1.12M ops/s (= V4)
Write:    760K ops/s  (比 V4 慢 40%)
3-Level:  20.9K ops/s (比 V4 快 17%) ✅
Diamond:  241K ops/s  (比 V4 快 8%)  ✅
5-Level:  131K ops/s  (比 V4 快 11%) ✅
```

**適用場景：**
- ✅ 讀密集型應用 (讀:寫 > 10:1)
- ✅ 複雜依賴圖
- ⚠️ 寫入不頻繁

**為什麼特定場景：**
權衡了寫入性能來提升讀取性能

---

## 📊 性能對比總覽

| 測試 | V1 | V4 ⭐ | V6 | Solid |
|------|-------|--------|-------|-------|
| **Read** | 195K | **1.12M** | 1.12M | 3.79M |
| **Write** | 171K | **1.28M** | 760K | 3.73M |
| **3-Level** | **75K** | 17.8K | 20.9K | 930K |
| **Diamond** | **575K** | 224K | 241K | 6.09M |
| **5-Level** | **597K** | 118K | 131K | 5.87M |

### 關鍵洞察

1. **V1** 在極端複雜圖中仍然最快（但 API 較差）
2. **V4** 是最平衡的選擇（推薦大多數場景）
3. **V6** 在複雜圖中比 V4 快，但寫入較慢
4. **Solid** 仍然遙遙領先（3-90x）

## 🎯 選擇決策樹

```
開始
  │
  ├─ 需要最快的複雜依賴圖性能？
  │  └─ YES → 願意使用手動 API？
  │     ├─ YES → V1
  │     └─ NO → V6
  │
  ├─ 讀密集 + 複雜圖？
  │  └─ YES → V6
  │
  ├─ 寫密集？
  │  └─ YES → V4
  │
  └─ 不確定 / 平衡使用
     └─ V4 ⭐
```

## 📝 遷移指南

### 從 V1 遷移到 V4

```typescript
// Before (V1)
import { zen, get, set } from './zen';
import { computed } from './computed';

const count = zen(0);
const doubled = computed([count], (x) => x * 2);

set(count, 5);
const value = get(doubled);

// After (V4)
import { signal, computed } from './zen-v4';

const count = signal(0);
const doubled = computed(() => count() * 2);

count.set(5);
const value = doubled();
```

**優勢：**
- ✅ API 更簡潔直觀
- ✅ 自動依賴追蹤
- ✅ 基礎操作快 6 倍

**劣勢：**
- ⚠️ 極端複雜圖可能慢 2-3 倍

### 從 V4 遷移到 V6

```typescript
// V4 和 V6 的 API 完全相同！
import { signal, computed } from './zen-v6';
// 其餘代碼不變
```

**優勢：**
- ✅ 複雜圖快 8-17%
- ✅ API 完全兼容

**劣勢：**
- ⚠️ 寫入慢 40%（如果寫入頻繁請勿遷移）

## 🔬 測試和驗證

所有版本都通過相同的測試套件：

```bash
# 運行功能測試
bun test packages/zen/src/zen-v4.test.ts
bun test packages/zen/src/zen-v6.test.ts

# 運行性能測試
bun vitest bench --run packages/zen/src/final-ultimate-benchmark.bench.ts
```

## 📚 詳細文檔

- **ZEN_V2_ULTIMATE_REPORT.md** - 完整的六版本分析報告
- **ZEN_OPTIMIZATION_SUMMARY.md** - 優化過程一圖看懂
- **ZEN_V7_PROPOSAL.md** - 下一步優化提案
- **ZEN_FINAL_ANALYSIS.md** - V1-V4 的初步分析

## 🏆 推薦配置

### 默認推薦（90% 場景）

```typescript
import { signal, computed, batch } from './zen-v4';

export { signal, computed, batch };
```

### 高性能複雜圖

```typescript
import { signal, computed, batch } from './zen-v6';

export { signal, computed, batch };
```

### 遺留代碼 / 極端性能

```typescript
import { zen, get, set } from './zen';
import { computed } from './computed';

export { zen, get, set, computed };
```

## ⚠️ 注意事項

1. **不要使用 V2, V3, V5** - 它們是實驗性版本，性能不佳
2. **V6 的寫入性能** - 如果寫入頻繁，使用 V4
3. **API 兼容性** - V2-V6 的 API 兼容，V1 不兼容

## 🎓 學習資源

想理解響應式系統原理？推薦閱讀順序：

1. **zen-v4.ts** - 最簡潔的實現，理解核心概念
2. **zen-v6.ts** - 理解 inline optimization
3. **zen.ts (V1)** - 理解 graph coloring algorithm
4. **ZEN_V2_ULTIMATE_REPORT.md** - 理解權衡和優化過程

## 🚀 下一步

如果你需要更好的性能，查看 **ZEN_V7_PROPOSAL.md** 了解計劃中的優化。

---

**最後更新**: 2025-01-XX
**測試環境**: Bun 1.3.1 + Vitest 3.2.4
