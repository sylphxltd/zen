# Zen SSR Architecture

## 目標

SEO 重要 → SSR 必需

實現完整 SSR 方案：
1. **renderToString** - 服務端渲染成 HTML
2. **hydrate** - 客戶端激活
3. **isServer** - 環境判斷
4. **createUniqueId** - SSR 安全 ID

---

## 核心挑戰

### 1. DOM 依賴

**問題:** jsx-runtime 使用 `document.createElement`

```typescript
// 目前 (僅客戶端)
function createElement(type, props) {
  const element = document.createElement(type);
  // ...
}
```

**解決方案:**
- **SSR JSX Runtime** - 字符串拼接模式
- **條件導出** - package.json exports 映射

```json
{
  "exports": {
    ".": {
      "bun": "./dist/index.js",
      "node": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./jsx-runtime": {
      "react-server": "./dist/jsx-runtime-server.js",
      "default": "./dist/jsx-runtime.js"
    }
  }
}
```

---

### 2. 響應式激活

**問題:** SSR HTML 是靜態的，客戶端需要激活響應式

**策略:**
- Server: 只渲染初始狀態
- Client: 重新執行組件 → 建立響應式 → 復用 DOM

**Hydration 流程:**
```
1. Server renders → <div id="app">...</div>
2. Client hydrate() →
   - 讀取現有 DOM
   - 執行組件 (建立 signals/effects)
   - 匹配並復用 nodes (不重新創建)
   - Attach event listeners
```

---

### 3. Mismatch 問題

**問題:** Server/Client 渲染不一致

**常見原因:**
- Random IDs
- Date.now()
- Client-only APIs (localStorage, window)

**解決方案:**
- **createUniqueId** - 確定性 ID 生成
- **isServer** - 條件邏輯
- **SSR Context** - 傳遞服務端數據

---

## 實現計劃

### Phase 1: SSR JSX Runtime ⚡

**新文件:** `src/jsx-runtime-server.ts`

```typescript
/**
 * SSR JSX Runtime - String-based rendering
 * Generates HTML strings instead of DOM nodes
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderAttributes(props: any): string {
  const attrs: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'ref') continue;

    // Boolean attributes
    if (typeof value === 'boolean') {
      if (value) attrs.push(key);
      continue;
    }

    // Event handlers (ignore on server)
    if (key.startsWith('on')) continue;

    // className → class
    const attrName = key === 'className' ? 'class' : key;

    // Style object → string
    if (key === 'style' && typeof value === 'object') {
      const styleStr = Object.entries(value)
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
      attrs.push(`style="${styleStr}"`);
      continue;
    }

    attrs.push(`${attrName}="${escapeHtml(String(value))}"`);
  }

  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

export function jsx(type: any, props: any): string {
  const { children, ...restProps } = props || {};

  // Component
  if (typeof type === 'function') {
    return type({ ...restProps, children });
  }

  // Intrinsic element
  const attrs = renderAttributes(restProps);
  const childrenHtml = renderChildren(children);

  // Self-closing tags
  if (VOID_ELEMENTS.includes(type)) {
    return `<${type}${attrs} />`;
  }

  return `<${type}${attrs}>${childrenHtml}</${type}>`;
}

function renderChildren(children: any): string {
  if (children == null) return '';
  if (typeof children === 'string') return escapeHtml(children);
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(renderChildren).join('');
  }
  return children; // Already rendered string
}

const VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
];

export const jsxs = jsx;
export const jsxDEV = jsx;
export function Fragment(props: { children: any }): string {
  return renderChildren(props.children);
}
```

**關鍵點:**
- 純字符串操作，無 DOM 依賴
- XSS 防護 (escapeHtml)
- 忽略事件處理器
- 處理特殊屬性 (className, style)

---

### Phase 2: renderToString 📝

**新文件:** `src/server.ts`

```typescript
import { createOwner, setOwner } from './lifecycle.js';

/**
 * Render component tree to HTML string
 */
export function renderToString(fn: () => string): string {
  // Create isolated owner for SSR
  const owner = createOwner();
  setOwner(owner);

  try {
    // Execute component tree (SSR jsx-runtime will return strings)
    const html = fn();
    return html;
  } finally {
    setOwner(null);
  }
}
```

**問題:** 組件會嘗試註冊 effects/cleanups

**解決:** SSR-safe lifecycle hooks

```typescript
// lifecycle.ts
let isServerRendering = false;

export function setServerMode(mode: boolean) {
  isServerRendering = mode;
}

export function onMount(callback: () => void) {
  if (isServerRendering) return; // Skip on server
  // ... existing code
}

export function createEffect(effectFn: () => void) {
  if (isServerRendering) return; // Skip on server
  // ... existing code
}
```

---

### Phase 3: Hydration 💧

**新文件:** `src/hydrate.ts`

```typescript
/**
 * Hydrate server-rendered HTML
 * Reuses existing DOM and attaches reactivity
 */

let hydrateContext: {
  current: Node | null;
  nextSibling: Node | null;
} | null = null;

export function hydrate(fn: () => Node, container: Element): void {
  // Set hydration mode
  hydrateContext = {
    current: container.firstChild,
    nextSibling: null,
  };

  try {
    // Execute component tree (will reuse nodes)
    const root = fn();

    // Clean up extra nodes
    while (hydrateContext.current) {
      const next = hydrateContext.current.nextSibling;
      container.removeChild(hydrateContext.current);
      hydrateContext.current = next;
    }
  } finally {
    hydrateContext = null;
  }
}

export function isHydrating(): boolean {
  return hydrateContext !== null;
}

export function getNextHydrateNode(): Node | null {
  if (!hydrateContext) return null;
  const node = hydrateContext.current;
  if (node) {
    hydrateContext.current = node.nextSibling;
  }
  return node;
}
```

