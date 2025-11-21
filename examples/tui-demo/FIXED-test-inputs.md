# ✅ Input 組件已修復

## 問題根因（兩個Bug）

### Bug 1: Getter 解構失去反應性
`useFocus` 返回的 `isFocused` 是 getter，解構時只求值一次，導致 focus 狀態無法更新。

**修復：** 返回 signal，使用 `.value` 訪問。

### Bug 2: Context 沒有傳播 - 缺少 lazy children
FocusProvider 沒有使用 `children()` helper，導致 JSX eager evaluation 時 children 在 Context 設定前執行。

**修復：**
1. 導入 `children` from '@zen/runtime'
2. 在 FocusProvider 中使用 `const c = children(() => props.children)`
3. 傳遞 lazy children 給 Provider

## 請測試修復

### 測試 1: 簡單輸入 + Submit

```bash
bun examples/tui-demo/src/inputs-static-test.tsx
```

**步驟：**
1. 啟動後會自動提交一次（看到 static log 出現）✅
2. 嘗試在 Username 欄位輸入文字（應該能看到輸入）
3. 按 Tab 切換到 Message 欄位
4. 輸入文字
5. 按 Tab 切換到 Submit 按鈕
6. 按 Enter 提交

**預期：**
- ✅ 第一個輸入框應該有藍色圓角邊框（focused）
- ✅ 能輸入文字，並看到文字出現在框內
- ✅ Tab 可以切換焦點
- ✅ 提交後在上方出現 static log

### 測試 2: 完整問卷

```bash
bun examples/tui-demo/src/questionnaire.tsx
```

**測試所有組件：**
- TextInput (Name, Email)
- SelectInput (Age Range, Occupation) - 按 Enter 展開，上下鍵選擇，Enter 確認
- Checkbox (Interests) - 按 Space 切換
- Button (Submit) - 按 Enter 提交

**預期：**
- 所有組件都能正常操作
- 焦點正確顯示（藍色邊框）
- Tab 導航順暢
- 提交後顯示摘要

---

## 修復內容

**檔案：**
- `packages/zen-tui/src/focus.tsx`:
  - 導入 `children` from '@zen/runtime'
  - 返回 signal 而非 getter: `isFocused: isFocusedSignal`
  - 使用 lazy children: `const c = children(() => props.children)`
- `packages/zen-tui/src/components/TextInput.tsx` - 使用 `isFocused.value`
- `packages/zen-tui/src/components/Checkbox.tsx` - 使用 `isFocused.value`
- `packages/zen-tui/src/components/Button.tsx` - 使用 `isFocused.value`
- `packages/zen-tui/src/components/SelectInput.tsx` - 使用 `isFocused.value`
