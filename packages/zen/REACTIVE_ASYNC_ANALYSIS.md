# Zen vs Jotai: Reactive Async 功能分析

## 問題：Zen不支持真正的Reactive Async

### ✅ Jotai - True Reactive Async

```typescript
// Jotai的async atom是reactive的
const baseAtom = atom(1);
const asyncAtom = atom(async (get) => {
  const base = get(baseAtom);  // 自動追蹤依賴
  return fetchData(base);
});

// 當baseAtom改變時：
// 1. asyncAtom自動失效
// 2. 再次讀取時自動重新計算
// 3. 所有訂閱者收到更新

set(baseAtom, 2);  // asyncAtom自動重新執行！
```

**特點**：
- ✅ 自動追蹤依賴（通過`get()`調用）
- ✅ 依賴改變時自動失效
- ✅ 自動重新執行async函數
- ✅ 完全符合reactive paradigm

---

### ❌ Zen Karma - Async Task Runner (NOT Reactive)

```typescript
// Zen的karma只是帶緩存的task runner
const base = zen(1);
const fetchUser = karma(async (id: number) => fetchUserAPI(id));

// 需要手動調用
await runKarma(fetchUser, get(base));

// 當base改變時：
set(base, 2);  // karma不會自動重新執行！❌

// 必須手動再次調用
await runKarma(fetchUser, get(base));  // 手動觸發
```

**特點**：
- ❌ 不追蹤依賴
- ❌ 不會自動失效
- ❌ 需要手動觸發
- ✅ 有緩存機制
- ✅ 支持訂閱（但不會自動更新）

---

## 對比表格

| 功能 | Jotai Async Atom | Zen Karma |
|------|------------------|-----------|
| **自動追蹤依賴** | ✅ 通過`get()` | ❌ 無 |
| **依賴改變時自動失效** | ✅ | ❌ |
| **自動重新執行** | ✅ | ❌ 需手動 |
| **緩存** | ✅ | ✅ |
| **訂閱** | ✅ | ✅ |
| **Stale-while-revalidate** | ✅ | ✅ |
| **範式** | Reactive | Imperative |

---

## 為什麼Zen缺少Reactive Async？

### 1. **API設計哲學不同**

**Jotai**: Getter-based dependency tracking
```typescript
atom(async (get) => {
  const dep = get(someAtom);  // 隱式追蹤
  return fetchData(dep);
});
```

**Zen**: Function-based API
```typescript
karma(async (id: number) => {
  // id只是參數，不追蹤來源
  return fetchUserAPI(id);
});
```

### 2. **實現複雜度**

要實現真正的reactive async，需要：
- ✅ Dependency tracking system（Zen已有 - computed用）
- ✅ Automatic invalidation（Zen已有 - markDirty）
- ❌ **Async dependency graph management（缺失）**
- ❌ **Async computation lifecycle（缺失）**

### 3. **Zen的computed是同步的**

```typescript
// Zen的computed只支持同步
const fullName = computed([firstName, lastName], (first, last) => {
  return `${first} ${last}`;  // 必須同步返回
});

// 不支持async！
const user = computed([userId], async (id) => {
  return fetchUser(id);  // ❌ 不支持！
});
```

---

## 用戶需要什麼？

### 場景1: 基於其他信號的async computed

```typescript
// 想要這樣：
const userId = zen(1);
const user = asyncComputed([userId], async (id) => {
  return fetchUser(id);
});

// 期望行為：
set(userId, 2);  // user自動重新fetch！
```

### 場景2: 多依賴的async computed

```typescript
const baseUrl = zen('https://api.example.com');
const userId = zen(1);

const userProfile = asyncComputed(
  [baseUrl, userId],
  async (url, id) => {
    return fetch(`${url}/users/${id}`).then(r => r.json());
  }
);

// 任一依賴改變，自動重新fetch
set(userId, 2);  // ✅ 自動refetch
set(baseUrl, 'https://api2.example.com');  // ✅ 自動refetch
```

---

## 可能的解決方案

### 選項1: 實現 `computedAsync()` （推薦）

```typescript
/**
 * 真正的reactive async computed
 * 類似Jotai的async atom
 */
export function computedAsync<T, Deps extends AnyZen[]>(
  deps: [...Deps],
  asyncFn: (...values: ZenValues<Deps>) => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
  }
): ComputedAsyncZen<T> {
  // 實現：
  // 1. 訂閱所有依賴
  // 2. 當任一依賴改變時，markDirty
  // 3. 重新執行asyncFn
  // 4. 通知訂閱者
}
```

