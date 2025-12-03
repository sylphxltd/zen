# ADR-003: Final Renderer Architecture

## Status
Proposed

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION                                     │
│                                                                              │
│   const count = signal(0)                                                   │
│   <Box><Text>Count: {() => count.value}</Text></Box>                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Signal 變化
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DIRTY TRACKER                                      │
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │  dirtyNodes     │    │  dirtyRegions   │    │  dirtyType      │        │
│   │  Set<TUINode>   │    │  Set<Region>    │    │  Content/Layout │        │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                              │
│   • Content change → 只標記 node + region                                    │
│   • Layout change  → 標記 node + 觸發 Yoga 重算                              │
│   • Structure change → 標記整個 subtree                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ scheduleRender()
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RENDER SCHEDULER                                   │
│                                                                              │
│   • Batch 多個 signal 變化到一個 microtask                                   │
│   • 防止同一幀多次 render                                                    │
│                                                                              │
│   queueMicrotask(() => renderer.flush())                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ flush()
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              RENDERER                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Phase 1: LAYOUT (只在 layoutDirty 時)                                   │ │
│  │                                                                         │ │
│  │   Yoga.calculateLayout() → layoutMap                                    │ │
│  │   更新 nodeRegions (每個 node 的 bounding box)                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Phase 2: STRATEGY SELECTION                                             │ │
│  │                                                                         │ │
│  │   dirtyArea = Σ(region.width × region.height)                          │ │
│  │   totalArea = buffer.width × buffer.height                              │ │
│  │                                                                         │ │
│  │   if (dirtyArea / totalArea > 0.5) → FULL_RENDER                       │ │
│  │   else → INCREMENTAL                                                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Phase 3: RENDER TO BUFFER                                               │ │
│  │                                                                         │ │
│  │   FULL_RENDER:                                                          │ │
│  │     currentBuffer.clear()                                               │ │
│  │     renderAllNodes(root, currentBuffer)                                 │ │
│  │                                                                         │ │
│  │   INCREMENTAL:                                                          │ │
│  │     for (region of dirtyRegions) {                                      │ │
│  │       clearRegion(currentBuffer, region)                                │ │
│  │       renderNodesInRegion(region, currentBuffer)                        │ │
│  │     }                                                                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Phase 4: DIFF                                                           │ │
│  │                                                                         │ │
│  │   FULL_RENDER:                                                          │ │
│  │     changes = diffFullBuffer(current, previous)                         │ │
│  │                                                                         │ │
│  │   INCREMENTAL:                                                          │ │
│  │     changes = diffRegions(dirtyRegions, current, previous)              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Phase 5: OUTPUT                                                         │ │
│  │                                                                         │ │
│  │   outputBuffer.beginSync()        // CSI ? 2026 h                       │ │
│  │                                                                         │ │
│  │   FULLSCREEN:                                                           │ │
│  │     for (change of changes)                                             │ │
│  │       output += `\x1b[${row};1H\x1b[2K${line}`  // 絕對定位             │ │
│  │                                                                         │ │
│  │   INLINE:                                                               │ │
│  │     for (change of changes)                                             │ │
│  │       output += moveTo(row) + clearLine + line  // 相對定位             │ │
│  │                                                                         │ │
│  │   outputBuffer.endSync()          // CSI ? 2026 l                       │ │
│  │   outputBuffer.flush()            // 一次性寫入                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Phase 6: SWAP & CLEANUP                                                 │ │
│  │                                                                         │ │
│  │   [currentBuffer, previousBuffer] = [previousBuffer, currentBuffer]     │ │
│  │   dirtyNodes.clear()                                                    │ │
│  │   dirtyRegions.clear()                                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TERMINAL                                        │
│                                                                              │
│   process.stdout.write(output)                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Data Structures

### 1. TerminalBuffer

