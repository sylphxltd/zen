# Zen V7c 失敗分析：為什麼 Graph Coloring 不能與永久依賴結合

## 🎯 V7c 的目標

嘗試結合：
1. V1 的 graph coloring (CLEAN/GREEN/RED)
2. V4 的永久依賴（只在首次運行時追蹤）
3. V7b 的單態化函數

**預期**:
- Diamond: 400-500K ops/s (接近 V1 的 547K)
- Write: 1M+ ops/s (接近 V4 的 1.28M)

## ❌ 結果：完全失敗

所有測試都失敗，甚至最簡單的 3-level chain 也無法工作。

```
預期: 10
實際: 6

預期: 25
實際: 13
```

計算沒有正確更新。

---

## 🔍 根本原因分析

### V1 Graph Coloring 的工作原理

```typescript
// V1: 每次更新時重新追蹤依賴

function update(node) {
  // ✅ 清理舊依賴
  cleanupDependencies(node);

  // ✅ 重新追蹤
  trackingContext.push(node);
  node.value = node.fn();  // 執行時會追蹤新依賴
  trackingContext.pop();
}

// Graph coloring 的意義：
// - GREEN: 可能需要更新（sources changed）
// - 通過檢查 sources 確定是否真的需要更新
// - 避免不必要的計算
```

**關鍵假設**: computed 函數會被重新執行，依賴會被重新追蹤

### V4 永久依賴的工作原理

```typescript
// V4: 依賴永久保存，不重新追蹤

function update(node) {
  const isFirstRun = node.sources === null;

  if (isFirstRun) {
    // ✅ 只在第一次追蹤依賴
    trackingContext.push(node);
  }

  node.value = node.fn();  // 執行，但不追蹤（除非首次）

  if (isFirstRun) {
    trackingContext.pop();
  }

  node.updatedAt = ++ExecCount;
}

// Timestamp 的意義：
// - 快速判斷是否需要更新（O(1) 比較）
// - 不需要重新追蹤依賴
```

**關鍵假設**: 依賴關係不變，只需檢查時間戳

---

## 💥 根本矛盾

### Graph Coloring 需要什麼？

1. **重新執行 computed 函數** 來確定是否真的需要更新
2. **依賴可能改變** (動態依賴圖)
3. **檢查 source 的 color** 來決定是否更新

### 永久依賴需要什麼？

1. **不重新追蹤依賴** (性能優化)
2. **依賴關係固定** (靜態依賴圖)
3. **使用時間戳** 判斷是否需要更新

### 為什麼不兼容？

```typescript
// V7c 嘗試的邏輯：

function getter() {
  if (node.color === GREEN) {
    // ❌ 問題：檢查 sources 的 color
    if (checkSourcesClean(node)) {
      node.color = CLEAN;
      return node.value;  // ❌ 沒有更新！
    }
    node.color = RED;
  }

  if (node.color === RED) {
    update(node);  // ✅ 更新
    // ❌ 但是在 update 中，我們不重新追蹤依賴（永久依賴）
    // ❌ 所以如果依賴圖改變了，我們不知道
  }
}

function checkSourcesClean(node) {
  for (const src of node.sources) {
    if (src.color === RED) {
      return false;  // ❌ source 是 RED，但我們沒有更新它！
    }
    if (src.color === GREEN) {
      // ❌ 遞歸檢查，但仍然沒有更新
      if (!checkSourcesClean(src)) {
        return false;
      }
    }
  }
  return true;
}
```

**核心問題**:
- Graph coloring 假設我們會執行所有 RED 的 computed
- 但我們只在 getter 被調用時才執行
- 當檢查 source 的 color 時，我們沒有觸發 source 的更新
- 導致計算基於舊值

---

## 🤔 為什麼 V1 可以工作？

V1 使用 graph coloring + **動態依賴追蹤**：

```typescript
// V1: 每次更新都重新訂閱

function update(node) {
  // 1. 清理舊依賴
  for (const src of node.sources) {
    src.observers.remove(node);
  }
  node.sources = [];

  // 2. 執行並重新追蹤
  trackingContext.push(node);
  node.value = node.fn();  // ✅ 會重新追蹤依賴
  trackingContext.pop();

  // 3. 現在 node.sources 是最新的
}
```

