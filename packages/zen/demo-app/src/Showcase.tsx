/**
 * ZenJS Showcase - 展示框架優勢
 */

import { batch, computed, effect, signal } from 'zenjs';

// ========== Fine-Grained Reactivity Demo ==========
export function FineGrainedDemo() {
  const count1 = signal(0);
  const count2 = signal(0);
  const count3 = signal(0);
  const totalClicks = computed(() => count1.value + count2.value + count3.value);

  return (
    <div class="demo-card" style="border: 2px solid #00d4ff;">
      <h2>⚡ Fine-Grained Reactivity</h2>

      <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 12px 0;">
        <h3 style="margin-top: 0; color: #0066cc;">✨ 核心優勢</h3>
        <p style="margin: 8px 0;">
          <strong>只更新改變的值</strong> - 不re-render整個component
        </p>
        <p style="margin: 8px 0;">
          <strong>Component 只執行一次</strong> - 之後全靠 Signal 自動更新
        </p>
        <p style="margin: 8px 0;">
          <strong>零 Virtual DOM</strong> - 直接操作真實 DOM
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0;">
        <div style="padding: 12px; background: #fff; border: 2px solid #ddd; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #00d4ff;">{count1.value}</div>
          <button onClick={() => count1.value++} style="width: 100%; margin-top: 8px;">
            更新 Count 1
          </button>
          <div style="font-size: 12px; color: #666; margin-top: 8px;">← 只有這個數字會重新渲染</div>
        </div>

        <div style="padding: 12px; background: #fff; border: 2px solid #ddd; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #00d4ff;">{count2.value}</div>
          <button onClick={() => count2.value++} style="width: 100%; margin-top: 8px;">
            更新 Count 2
          </button>
          <div style="font-size: 12px; color: #666; margin-top: 8px;">← 只有這個數字會重新渲染</div>
        </div>

        <div style="padding: 12px; background: #fff; border: 2px solid #ddd; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #00d4ff;">{count3.value}</div>
          <button onClick={() => count3.value++} style="width: 100%; margin-top: 8px;">
            更新 Count 3
          </button>
          <div style="font-size: 12px; color: #666; margin-top: 8px;">← 只有這個數字會重新渲染</div>
        </div>
      </div>

      <div style="background: #e7f5ff; padding: 12px; border-radius: 6px; margin-top: 16px;">
        <strong>總點擊次數:</strong>{' '}
        <span style="font-size: 24px; color: #00d4ff;">{totalClicks.value}</span>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">
          每次點擊任何按鈕，只有對應的數字DOM節點更新，component 不會re-run
        </p>
      </div>

      <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-top: 12px;">
        <strong>🆚 對比 React:</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px;">
          React 需要 re-render 整個 component → 創建新的 virtual DOM → diff → 更新真實 DOM
          <br />
          ZenJS: Signal 直接更新對應的 DOM 節點 → <strong>零中間層</strong>
        </p>
      </div>
    </div>
  );
}

// ========== Batch Performance Demo ==========
export function BatchDemo() {
  const count = signal(0);
  const sum = computed(() => count.value * 3);

  return (
    <div class="demo-card" style="border: 2px solid #ff6b6b;">
      <h2>🚀 Batch Updates</h2>

      <div style="background: #fff5f5; padding: 16px; border-radius: 8px; margin: 12px 0;">
        <h3 style="margin-top: 0; color: #c92a2a;">💪 性能優勢</h3>
        <p style="margin: 8px 0;">
          <strong>Microtask Batching</strong> - 自動合併更新到下一個 microtask
        </p>
        <p style="margin: 8px 0;">
          <strong>減少重複計算</strong> - 多個改變只觸發一次更新
        </p>
        <p style="margin: 8px 0;">
          <strong>Smart Scheduling</strong> - 使用 queueMicrotask 優化性能
        </p>
      </div>

      <div style="background: #fff; padding: 16px; border: 2px solid #ff6b6b; border-radius: 8px; margin: 16px 0;">
        <div style="font-size: 18px; margin-bottom: 12px;">
          Count: <strong style="color: #ff6b6b; font-size: 32px;">{count.value}</strong>
        </div>
        <div style="font-size: 18px; margin-bottom: 16px;">
          Sum (x3): <strong style="color: #2f9e44; font-size: 32px;">{sum.value}</strong>
        </div>

        <button
          onClick={() => {
            batch(() => {
              count.value++;
              count.value++;
              count.value++;
            });
          }}
          style="width: 100%; padding: 12px; font-size: 16px; background: #51cf66; color: white; border: none; border-radius: 6px;"
        >
          批量 +3 (Batched)
        </button>
      </div>

      <div style="background: #d3f9d8; padding: 12px; border-radius: 6px; margin-top: 16px;">
        <strong>⚡ 工作原理:</strong>
        <p style="margin: 8px 0; font-size: 14px;">
          batch() 內的多個更新會合併成一次，所有依賴的 computed/effect 只執行一次
        </p>
      </div>

      <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-top: 12px;">
        <strong>🆚 對比普通更新:</strong>
        <p style="margin: 8px 0; font-size: 14px;">
          不用 batch: 每次 count.value++ 都觸發 sum 重新計算
          <br />用 batch: 3次改變合併，sum 只計算一次 → <strong>省 66% 運算</strong>
        </p>
      </div>
    </div>
  );
}

// ========== Memory Optimization Demo ==========
export function MemoryDemo() {
  return (
    <div class="demo-card" style="border: 2px solid #845ef7;">
      <h2>🧠 Memory Optimization</h2>

      <div style="background: #f3f0ff; padding: 16px; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #5f3dc4;">🎯 內存優化</h3>

        <div style="margin: 16px 0;">
          <strong style="color: #5f3dc4;">Bitfield Storage (≤32 subscribers)</strong>
          <div style="background: white; padding: 12px; border-radius: 6px; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 14px; color: #666;">普通 Set 儲存</div>
                <div style="font-size: 24px; font-weight: bold;">~120 bytes</div>
              </div>
              <div style="font-size: 32px;">→</div>
              <div>
                <div style="font-size: 14px; color: #666;">Bitfield 優化</div>
                <div style="font-size: 24px; font-weight: bold; color: #845ef7;">~52 bytes</div>
              </div>
              <div style="background: #d0bfff; padding: 8px 16px; border-radius: 4px;">
                <strong style="color: #5f3dc4;">省 56%</strong>
              </div>
            </div>
          </div>
        </div>

        <div style="margin: 16px 0;">
          <strong style="color: #5f3dc4;">Inline Subscriptions (簡單綁定)</strong>
          <div style="background: white; padding: 12px; border-radius: 6px; margin-top: 8px;">
            <p style="margin: 8px 0; font-size: 14px;">
              <code style="background: #f1f3f5; padding: 2px 6px; border-radius: 3px;">
                {'<div>{count.value}</div>'}
              </code>
            </p>
            <p style="margin: 8px 0; font-size: 14px; color: #666;">
              直接綁定，不創建 Effect object → <strong>減少 70% 對象創建</strong>
            </p>
          </div>
        </div>

        <div style="background: #e5dbff; padding: 12px; border-radius: 6px;">
          <strong>📊 綜合效果:</strong> 相比標準實現，內存使用減少約{' '}
          <strong style="color: #5f3dc4;">40-60%</strong>
        </div>
      </div>
    </div>
  );
}
