# Rapid Website Redesign Strategy

## 競爭分析 (Competitive Analysis)

### 當前競爭環境
1. **React** - 市場主導地位 (42KB, 龐大生態系統)
2. **Vue** - 漸進式框架 (34KB, 中國市場強勢)
3. **Svelte** - 編譯時優化 (4KB, 但需要編譯器)
4. **Solid** - Fine-grained reactivity (7KB, 性能優異)
5. **Preact** - React 輕量替代 (3KB, 但功能受限)

### Rapid 的獨特優勢
1. **極致輕量** - Signal 1.75KB, Framework <5KB (市場最小)
2. **真正的 Fine-grained** - 不需要編譯器，純運行時
3. **無 VDOM** - 直接 DOM 更新，性能最優
4. **獨立套件** - Signal/Router 可獨立用於任何框架
5. **零學習成本** - API 極簡，幾分鐘上手
6. **漸進採用** - 可以只用 Signal，不必全面遷移

## 網站重構策略

### 1. 首頁重點 (Homepage Focus)

#### Hero Section - 三大賣點
```
⚡ 1.75 KB Signal | <5 KB Framework | 150M+ ops/sec
不需要編譯器 | 不需要 VDOM | 不需要學習新概念

[開始使用] [看 5 分鐘教學] [從 React 遷移]
```

#### 立即展示價值 (Immediate Value Demo)
```tsx
// React - 複雜且大
const [count, setCount] = useState(0)
const doubled = useMemo(() => count * 2, [count])
// 需要: React (42KB) + 重新渲染整個組件

// Rapid - 簡單且小
const count = signal(0)
const doubled = computed(() => count.value * 2)
// 需要: Rapid Signal (1.75KB) + 只更新變化的節點
```

### 2. 遷移路徑 (Migration Paths)

#### 從 React 遷移
```tsx
// Step 1: 先用 @rapid/signal-react (無需改代碼)
import { useZen } from '@rapid/signal-react'
const count = signal(0)

function Counter() {
  const value = useZen(count) // 在現有 React 組件中使用
  return <button onClick={() => count.value++}>{value}</button>
}

// Step 2: 漸進替換組件 (一個個來)
// React 組件和 Rapid 組件可以共存
<ReactComponent>
  <ZenComponent />
</ReactComponent>

// Step 3: 最終完全遷移 (可選)
// 享受 <5KB 的框架大小
```

#### 從 Vue 遷移
```tsx
// Vue 3 Composition API 用戶會感覺很熟悉
// Vue
const count = ref(0)
const doubled = computed(() => count.value * 2)

// Rapid - 幾乎一樣！
const count = signal(0)
const doubled = computed(() => count.value * 2)

// 可以在 Vue 中使用 Rapid Signal
import { useZen } from '@rapid/signal-vue'
```

#### 從 Solid 遷移
```tsx
// Solid 用戶會發現 Rapid 更簡單
// Solid
const [count, setCount] = createSignal(0)
const doubled = createMemo(() => count() * 2)

// Rapid - 統一的 .value API
const count = signal(0)
const doubled = computed(() => count.value * 2)

// 優勢: 不需要記憶何時用 () 何時不用
```

### 3. 整合指南 (Integration Guides)

#### Tailwind CSS
```tsx
// 開箱即用，無需特殊配置
function Button() {
  return (
    <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Click me
    </button>
  )
}
```

#### Panda CSS
```tsx
// 完美配合 CSS-in-JS
import { css } from '@pandacss/dev'

function Button() {
  return (
    <button class={css({ px: 4, py: 2, bg: 'blue.500' })}>
      Click me
    </button>
  )
}
```

#### Iconify
```tsx
// 任何圖標庫都能用
import { Icon } from '@iconify/react'

function Header() {
  return (
    <div>
      <Icon icon="mdi:home" />
      <Icon icon="heroicons:user" />
    </div>
  )
}
```

### 4. 獨立套件展示 (Standalone Packages)

#### @rapid/signal - 在任何框架使用
```tsx
// React
import { useZen } from '@rapid/signal-react'
const count = signal(0)

// Vue
import { useZen } from '@rapid/signal-vue'
const count = signal(0)

// Svelte
import { toStore } from '@rapid/signal-svelte'
const count = toStore(signal(0))

// Solid
import { toSolidSignal } from '@rapid/signal-solid'
const count = toSolidSignal(signal(0))

// Vanilla JS
const count = signal(0)
count.subscribe(v => console.log(v))
```