**用法**：
```typescript
const userId = zen(1);
const user = computedAsync([userId], async (id) => {
  return fetchUser(id);
});

// 自動追蹤！
set(userId, 2);  // user自動重新fetch
```

### 選項2: 增強現有 `computed()` 支持async

```typescript
// 讓computed自動檢測async函數
const user = computed([userId], async (id) => {
  return fetchUser(id);
});

// 返回 ComputedAsyncZen<T> 而非 ComputedZen<Promise<T>>
```

### 選項3: 保持現狀，用戶自己實現

```typescript
// 手動創建reactive async
const userId = zen(1);
const user = zen<User | null>(null);

effect([userId], async (id) => {
  const data = await fetchUser(id);
  set(user, data);
});
```

**問題**：
- ❌ 沒有loading state
- ❌ 沒有error handling
- ❌ 沒有緩存
- ❌ 沒有stale-while-revalidate

---

## 推薦實現：`computedAsync`

### API設計

```typescript
type ComputedAsyncZen<T> = {
  _kind: 'computedAsync';
  _value: ZenAsyncState<T>;
  _deps: AnyZen[];
  _asyncFn: (...args: any[]) => Promise<T>;
  _staleTime?: number;
  // ...
};

export function computedAsync<T, Deps extends AnyZen[]>(
  deps: [...Deps],
  asyncFn: (...values: ZenValues<Deps>) => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    onError?: (error: Error) => void;
  }
): ComputedAsyncZen<T>;
```

### 使用示例

```typescript
// 基本用法
const userId = zen(1);
const user = computedAsync([userId], async (id) => {
  return fetchUser(id);
});

// 讀取狀態
const state = get(user);  // { loading, data, error }

// 訂閱
subscribe(user, (state) => {
  if (state.loading) console.log('Loading...');
  if (state.data) console.log('User:', state.data);
  if (state.error) console.log('Error:', state.error);
});

// 依賴改變時自動重新fetch
set(userId, 2);  // ✅ 自動觸發重新fetch
```

### 實現要點

1. **訂閱所有依賴**：
   ```typescript
   for (const dep of deps) {
     subscribe(dep, () => {
       markDirty(computedAsync);
       triggerRefetch();
     });
   }
   ```

2. **Lazy evaluation**：
   - 只在有訂閱者時才執行
   - 第一個訂閱者觸發初始fetch

3. **Loading/Error states**：
   ```typescript
   _value: {
     loading: boolean;
     data: T | undefined;
     error: Error | undefined;
   }
   ```

4. **防止競態條件**：
   ```typescript
   let latestPromise: Promise<T> | null = null;

   async function refetch() {
     const promise = asyncFn(...depValues);
     latestPromise = promise;

     const result = await promise;

     // 只有最新的promise才更新
     if (promise === latestPromise) {
       set(computedAsync._value, { loading: false, data: result });
     }
   }
   ```

---

## 結論

### 現狀
- ✅ Zen有`karma`/`zenAsync`（async task runner with cache）
- ❌ Zen沒有reactive async（自動追蹤依賴的async computed）

### 用戶需求
用戶需要像Jotai一樣的reactive async atom：
- 當依賴改變時自動失效
- 自動重新執行async函數
- 自動通知訂閱者

### 建議
**實現 `computedAsync()`**：
- 符合Zen的API風格（依賴數組在前）
- 提供完整的reactive async支持
- 保持backward compatibility（karma仍然可用）

---

## 下一步

1. **評估優先級**：這個功能對用戶有多重要？
2. **API設計review**：確認`computedAsync`的API設計
3. **實現**：核心邏輯約200-300行
4. **測試**：邊緣情況（競態條件、錯誤處理、緩存）
5. **文檔**：與karma的區別、使用場景

---

## FAQ

**Q: 為什麼不直接增強karma支持reactive？**

A: Karma的設計是explicit（手動調用），改成reactive會breaking change。更好的方式是新增`computedAsync`。

**Q: computedAsync vs karma，何時用哪個？**

- **computedAsync**: 當你需要基於其他signals的async computed（reactive）
- **karma**: 當你需要手動控制何時fetch（imperative）

**Q: 性能影響？**

- computedAsync會訂閱依賴，有輕微開銷
- 但換來的是自動化，減少手動代碼
- 可以通過staleTime優化（避免過度refetch）

**Q: 與TanStack Query的關係？**

- TanStack Query: 專注於server state管理（緩存、refetch策略）
- computedAsync: 專注於reactive dependency tracking
- 可以結合使用：`computedAsync([userId], (id) => queryClient.fetchQuery(...))`