```typescript
interface Cell {
  char: string;
  fg: Color | null;
  bg: Color | null;
  attrs: number;      // Bitmask: bold, italic, underline, etc.
  width: number;      // 1 for normal, 2 for wide chars
}

class TerminalBuffer {
  cells: Cell[][];
  width: number;
  height: number;

  clear(): void;
  clearRegion(region: Region): void;
  writeAt(x: number, y: number, text: string, style: Style): void;
  getCell(x: number, y: number): Cell;
  getLine(y: number): Cell[];
  resize(width: number, height: number): void;

  // 產生 ANSI output
  renderFull(): string;
  renderLine(y: number): string;
  renderRegion(region: Region): string;
}
```

### 2. Region

```typescript
interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Region 操作
function mergeRegions(regions: Region[]): Region[];  // 合併重疊區域
function expandRegion(region: Region, padding: number): Region;
function intersectRegion(a: Region, b: Region): Region | null;
function regionArea(region: Region): number;
```

### 3. DirtyTracker

```typescript
enum DirtyType {
  None = 0,
  Content = 1,    // 只有內容變化 (text, style)
  Layout = 2,     // 位置/大小變化
  Structure = 4,  // 節點增刪
}

class DirtyTracker {
  private dirtyNodes: Map<TUINode, DirtyType> = new Map();
  private dirtyRegions: Set<Region> = new Set();
  private nodeRegions: Map<TUINode, Region> = new Map();
  private layoutDirty: boolean = false;

  // 由 signal system 調用
  markContentDirty(node: TUINode): void {
    const existing = this.dirtyNodes.get(node) ?? DirtyType.None;
    this.dirtyNodes.set(node, existing | DirtyType.Content);

    const region = this.nodeRegions.get(node);
    if (region) {
      this.dirtyRegions.add(region);
    }
  }

  markLayoutDirty(node: TUINode): void {
    const existing = this.dirtyNodes.get(node) ?? DirtyType.None;
    this.dirtyNodes.set(node, existing | DirtyType.Layout);
    this.layoutDirty = true;
  }

  markStructureDirty(node: TUINode): void {
    this.dirtyNodes.set(node, DirtyType.Structure);
    this.layoutDirty = true;
  }

  // Layout 完成後更新 region mapping
  updateNodeRegions(layoutMap: LayoutMap): void {
    for (const [node, layout] of layoutMap) {
      this.nodeRegions.set(node, {
        x: layout.left,
        y: layout.top,
        width: layout.width,
        height: layout.height,
      });
    }
  }

  // 計算需要處理的 regions
  getDirtyRegions(): Region[] {
    return mergeRegions([...this.dirtyRegions]);
  }

  clear(): void {
    this.dirtyNodes.clear();
    this.dirtyRegions.clear();
    this.layoutDirty = false;
  }
}
```

### 4. OutputBuffer

```typescript
class OutputBuffer {
  private chunks: string[] = [];
  private syncSupported: boolean = true;

  beginSync(): void {
    if (this.syncSupported) {
      this.chunks.push('\x1b[?2026h');
    }
  }

  endSync(): void {
    if (this.syncSupported) {
      this.chunks.push('\x1b[?2026l');
    }
  }

  write(content: string): void {
    this.chunks.push(content);
  }

  // 一次性寫入 terminal
  flush(): void {
    const output = this.chunks.join('');
    this.chunks = [];
    process.stdout.write(output);
  }

  clear(): void {
    this.chunks = [];
  }
}
```

### 5. Renderer

