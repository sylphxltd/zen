# ZenJS Setup - Bun Workspace

## 🚀 快速開始

### 安裝依賴

```bash
cd /tmp/zenjs
bun install
```

這會安裝：
- 主項目的依賴
- demo-app 的依賴（workspace）

---

## 📦 Bun Workspace 結構

```
zenjs/
├── src/                # ZenJS 核心源碼
├── demo-app/           # Demo 應用（workspace）
├── package.json        # 主項目 + workspace 配置
└── biome.json          # Biome 配置
```

### Workspace 配置

```json
{
  "workspaces": [
    "demo-app"
  ]
}
```

demo-app 會自動引用主項目：
```json
{
  "dependencies": {
    "zenjs": "workspace:*"
  }
}
```

---

## 🛠️ 開發命令

### 主項目

```bash
# 開發模式（watch）
bun dev

# 構建
bun build

# 測試
bun test

# 性能基準
bun bench

# 類型檢查
bun typecheck

# Lint
bun lint

# 格式化
bun format
```

### Demo 應用

```bash
# 方法 1: 從根目錄運行
bun demo

# 方法 2: 進入 demo-app 目錄
cd demo-app
bun dev
```

---

## 🎨 Biome 配置

### 自動格式化

```bash
# 檢查所有文件
bun lint

# 格式化所有文件
bun format
```

### 配置要點

- **縮進**：2 空格
- **引號**：單引號
- **分號**：總是使用
- **行寬**：100 字符
- **尾逗號**：ES5 風格

---

## 📝 測試

### 單元測試

```bash
bun test
```

Bun 內建測試運行器，無需額外配置！

### 性能基準

```bash
bun bench
```

---

## 🔧 開發工作流

### 1. 修改 ZenJS 核心

```bash
# 編輯 src/ 下的文件
vim src/core/signal.ts

# 自動重新加載（如果運行了 bun dev）
```

### 2. 測試更改

```bash
# 運行測試
bun test

# 或者在 demo 中測試
bun demo
```

### 3. 格式化代碼

```bash
bun format
```

### 4. 檢查類型

```bash
bun typecheck
```

---

## 📦 構建和發布

### 構建

```bash
bun build
```

生成：
- `dist/index.js` - 主入口
- `dist/jsx-runtime.js` - JSX 運行時
- `dist/*.d.ts` - TypeScript 類型定義

### 發布（未來）

```bash
bun publish
```

---

## 🐛 常見問題

### Workspace 依賴未解析

```bash
# 重新安裝
rm -rf node_modules
bun install
```

### 類型錯誤

```bash
# 檢查類型
bun typecheck

# 生成類型定義
bun build
```

### Demo 無法找到 zenjs

確保：
1. 已運行 `bun install`（根目錄）
2. demo-app/package.json 有 `"zenjs": "workspace:*"`
3. 已構建主項目 `bun build`

---

## 🚀 下一步

1. **運行 demo**：`bun demo`
2. **修改代碼**：編輯 `src/` 或 `demo-app/src/`
3. **測試**：`bun test`
4. **格式化**：`bun format`

---

**享受用 Bun 開發！** ⚡
