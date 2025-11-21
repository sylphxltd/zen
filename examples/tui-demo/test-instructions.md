# Console.log + Static Component Test

## Important: JSX Import Source

All TUI files **must** include this pragma at the top:
```tsx
/** @jsxImportSource @zen/tui */
```

**Why?** As a multi-platform framework, the root tsconfig is platform-neutral (no jsxImportSource).
Each file must explicitly declare its target platform via pragma or local tsconfig.

**From root**: No default jsxImportSource → pragma required
**From tui-demo**: Local tsconfig provides default → pragma still recommended for explicitness

## Quick Test

```bash
cd /Users/kyle/zen/examples/tui-demo
bun src/console-test.tsx
```

**兩種 Static Content：**
- 🔵 **console.log** - 按任意鍵觸發
- 🔵 **Static items** - 每秒自動生成

**預期行為：**
```
Key: "a"                           ← console.log (按鍵)
▸ [10:30:45] Processing task...   ← Static item (1秒)
Key: "b"                           ← console.log (按鍵)
▸ [10:30:46] Cache updated         ← Static item (2秒)
Key: "c"                           ← console.log (按鍵)
▸ [10:30:47] Request received      ← Static item (3秒)
╭────────────────────────╮
│ Console.log + Static   │  ← 動態 UI
│ Keys pressed: 3        │  ← fine-grained 更新
│ Static logs: 3         │
╰────────────────────────╯
```

**驗證項目：**
- [x] Static items 每秒自動出現在 app 上方
- [x] 按鍵時 console.log 立即出現在 app 上方
- [x] 兩種 static content 按時間順序排列
- [x] App 計數器即時更新（無閃爍）
- [x] 所有 static content 永久留在 terminal scrollback
- [x] Ctrl+C 退出，cursor 在 app 底部

**Status**: ✅ All tests passing (verified 2024-01-XX)

## Automated Tests

Run automated tests without interaction:

```bash
# Test 1: Initial static log
bun src/test-initial.tsx

# Test 2: Auto-generated logs with console.log
bun src/console-test-auto.tsx
```

Both should show static content appearing above dynamic UI with proper formatting.

---

## Capture Raw Output (for debugging)

```bash
cd /Users/kyle/zen/examples/tui-demo

# Method 1: Capture to file
bun src/cursor-debug.tsx > /tmp/debug.txt 2>&1 &
PID=$!
sleep 1
echo "s" # First key
sleep 1
echo "d" # Second key
sleep 1
kill $PID
cat -v /tmp/debug.txt
```

---

## What to Report

If there's an issue, please provide:

1. **What you see visually** (describe or screenshot)
2. **Expected vs Actual**:
   - Where console.log appears (above app / inside app / below app)
   - Whether app content is intact or corrupted
   - Whether counter updates correctly
3. **Raw output** (optional):
   ```bash
   cat -v /tmp/debug.txt
   ```

---

## Quick Visual Check

After running the test, you should see:

```
[LOG 1] Key: "s"
[LOG 2] Key: "d"
[LOG 3] Key: "f"
╭─────────────────────────────────╮
│                                 │
│ Simple Cursor Debug Test        │
│                                 │
│ Counter: 3                      │
│                                 │
│ Press any key to trigger        │
│ console.log                     │
│                                 │
│ Press Ctrl+C to exit           │
│                                 │
╰─────────────────────────────────╯
```

NOT:
```
╭─────────────────────────────────╮
│ [LOG 1] Key: "s"                │  ← console.log inside app (BAD)
│ Simple Cursor Debug Test        │
...
```
