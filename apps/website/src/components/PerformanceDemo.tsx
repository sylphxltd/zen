import { computed, effect, onCleanup, signal } from '@rapid/signal';
import { For, Show } from '@rapid/web';
import { Icon } from './Icon';

export function PerformanceDemo() {
  const isRunning = signal(false);
  const itemCount = signal(1000);
  const uncappedMode = signal(false);
  const fps = signal(0);
  const updateCount = signal(0);
  const items = signal<Array<{ id: number; value: number }>>([]);

  let animationFrameId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastFrameTime = performance.now();
  let frameCount = 0;

  // Initialize and dynamically adjust items
  effect(() => {
    const count = itemCount.value;
    const current = items.value;

    if (count === current.length) return; // No change needed

    if (count > current.length) {
      // Add new items
      const newItems = Array.from({ length: count - current.length }, (_, i) => ({
        id: current.length + i,
        value: Math.random() * 100,
      }));
      items.value = [...current, ...newItems];
    } else {
      // Remove excess items
      items.value = current.slice(0, count);
    }
  });

  // FPS counter
  const measureFPS = () => {
    const now = performance.now();
    frameCount++;

    if (now >= lastFrameTime + 1000) {
      fps.value = Math.round((frameCount * 1000) / (now - lastFrameTime));
      frameCount = 0;
      lastFrameTime = now;
    }

    if (isRunning.value) {
      if (uncappedMode.value) {
        timeoutId = setTimeout(measureFPS, 0);
      } else {
        animationFrameId = requestAnimationFrame(measureFPS);
      }
    }
  };

  // Animation loop - update random items
  const animate = () => {
    if (!isRunning.value) return;

    // Update 10% of items each frame
    const _updateAmount = Math.max(1, Math.floor(itemCount.value * 0.1));

    items.value = items.value.map((item) => {
      if (Math.random() < 0.1) {
        updateCount.value++;
        return {
          ...item,
          value: Math.random() * 100,
        };
      }
      return item;
    });

    if (uncappedMode.value) {
      timeoutId = setTimeout(animate, 0);
    } else {
      requestAnimationFrame(animate);
    }
  };

  const start = () => {
    if (isRunning.value) return;

    isRunning.value = true;
    updateCount.value = 0;
    frameCount = 0;
    lastFrameTime = performance.now();

    measureFPS();
    animate();
  };

  const stop = () => {
    isRunning.value = false;

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const reset = () => {
    stop();
    updateCount.value = 0;
    fps.value = 0;
    items.value = Array.from({ length: itemCount.value }, (_, i) => ({
      id: i,
      value: Math.random() * 100,
    }));
  };

  const fpsColor = computed(() => {
    const currentFps = fps.value;
    if (currentFps >= 55) return 'text-success';
    if (currentFps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  });

  // Cleanup animations on unmount
  onCleanup(() => {
    stop();
  });

  return (
    <section class="py-16 px-0 bg-bg-light dark:bg-bg-dark">
      <div class="max-w-screen-xl mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold text-text dark:text-text-dark mb-4">
            Performance Demo
          </h2>
          <p class="text-xl text-text-muted dark:text-text-dark-muted max-w-3xl mx-auto">
            Watch Rapid handle thousands of reactive updates at maximum performance
          </p>
        </div>

        <div class="bg-bg dark:bg-bg-dark-light border border-border dark:border-border-dark rounded-rapid p-8 mb-8">
          {/* Controls */}
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-4">
              <button
                type="button"
                onClick={start}
                disabled={isRunning.value}
                class="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-rapid disabled:opacity-50 disabled:cursor-not-allowed transition-all interactive-scale"
              >
                <Icon icon="lucide:play" width="20" height="20" class="inline mr-2" />
                Start
              </button>
              <button
                type="button"
                onClick={stop}
                disabled={!isRunning.value}
                class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-rapid disabled:opacity-50 disabled:cursor-not-allowed transition-all interactive-scale"
              >
                <Icon icon="lucide:square" width="20" height="20" class="inline mr-2" />
                Stop
              </button>
              <button
                type="button"
                onClick={reset}
                class="px-6 py-3 bg-bg-lighter dark:bg-bg-dark-lighter border border-border dark:border-border-dark text-text dark:text-text-dark font-semibold rounded-rapid hover:border-primary transition-all interactive-scale"
              >
                <Icon icon="lucide:rotate-ccw" width="20" height="20" class="inline mr-2" />
                Reset
              </button>
            </div>

            <div class="flex items-center gap-6">
              <div class="flex items-center gap-3">
                <label class="text-text dark:text-text-dark font-medium">
                  Items:
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={itemCount.value}
                    onInput={(e: Event) => {
                      itemCount.value = Number((e.target as HTMLInputElement).value);
                    }}
                    class="w-32 ml-2"
                  />
                </label>
                <span class="text-text dark:text-text-dark font-mono font-bold min-w-[60px]">
                  {itemCount.value}
                </span>
              </div>

              <label class="flex items-center gap-2 text-text dark:text-text-dark font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={uncappedMode.value}
                  onChange={(e: Event) => {
                    uncappedMode.value = (e.target as HTMLInputElement).checked;
                  }}
                  class="w-4 h-4"
                />
                Uncapped FPS
              </label>
            </div>
          </div>

          {/* Metrics */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-bg-lighter dark:bg-bg-dark-lighter border border-border dark:border-border-dark rounded-rapid p-6 text-center">
              <div class="text-text-muted dark:text-text-dark-muted text-sm font-medium mb-2">
                FPS
              </div>
              <div class={`text-4xl font-bold ${fpsColor.value}`}>{fps.value}</div>
              <div class="text-xs text-text-muted dark:text-text-dark-muted mt-1">
                {uncappedMode.value ? 'Uncapped mode' : 'Display refresh rate'}
              </div>
            </div>

            <div class="bg-bg-lighter dark:bg-bg-dark-lighter border border-border dark:border-border-dark rounded-rapid p-6 text-center">
              <div class="text-text-muted dark:text-text-dark-muted text-sm font-medium mb-2">
                Total Updates
              </div>
              <div class="text-4xl font-bold text-primary">
                {updateCount.value.toLocaleString()}
              </div>
              <div class="text-xs text-text-muted dark:text-text-dark-muted mt-1">Since start</div>
            </div>

            <div class="bg-bg-lighter dark:bg-bg-dark-lighter border border-border dark:border-border-dark rounded-rapid p-6 text-center">
              <div class="text-text-muted dark:text-text-dark-muted text-sm font-medium mb-2">
                Items Rendered
              </div>
              <div class="text-4xl font-bold text-secondary">{items.value.length}</div>
              <div class="text-xs text-text-muted dark:text-text-dark-muted mt-1">
                ~{Math.floor(items.value.length * 0.1)}/frame updates
              </div>
            </div>
          </div>

          {/* Visual Grid */}
          <div class="bg-bg-lighter dark:bg-bg-dark-lighter border border-border dark:border-border-dark rounded-rapid p-4 overflow-hidden">
            <div class="grid grid-cols-10 sm:grid-cols-20 gap-1 max-h-[400px] overflow-y-auto">
              <For each={items.value} key={(item) => item.id}>
                {(item) => {
                  const height = Math.max(10, item.value);
                  const hue = (item.value / 100) * 120; // 0 (red) to 120 (green)

                  return (
                    <div
                      class="relative group"
                      style={{
                        height: `${height}px`,
                        backgroundColor: `hsl(${hue}, 70%, 50%)`,
                        transition: 'height 0.3s ease, background-color 0.3s ease',
                      }}
                      title={`#${item.id}: ${item.value.toFixed(1)}`}
                    />
                  );
                }}
              </For>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div class="bg-bg dark:bg-bg-dark-light border border-border dark:border-border-dark rounded-rapid p-6">
          <h3 class="text-xl font-semibold text-text dark:text-text-dark mb-4 flex items-center gap-2">
            <Icon icon="lucide:info" width="24" height="24" class="text-primary" />
            How It Works
          </h3>
          <div class="space-y-3 text-text-muted dark:text-text-dark-muted">
            <p>
              <strong class="text-text dark:text-text-dark">Fine-grained reactivity:</strong> Each
              colored bar is a separate reactive element. When values update, only the affected bars
              re-render.
            </p>
            <p>
              <strong class="text-text dark:text-text-dark">No Virtual DOM:</strong> Rapid directly
              updates the DOM elements that changed. No diffing, no reconciliation overhead.
            </p>
            <p>
              <strong class="text-text dark:text-text-dark">Smooth performance:</strong> Even with
              thousands of items and hundreds of updates per second, Rapid maintains peak
              performance at your display's maximum refresh rate.
            </p>
            <p class="text-sm pt-2 border-t border-border dark:border-border-dark">
              Try increasing the item count and watch the FPS stay high. This is the power of
              fine-grained reactivity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
