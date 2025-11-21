# Input Components Debug

## 問題：無法輸入文字

請按照以下步驟測試並回報結果：

## 測試 1: 鍵盤輸入基礎測試

```bash
cd /Users/kyle/zen/examples/tui-demo
bun src/input-debug.tsx
```

**測試步驟：**
1. 啟動後，按任意鍵（例如 'a', 'b', '1', '2'）
2. 觀察是否有新的 static log 出現在上方
3. 檢查 "Total keys pressed" 是否增加

**預期結果：**
- ✅ 每按一個鍵，都應該出現一行新的 log
- ✅ Log 應該顯示完整的鍵盤資訊（例如：`Key: "a" (code: 97) - Tab:false Enter:false Backspace:false`）
- ✅ Counter 應該增加

**如果失敗：**
請回報是否：
- [ ] 完全沒有反應（按鍵無效）
- [ ] 有反應但資訊不正確
- [ ] 其他錯誤訊息

## 測試 2: TextInput 測試（簡化版）

```bash
bun src/inputs-static-test.tsx
```

**測試步驟：**
1. 啟動後，應該會自動在 1 秒後提交一個測試訊息
2. 檢查是否有 static log 出現顯示提交內容

**預期結果：**
- ✅ 1秒後出現：`[時間] Submitted: TestUser - "Auto-generated test message"`
- ✅ 表單應該清空

## 測試 3: 完整問卷

```bash
bun src/questionnaire.tsx
```

**測試步驟：**
1. 嘗試在 Name 欄位輸入文字
2. 按 Tab 切換到下一個欄位
3. 觀察焦點是否移動

**預期行為：**
- ✅ 第一個 TextInput 應該有藍色邊框（focused）
- ✅ 輸入文字時應該出現在輸入框內
- ✅ 按 Tab 應該切換焦點到下一個元素

## 請回報

如果測試失敗，請提供：
1. 哪個測試失敗了？
2. 具體症狀是什麼？（無反應/錯誤訊息/其他）
3. Terminal 類型？（iTerm2 / Terminal.app / 其他）
4. 是否在 tmux 或 screen 中？