#### @rapid/router - 輕量路由解決方案
```tsx
// 可用於任何框架，或無框架
import { createRouter } from '@rapid/router'

const router = createRouter({
  '/': () => <Home />,
  '/about': () => <About />,
  '/users/:id': ({ params }) => <User id={params.id} />
})
```

## 網站結構

### 新首頁結構
```
1. Hero - 三大賣點 + 即時對比
2. Why Rapid? - 與競品對比 (大小、性能、易用性)
3. 5 分鐘快速開始 - 互動式教學
4. 遷移指南 - React/Vue/Svelte/Solid 一鍵遷移
5. 生態系統 - 獨立套件展示
6. 整合示例 - Tailwind/Panda/Iconify 等
7. 成功案例 - 誰在用 Rapid
8. 社區 - GitHub/Discord/Twitter
```

### 核心頁面
1. **Get Started** - 按框架分類的快速開始
   - 從零開始
   - 從 React 遷移
   - 從 Vue 遷移
   - 從 Solid 遷移

2. **Migration Guides** - 詳細遷移指南
   - 為什麼遷移
   - 遷移步驟
   - 常見問題
   - 實際案例

3. **Integrations** - 整合生態系統
   - CSS 框架 (Tailwind, Panda, UnoCSS)
   - 圖標庫 (Iconify, Lucide)
   - UI 庫 (自己構建或整合現有)
   - 工具鏈 (Vite, Webpack, Bun)

4. **Standalone Packages** - 獨立套件文檔
   - @rapid/signal 用於所有框架
   - @rapid/router 用於所有框架
   - @rapid/signal-patterns (狀態管理模式)
   - @rapid/signal-persistent (持久化)

## 說服策略

### 1. 降低風險 (Risk Reduction)
- **漸進採用**: 不需要一次性重寫
- **向後兼容**: 可以與現有代碼共存
- **獨立套件**: 只用 Signal 也可以
- **零鎖定**: 隨時可以遷移走

### 2. 展示價值 (Value Demonstration)
- **真實性能數據**: 實際測試，不是理論
- **Bundle 大小對比**: 實際項目對比
- **開發效率**: 代碼量減少 X%
- **成功案例**: 誰在用，效果如何

### 3. 簡化入門 (Easy Onboarding)
- **5 分鐘教學**: 互動式教學，即學即用
- **一鍵遷移**: 提供遷移工具/腳本
- **詳細文檔**: 每個場景都有例子
- **活躍社區**: Discord 即時幫助

### 4. 生態系統 (Ecosystem)
- **主流工具支持**: Tailwind, TypeScript, Vite
- **框架整合**: 所有主流框架都能用
- **開發者工具**: DevTools, 調試工具
- **模板庫**: 常見模式的即用模板

## 實施計劃

### Phase 1: 內容準備 (1-2 天)
- [ ] 撰寫遷移指南 (React/Vue/Solid/Svelte)
- [ ] 準備整合示例 (Tailwind/Panda/Iconify)
- [ ] 創建對比表格 (性能/大小/學習曲線)
- [ ] 準備真實案例和數據

### Phase 2: 設計實施 (2-3 天)
- [ ] 重新設計首頁 (Hero + 價值展示)
- [ ] 實現互動式教學
- [ ] 創建遷移頁面
- [ ] 整合文檔頁面

### Phase 3: 優化完善 (1-2 天)
- [ ] SEO 優化
- [ ] 性能優化
- [ ] 移動端適配
- [ ] 瀏覽器測試

### Phase 4: 發布推廣
- [ ] 發布到 Product Hunt
- [ ] Reddit/HackerNews 發帖
- [ ] Twitter 推廣
- [ ] 技術博客文章

## 關鍵指標 (KPIs)

1. **轉化率**
   - 首頁 → 文檔: >40%
   - 文檔 → 嘗試: >30%
   - 嘗試 → 採用: >10%

2. **用戶反饋**
   - GitHub Stars 增長
   - npm 下載量
   - 社區活躍度

3. **遷移成功率**
   - 完成遷移指南的用戶比例
   - 遷移後繼續使用的比例