**關鍵**: 每次更新都重新追蹤，所以依賴總是最新的。

---

## 🎓 關鍵學習

### 1. 兩種策略本質不兼容

| 方面 | Graph Coloring | 永久依賴 |
|------|----------------|----------|
| **依賴追蹤** | 每次重新追蹤 | 只追蹤一次 |
| **依賴圖** | 動態 | 靜態 |
| **更新判斷** | Color check | Timestamp check |
| **開銷** | 重新訂閱 | 無重新訂閱 |

### 2. 為什麼 V1 在複雜圖最快？

V1 的 graph coloring 配合動態依賴：
- **避免不必要的計算** (GREEN check)
- **依賴總是準確** (每次重新追蹤)
- **適合複雜但穩定的依賴圖**

但代價是：
- 重新訂閱開銷
- API 笨拙 (`get/set`)

### 3. 為什麼 V4 在寫入最快？

V4 的永久依賴 + timestamp：
- **零重新訂閱開銷**
- **O(1) dirty check**
- **適合頻繁寫入**

但代價是：
- 複雜圖性能一般（需要遞歸檢查 timestamp）
- 假設依賴圖靜態

### 4. 為什麼 V7c 失敗？

嘗試結合兩種不兼容的策略：
- 用 graph coloring 判斷（假設動態依賴）
- 但不重新追蹤（假設靜態依賴）
- **根本矛盾**

---

## 💡 正確的方向

### 如果要優化複雜圖...

**選項 A: 保留 V1 的方式**
- Graph coloring + 動態依賴追蹤
- 現代 API (bound function)
- 接受重新訂閱的開銷

**選項 B: 改進 V4/V7b**
- 永久依賴 + timestamp
- 更好的 timestamp 檢查邏輯
- 減少遞歸深度

**選項 C: 放棄**
- V4/V7b 已經足夠好
- 與 Solid 的差距可能需要編譯器
- 不值得繼續優化運行時

---

## 🏆 最終建議

### 承認現實

V1-V7b 的迭代已經證明：

1. **V1 (Graph coloring)**: 複雜圖最快，但 API 差
2. **V4 (永久依賴)**: 最平衡，推薦大多數場景
3. **V7b (單態化)**: 複雜圖比 V4 好 6-11%

**這三種策略各有優勢，無法簡單結合。**

### 停止優化運行時

理由：
1. **V4/V7b 已經足夠好** - 比 V1 基礎操作快 5-6x
2. **與 Solid 差距需要編譯器** - 25-44x 差距不是運行時能解決的
3. **收益遞減** - V4→V7b 只提升 6-11%，再優化意義不大

### 未來方向

如果真的需要更快：
1. **編譯器**: 構建時優化，內聯一切
2. **混合策略**: 簡單場景用 V4，複雜圖用 V1
3. **接受現實**: 使用 SolidJS

---

## 📊 V7c vs 其他版本

| 版本 | 策略 | Diamond | Write | 狀態 |
|------|------|---------|-------|------|
| V1 | Graph + 動態 | **547K** | 179K | ✅ 成功 |
| V4 | Timestamp + 永久 | 223K | **1.16M** | ✅ 成功 |
| V7b | 單態 + 永久 | 238K | 783K | ✅ 成功 |
| V7c | Graph + 永久 | **❌ 失敗** | **❌ 失敗** | ❌ **測試都過不了** |

---

## 🎬 結語

V7c 的失敗不是實現問題，而是設計問題。

**兩種優秀但不兼容的策略：**
- V1 的 graph coloring (需要動態依賴)
- V4 的永久依賴 (需要靜態依賴)

**教訓：**
- 不是所有優化都能結合
- 理解根本假設很重要
- 有時候需要選擇，不能都要

**最終結論：**
- **V4**: 通用最佳 ⭐
- **V7b**: 複雜圖最優 ⭐⭐
- **V1**: 極端複雜圖（願意犧牲 API）

**停止優化運行時，V4/V7b 已經足夠好。**

---

**分析完成日期**: 2025-01-XX
**V7c 狀態**: 失敗，無法修復
**建議**: 放棄 V7c，使用 V4 或 V7b