**修改 jsx-runtime.ts:**

```typescript
function createElement(type, props) {
  // Hydration mode: reuse existing node
  if (isHydrating()) {
    const node = getNextHydrateNode();
    if (node && node.nodeName.toLowerCase() === type) {
      // Attach event listeners
      for (const [key, value] of Object.entries(props)) {
        if (key.startsWith('on') && typeof value === 'function') {
          const event = key.slice(2).toLowerCase();
          node.addEventListener(event, value);
        }
      }
      return node;
    }
  }

  // Normal mode: create new node
  const element = document.createElement(type);
  // ... existing code
}
```

---

### Phase 4: 輔助工具 🛠️

#### isServer

```typescript
// src/server-utils.ts

export const isServer = typeof window === 'undefined';
```

#### createUniqueId

```typescript
let idCounter = 0;
let serverIdPrefix = '';

export function setServerIdPrefix(prefix: string) {
  serverIdPrefix = prefix;
}

export function createUniqueId(): string {
  const id = `zen-${serverIdPrefix}${idCounter++}`;
  return id;
}

// Reset counter for each SSR request
export function resetIdCounter() {
  idCounter = 0;
}
```

**使用:**

```typescript
// Server
app.get('/', (req, res) => {
  resetIdCounter();
  setServerIdPrefix(req.id); // Request-specific prefix
  const html = renderToString(() => <App />);
  res.send(html);
});

// Component
function Form() {
  const id = createUniqueId();
  return (
    <>
      <label htmlFor={id}>Name</label>
      <input id={id} />
    </>
  );
}
```

---

## Package 結構

```
@zen/zen/
├── src/
│   ├── jsx-runtime.ts          # Client JSX runtime
│   ├── jsx-runtime-server.ts   # SSR JSX runtime
│   ├── server.ts               # renderToString
│   ├── hydrate.ts              # hydrate, isHydrating
│   └── server-utils.ts         # isServer, createUniqueId
├── dist/
│   ├── index.js
│   ├── jsx-runtime.js
│   ├── jsx-runtime-server.js
│   ├── server.js
│   └── hydrate.js
└── package.json

# Exports
{
  "exports": {
    ".": "./dist/index.js",
    "./jsx-runtime": {
      "react-server": "./dist/jsx-runtime-server.js",
      "default": "./dist/jsx-runtime.js"
    },
    "./server": "./dist/server.js",
    "./hydrate": "./dist/hydrate.js"
  }
}
```

---

## 測試策略

### 1. SSR Rendering
```typescript
test('renders to HTML string', () => {
  const html = renderToString(() => (
    <div class="container">
      <h1>Hello</h1>
    </div>
  ));

  expect(html).toBe('<div class="container"><h1>Hello</h1></div>');
});
```

### 2. Hydration
```typescript
test('hydrates and attaches events', () => {
  // Server render
  const html = renderToString(() => (
    <button onClick={() => console.log('clicked')}>Click</button>
  ));

  // Set up DOM
  document.body.innerHTML = html;

  // Hydrate
  let clicked = false;
  hydrate(() => (
    <button onClick={() => clicked = true}>Click</button>
  ), document.body);

  // Trigger event
  document.querySelector('button').click();
  expect(clicked).toBe(true);
});
```

### 3. Unique IDs
```typescript
test('generates consistent IDs', () => {
  resetIdCounter();
  const id1 = createUniqueId();
  const id2 = createUniqueId();

  resetIdCounter();
  const id1Again = createUniqueId();

  expect(id1).toBe(id1Again);
  expect(id1).not.toBe(id2);
});
```

---

## 實施順序

### Week 1: Foundation
- [ ] SSR JSX Runtime (jsx-runtime-server.ts)
- [ ] Basic renderToString
- [ ] Server-safe lifecycle hooks
- [ ] isServer utility

### Week 2: Hydration
- [ ] Hydration context
- [ ] Client JSX runtime 修改
- [ ] Event listener attachment
- [ ] Mismatch detection

### Week 3: Polish
- [ ] createUniqueId
- [ ] Component 兼容性測試
- [ ] Performance optimization
- [ ] Documentation

### Week 4: Integration
- [ ] 示例項目 (Next.js style)
- [ ] Router SSR 支持
- [ ] Edge cases 處理

---

## 風險與挑戰

### 高風險
1. **組件兼容性** - 某些組件可能依賴 client APIs
   - 解決: 提供 SSR guidelines
   - 解決: ClientOnly wrapper component

2. **Hydration mismatch** - Server/client 渲染不一致
   - 解決: 開發模式警告
   - 解決: 詳細錯誤信息

### 中風險
3. **性能** - SSR 可能較慢
   - 解決: 缓存策略
   - 解決: Streaming (Phase 2)

4. **Bundle size** - SSR code 增加 bundle
   - 解決: Tree-shaking
   - 解決: 分包 (server.js, hydrate.js)

---

## 成功指標

1. **功能完整** - 4個核心 API 都實現
2. **兼容性** - 所有現有組件支持 SSR
3. **性能** - SSR 響應時間 < 50ms (簡單頁面)
4. **DX** - 清晰既錯誤信息，完整文檔

---

## Next Steps

1. Review this architecture
2. Start with SSR JSX Runtime
3. Implement renderToString
4. Test with simple components
5. Iterate based on findings