```typescript
class Renderer {
  private currentBuffer: TerminalBuffer;
  private previousBuffer: TerminalBuffer;
  private dirtyTracker: DirtyTracker;
  private output: OutputBuffer;
  private mode: 'inline' | 'fullscreen';

  // Inline mode 專用
  private contentHeight: number = 0;
  private cursorLine: number = 0;

  constructor(width: number, height: number, mode: 'inline' | 'fullscreen') {
    const bufferHeight = mode === 'fullscreen' ? height : 1000;
    this.currentBuffer = new TerminalBuffer(width, bufferHeight);
    this.previousBuffer = new TerminalBuffer(width, bufferHeight);
    this.dirtyTracker = new DirtyTracker();
    this.output = new OutputBuffer();
    this.mode = mode;
  }

  /**
   * Main render entry point
   */
  render(root: TUINode, layoutMap: LayoutMap): void {
    // Phase 1: Update region mapping
    this.dirtyTracker.updateNodeRegions(layoutMap);

    // Phase 2: Select strategy
    const strategy = this.selectStrategy();

    // Phase 3: Render to buffer
    if (strategy === 'full') {
      this.renderFull(root, layoutMap);
    } else {
      this.renderIncremental(root, layoutMap);
    }

    // Phase 4: Diff and output
    this.outputChanges(strategy);

    // Phase 5: Swap buffers
    [this.currentBuffer, this.previousBuffer] =
      [this.previousBuffer, this.currentBuffer];

    // Phase 6: Clear dirty state
    this.dirtyTracker.clear();
  }

  private selectStrategy(): 'full' | 'incremental' {
    const dirtyRegions = this.dirtyTracker.getDirtyRegions();

    // 計算 dirty area
    let dirtyArea = 0;
    for (const region of dirtyRegions) {
      dirtyArea += region.width * region.height;
    }

    const totalArea = this.currentBuffer.width * this.currentBuffer.height;
    const ratio = dirtyArea / totalArea;

    // Thresholds
    if (ratio > 0.5) return 'full';
    if (dirtyRegions.length > 10) return 'full';  // 太多小區域

    return 'incremental';
  }

  private renderFull(root: TUINode, layoutMap: LayoutMap): void {
    this.currentBuffer.clear();
    this.renderNode(root, layoutMap);
  }

  private renderIncremental(root: TUINode, layoutMap: LayoutMap): void {
    const dirtyRegions = this.dirtyTracker.getDirtyRegions();

    for (const region of dirtyRegions) {
      // 清除區域
      this.currentBuffer.clearRegion(region);

      // 找出與此區域相交的 nodes
      const nodes = this.findNodesInRegion(root, region, layoutMap);

      // 渲染這些 nodes
      for (const node of nodes) {
        this.renderNode(node, layoutMap, region);
      }
    }
  }

  private outputChanges(strategy: 'full' | 'incremental'): void {
    this.output.beginSync();

    if (this.mode === 'fullscreen') {
      this.outputFullscreen(strategy);
    } else {
      this.outputInline(strategy);
    }

    this.output.endSync();
    this.output.flush();
  }

  private outputFullscreen(strategy: 'full' | 'incremental'): void {
    if (strategy === 'full') {
      // Diff 整個 buffer
      const changes = this.diffFullBuffer();
      for (const change of changes) {
        // 絕對定位
        this.output.write(`\x1b[${change.y + 1};1H\x1b[2K${change.content}`);
      }
    } else {
      // 只 diff dirty regions
      const dirtyRegions = this.dirtyTracker.getDirtyRegions();
      for (const region of dirtyRegions) {
        const changes = this.diffRegion(region);
        for (const change of changes) {
          this.output.write(`\x1b[${change.y + 1};1H\x1b[2K${change.content}`);
        }
      }
    }
  }

  private outputInline(strategy: 'full' | 'incremental'): void {
    const newHeight = this.calculateContentHeight();
    const prevHeight = this.contentHeight;

    // Height 變化時強制 full render
    if (newHeight !== prevHeight) {
      strategy = 'full';
    }

    if (strategy === 'full') {
      // 清除舊內容
      this.clearInlineContent(prevHeight);

      // 寫入新內容
      const content = this.currentBuffer.renderFull();
      const lines = content.split('\n').slice(0, newHeight);
      this.output.write(lines.join('\n'));

      // Cursor 回到 line 0
      if (newHeight > 1) {
        this.output.write(`\x1b[${newHeight - 1}A`);
      }
      this.output.write('\r');
    } else {
      // 只更新變化的行 (相對定位)
      const changes = this.diffFullBuffer();
      for (const change of changes) {
        this.moveToLine(change.y);
        this.output.write(`\r\x1b[2K${change.content}`);
      }
      this.moveToLine(0);
    }

    this.contentHeight = newHeight;
  }

  private clearInlineContent(height: number): void {
    if (height === 0) return;

    this.output.write('\r');
    for (let i = 0; i < height; i++) {
      this.output.write('\x1b[2K');
      if (i < height - 1) {
        this.output.write('\x1b[1B\r');
      }
    }
    if (height > 1) {
      this.output.write(`\x1b[${height - 1}A`);
    }
    this.output.write('\r');
  }

  private moveToLine(targetLine: number): void {
    if (targetLine > this.cursorLine) {
      this.output.write(`\x1b[${targetLine - this.cursorLine}B`);
    } else if (targetLine < this.cursorLine) {
      this.output.write(`\x1b[${this.cursorLine - targetLine}A`);
    }
    this.cursorLine = targetLine;
  }

  cleanup(): void {
    if (this.mode === 'inline' && this.contentHeight > 0) {
      if (this.contentHeight > 1) {
        process.stdout.write(`\x1b[${this.contentHeight - 1}B`);
      }
      process.stdout.write('\n');
    }
  }
}
```

## Data Flow Summary

```
Signal Change
     │
     ▼
┌─────────────────────────────┐
│ DirtyTracker.markDirty()    │
│ - 記錄 dirty node           │
│ - 記錄 dirty region         │
│ - 設置 dirty type           │
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ scheduleRender()            │
│ - queueMicrotask            │
│ - 合併多個 signal 變化       │
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Renderer.render()           │
│                             │
│ 1. Layout (if needed)       │
│ 2. Select strategy          │
│ 3. Render to buffer         │
│ 4. Diff                     │
│ 5. Output                   │
│ 6. Swap buffers             │
└─────────────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ Terminal                    │
│ - Synchronized output       │
│ - Single write              │
└─────────────────────────────┘
```

## Strategy Decision Tree

```
                    ┌─────────────────────┐
                    │   Signal Changed    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Layout Dirty?      │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │ Yes                             │ No
              ▼                                 ▼
    ┌─────────────────┐              ┌─────────────────┐
    │ Recompute Yoga  │              │ Use cached      │
    │ Update regions  │              │ layout          │
    └────────┬────────┘              └────────┬────────┘
             │                                 │
             └────────────────┬────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Calculate dirty     │
                    │ area ratio          │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │ ratio > 50%                     │ ratio ≤ 50%
              ▼                                 ▼
    ┌─────────────────┐              ┌─────────────────┐
    │ FULL RENDER     │              │ INCREMENTAL     │
    │                 │              │                 │
    │ • Clear buffer  │              │ • Clear regions │
    │ • Render all    │              │ • Render dirty  │
    │ • Diff all      │              │ • Diff regions  │
    └─────────────────┘              └─────────────────┘
```

## Mode Comparison

| Aspect | Fullscreen | Inline |
|--------|------------|--------|
| Buffer size | Terminal size | 1000 lines |
| Screen buffer | Alternate (`\x1b[?1049h`) | Main |
| Positioning | Absolute (`\x1b[row;col H`) | Relative (`\x1b[nA/B`) |
| Height change | N/A (fixed) | Full re-render |
| Cleanup | Exit alternate screen | Move cursor to bottom |

## Performance Characteristics

| Scenario | Strategy | Complexity |
|----------|----------|------------|
| Single cell change | Incremental | O(1) |
| One line change | Incremental | O(width) |
| 10% screen change | Incremental | O(dirty_area) |
| 50%+ screen change | Full | O(total_area) |
| Height change (inline) | Full | O(total_area) |
| Layout change | Full | O(nodes) + O(total_area) |

## File Structure

```
packages/rapid-tui/src/
├── core/
│   ├── renderer/
│   │   ├── index.ts              # Export
│   │   ├── renderer.ts           # Main Renderer class
│   │   ├── terminal-buffer.ts    # Buffer + Cell
│   │   ├── dirty-tracker.ts      # Dirty tracking
│   │   ├── output-buffer.ts      # Synchronized output
│   │   ├── diff.ts               # Buffer diffing
│   │   └── region.ts             # Region utilities
│   ├── layout/
│   │   └── yoga-layout.ts        # Yoga integration
│   └── types.ts
```
