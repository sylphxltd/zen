# Rapid 響應式架構分析

## 核心設計原則

### 1. Signals: Push-based (Immediate Sync)
**為什麼必須 immediate:**
- 職責：狀態變更通知
- 必須立即通知所有訂閱者，因為它們是響應式系統的基礎
- 延遲通知會導致狀態不一致

**代碼證據:**
```typescript
// signal.ts:131
notifyListeners(this, newValue, oldValue);
```

---

### 2. Computeds: Pull-based (Lazy)
**為什麼必須 lazy:**
- 職責：派生狀態計算
- 只在真正需要時才計算，避免浪費
- 自動解決 Diamond Problem (不會重複計算)

**例子 - Diamond Problem:**
```typescript
const a = signal(1);
const b = computed(() => a.value * 2);
const c = computed(() => a.value + 10);
const d = computed(() => b.value + c.value); // 依賴 b 和 c

a.value = 2;
// 如果 b, c, d 都是 immediate:
// b 計算 → d 計算 (第一次)
// c 計算 → d 計算 (第二次) ❌ 重複計算！

// Lazy 模式:
// a 改變 → 標記 b, c, d 為 dirty
// 訪問 d.value 時 → 才計算 b, c, d ✅ 只計算一次
```

**性能優勢:**
- 不需要的 computed 永遠不會計算
- 多個上游改變只觸發一次下游計算

**代碼證據:**
```typescript
// signal.ts:478-484
if (this._dirty) {
  updateComputed(this);  // Only compute when accessed AND dirty
}
return this._value;
```

---

### 3. Effects: Push-based (Immediate Sync)
**為什麼必須 immediate:**
- 職責：副作用執行 (DOM 更新, API 調用, logging)
- 用戶期望副作用是同步的、可預測的
- 延遲執行會導致 UI 不同步、用戶困惑

**例子 - 為什麼不能 lazy:**
```typescript
const count = signal(0);
effect(() => {
  document.title = `Count: ${count.value}`;
});

count.value = 5;
// 用戶期望: 立即看到 title 改變
// 如果 lazy: title 不會改變 (沒人 "pull" effect) ❌
```

**代碼證據:**
```typescript
// signal.ts:576
executeEffect(e);  // Immediate sync (outside batch)
```

---

## 對比其他框架

### SolidJS (same as Rapid)
- Signals: Immediate
- Computeds: Lazy
- Effects: Immediate
- ✅ **業界最優設計**

### Vue 3 (different)
- Ref: Immediate
- Computed: Lazy
- watchEffect: **Async (scheduler)**
- ⚠️ Effects 延遲到 microtask，可能導致 UI 閃爍

### MobX (different)
- Observable: Immediate
- Computed: **Lazy with caching**
- Reaction: Immediate
- ⚠️ 複雜的 transaction 機制

### Preact Signals (different)
- Signal: Immediate
- Computed: **Eager (immediate)**
- Effect: Immediate
- ❌ Diamond Problem 需要手動優化

---

## 為什麼 Rapid 的設計最優

### ✅ 優點
1. **性能**: Lazy computed 避免不必要計算
2. **正確性**: 自動解決 Diamond Problem
3. **直觀**: Effects 同步執行，符合預期
4. **簡單**: 不需要 scheduler/transaction

### 📊 行為一致性
```
數據流向:
Signal 改變 → (push) → 標記 Computed dirty → (push) → 觸發 Effect
                                              ↓
                            用戶訪問 → (pull) → Computed 計算
```

**一致性體現:**
- Push 層 (Signals → Effects): 立即傳播變更通知
- Pull 層 (Computeds): 按需計算
- 兩層各司其職，完美協作

---

## 結論

**唔係"兩個 immediate 一個 lazy"唔一致**
**而係"Push 層同步通知 + Pull 層按需計算"完美配合**

### 架構原則
1. **狀態變更 (Signals)** → Push, Immediate
2. **派生計算 (Computeds)** → Pull, Lazy
3. **副作用執行 (Effects)** → Push, Immediate
4. **組件渲染** → One-time, Fine-grained updates

### 類比
- Signals = 廣播電台 (主動推送)
- Computeds = 圖書館 (被動查詢)
- Effects = 警報器 (立即響應)

三者配合，構成最高效、最直觀的響應式系統。

---

## 參考
- SolidJS reactivity: https://www.solidjs.com/docs/latest/api#createeffect
- Diamond Problem: https://en.wikipedia.org/wiki/Multiple_inheritance#The_diamond_problem
- Implementation: `packages/rapid-signal-core/src/signal.ts`
