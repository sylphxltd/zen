# ZenJS Demo App - 真正的 JSX！

這才是 ZenJS 真正的寫法，像 SolidJS/React 一樣用 JSX！

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd /tmp/zenjs/demo-app
pnpm install
```

### 2. 啟動開發服務器

```bash
pnpm dev
```

### 3. 打開瀏覽器

```
http://localhost:5173
```

就可以看到真正的 JSX demo 了！⚡

---

## 📝 代碼示例

### ✅ 這才是正確的 ZenJS 寫法！

```tsx
import { signal, computed, For, Show } from 'zenjs';

function Counter() {
  const count = signal(0);
  const doubled = computed(() => count() * 2);

  return (
    <div>
      <h1>Count: {count}</h1>
      <p>Doubled: {doubled}</p>
      <button onClick={() => count.value++}>+</button>
    </div>
  );
}
```

### ✅ For 組件（列表渲染）

```tsx
function TodoList() {
  const todos = signal<Todo[]>([]);

  return (
    <For each={todos}>
      {(todo) => (
        <li>{todo.text}</li>
      )}
    </For>
  );
}
```

### ✅ Show 組件（條件渲染）

```tsx
function App() {
  const user = signal<User | null>(null);

  return (
    <Show when={user} fallback={<Login />}>
      {(u) => <Dashboard user={u} />}
    </Show>
  );
}
```

### ✅ batch() 性能優化

```tsx
function App() {
  const a = signal(0);
  const b = signal(0);
  const c = signal(0);

  const updateAll = () => {
    batch(() => {
      a.value = 1;
      b.value = 2;
      c.value = 3;
      // 只觸發一次 Effect！
    });
  };

  return <button onClick={updateAll}>Update</button>;
}
```

---

## 🎯 與 SolidJS/React 的對比

### SolidJS 寫法

```tsx
import { createSignal, createMemo, For, Show } from 'solid-js';

function Counter() {
  const [count, setCount] = createSignal(0);
  const doubled = createMemo(() => count() * 2);

  return (
    <div>
      <h1>Count: {count()}</h1>  {/* 需要 () */}
      <p>Doubled: {doubled()}</p>  {/* 需要 () */}
      <button onClick={() => setCount(count() + 1)}>+</button>
    </div>
  );
}
```

### ZenJS 寫法

```tsx
import { signal, computed, For, Show } from 'zenjs';

function Counter() {
  const count = signal(0);
  const doubled = computed(() => count() * 2);

  return (
    <div>
      <h1>Count: {count}</h1>  {/* 自動展開！ */}
      <p>Doubled: {doubled}</p>  {/* 自動展開！ */}
      <button onClick={() => count.value++}>+</button>
    </div>
  );
}
```

**差異**：
1. ✅ ZenJS：單一 `signal()` 調用
2. ✅ ZenJS：JSX 中自動展開（無需 `()`）
3. ✅ ZenJS：`.value` 寫入（更清晰）

---

## 📦 Demo 包含的組件

### 1. Counter
- Signal 響應式狀態
- Computed 自動派生
- Effect 自動更新 DOM

### 2. TodoList
- For 組件（列表渲染）
- Show 組件（條件渲染）
- batch() 性能優化
- Computed 過濾和統計

### 3. Performance
- batch() 前後對比
- Effect 執行次數統計

### 4. Conditional
- Show 組件
- Switch/Match 組件

---

## 🔍 項目結構

```
demo-app/
├── src/
│   ├── App.tsx        # 主組件（真正的 JSX！）
│   ├── main.tsx       # 入口文件
│   └── style.css      # 樣式
├── index.html         # HTML 模板
├── vite.config.ts     # Vite 配置
├── tsconfig.json      # TypeScript 配置
└── package.json
```

---

## ⚙️ Vite 配置要點

```ts
// vite.config.ts
export default defineConfig({
  esbuild: {
    jsx: 'automatic',        // 自動 JSX
    jsxImportSource: '../src',  // 指向 ZenJS 源碼
  },
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "../src"  // 使用 ZenJS 的 JSX 運行時
  }
}
```

---

## 🎨 特點

### ✅ 完全的 JSX 支持
- 組件化
- Props 傳遞
- 事件處理
- 條件渲染
- 列表渲染

### ✅ TypeScript
- 完整的類型推導
- Signal<T> 類型
- 組件 Props 類型

### ✅ Hot Module Replacement
- 修改代碼即時更新
- 保持狀態（Vite HMR）

---

## 🚀 性能

開發模式：
- Vite 閃電般快速冷啟動
- HMR 毫秒級更新

生產模式：
```bash
pnpm build
pnpm preview
```

---

## 📝 下一步

測試這個 demo 後，你可以：

1. **修改代碼** - 試試添加新組件
2. **性能測試** - 看看 batch() 的效果
3. **對比 SolidJS** - 感受 API 的差異

---

**這才是真正的 ZenJS！** 🎉
