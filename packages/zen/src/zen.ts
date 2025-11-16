/**
 * Zen v3.23.0 - Advanced Reactivity System
 *
 * Core primitives:
 * - zen(value) → Signal
 * - computed(fn) → Computed
 * - effect(fn) → Effect
 * - subscribe(node, fn) → Subscribe
 * - batch(fn) → Batch
 */

// ============================================================================
// TYPES
// ============================================================================

export type Listener<T> = (value: T, oldValue: T | undefined) => void;
export type Unsubscribe = () => void;

// ============================================================================
// STATE CONSTANTS
// ============================================================================

const STATE_CLEAN = 0; // 所有依賴都最新
const STATE_CHECK = 1; // 可能有變更，需檢查
const STATE_DIRTY = 2; // 確定有變更，必須更新
const STATE_DISPOSED = 3; // 已釋放

// ============================================================================
// EFFECT TYPES
// ============================================================================

const EFFECT_PURE = 0; // 純計算，立即執行
const EFFECT_RENDER = 1; // 渲染效果
const EFFECT_USER = 2; // 用戶效果

// ============================================================================
// GLOBALS
// ============================================================================

let currentObserver: Computation<any> | null = null;
let currentOwner: Owner | null = null;
let batchDepth = 0;
let globalClock = 0;
let updateCount = 0;
const MAX_UPDATES = 1e5;
let isFlushing = false;

// ============================================================================
// INTERFACES
// ============================================================================

interface SourceType {
  _observers: ObserverType[];
  _observerSlots: number[];
  _epoch: number;
  _updateIfNecessary?(): void;
}

interface ObserverType {
  _sources: SourceType[];
  _sourceSlots: number[];
  _state: number;
  _epoch: number;
  notify(state: number): void;
}

interface Owner {
  _parent: Owner | null;
  _context: Record<symbol, any> | null;
  _disposal: (() => void)[] | null;
  _queue: EffectQueue | null;
}

interface EffectQueue {
  _effects: Computation<any>[];
  _scheduled: boolean;
}

// ============================================================================
// SCHEDULER
// ============================================================================

const queues: EffectQueue[] = [
  { _effects: [], _scheduled: false }, // PURE
  { _effects: [], _scheduled: false }, // RENDER
  { _effects: [], _scheduled: false }, // USER
];

function scheduleEffect(effect: Computation<any>, queueType: number) {
  const queue = queues[queueType];

  if (effect._queueSlot === -1) {
    effect._queueSlot = queue._effects.length;
    queue._effects.push(effect);
  }

  if (!queue._scheduled && !isFlushing) {
    queue._scheduled = true;
    if (batchDepth === 0) {
      // 同步執行避免測試問題
      flushQueue(queue, queueType);
    }
  }
}

function flushQueue(queue: EffectQueue, queueType: number) {
  if (!queue._scheduled) return;

  isFlushing = true;
  try {
    // EFFECT_PURE 後增加時鐘
    if (queueType === EFFECT_PURE) {
      globalClock++;
    }

    let error: any;
    // Loop while there are effects to process
    while (queue._effects.length > 0) {
      const effects = queue._effects.slice();
      queue._effects.length = 0;

      for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];
        if (effect._state !== STATE_DISPOSED) {
          effect._queueSlot = -1;
          try {
            effect.update();
          } catch (err) {
            if (!error) error = err;
          }
        }
      }
    }

    queue._scheduled = false;

    // 重置更新計數
    if (queueType === EFFECT_USER) {
      updateCount = 0;
    }

    if (error) throw error;
  } finally {
    isFlushing = false;
  }
}

function flush() {
  // 按順序執行三個隊列
  flushQueue(queues[EFFECT_PURE], EFFECT_PURE);
  flushQueue(queues[EFFECT_RENDER], EFFECT_RENDER);
  flushQueue(queues[EFFECT_USER], EFFECT_USER);
}

// ============================================================================
// OWNER SYSTEM
// ============================================================================

function createOwner(parent: Owner | null, queue: EffectQueue | null = null): Owner {
  return {
    _parent: parent,
    _context: parent?._context ?? null,
    _disposal: null,
    _queue: queue ?? parent?._queue ?? null,
  };
}

function runWithOwner<T>(owner: Owner | null, fn: () => T): T {
  const prevOwner = currentOwner;
  currentOwner = owner;
  try {
    return fn();
  } finally {
    currentOwner = prevOwner;
  }
}

function onCleanup(fn: () => void) {
  if (currentOwner) {
    if (!currentOwner._disposal) {
      currentOwner._disposal = [];
    }
    currentOwner._disposal.push(fn);
  }
}

function disposeOwner(owner: Owner) {
  if (owner._disposal) {
    for (let i = owner._disposal.length - 1; i >= 0; i--) {
      owner._disposal[i]?.();
    }
    owner._disposal = null;
  }
}

// ============================================================================
// DEPENDENCY TRACKING
// ============================================================================

function addObserver(source: SourceType, observer: ObserverType) {
  const sourceSlot = source._observers.length;
  const observerSlot = observer._sources.length;

  source._observers.push(observer);
  source._observerSlots.push(observerSlot);

  observer._sources.push(source);
  observer._sourceSlots.push(sourceSlot);
}

function removeObserver(source: SourceType, observerSlot: number) {
  const lastIdx = source._observers.length - 1;
  if (observerSlot > lastIdx) return;

  const observer = source._observers[observerSlot]!;
  const sourceIdx = source._observerSlots[observerSlot]!;

  if (observerSlot < lastIdx) {
    // Swap with last
    const last = source._observers[lastIdx]!;
    const lastSourceIdx = source._observerSlots[lastIdx]!;

    source._observers[observerSlot] = last;
    source._observerSlots[observerSlot] = lastSourceIdx;

    // Update swapped observer's slot
    last._sourceSlots[lastSourceIdx] = observerSlot;
  }

  source._observers.pop();
  source._observerSlots.pop();

  // Clear observer's reference
  if (sourceIdx < observer._sources.length) {
    observer._sources[sourceIdx] = null as any;
    observer._sourceSlots[sourceIdx] = -1;
  }
}

function clearObservers(observer: ObserverType) {
  const sources = observer._sources;
  const slots = observer._sourceSlots;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const slot = slots[i];
    if (source && slot !== -1) {
      removeObserver(source, slot);
    }
  }

  sources.length = 0;
  slots.length = 0;
}

// ============================================================================
// COMPUTATION
// ============================================================================

class Computation<T> implements SourceType, ObserverType, Owner {
  // Observer interface
  _sources: SourceType[] = [];
  _sourceSlots: number[] = [];
  _state = STATE_DIRTY;
  _epoch = 0;

  // Source interface
  _observers: ObserverType[] = [];
  _observerSlots: number[] = [];

  // Owner interface
  _parent: Owner | null;
  _context: Record<symbol, any> | null;
  _disposal: (() => void)[] | null = null;
  _queue: EffectQueue | null;

  // Computation
  _fn: () => T;
  _value: T;
  _error: any = undefined;

  // Effect queue
  _queueSlot = -1;
  _effectType: number;

  // Cleanup
  _cleanup: (() => void) | null = null;

  constructor(fn: () => T, initialValue: T, effectType: number = EFFECT_PURE) {
    this._fn = fn;
    this._value = initialValue;
    this._effectType = effectType;
    this._parent = currentOwner;
    this._context = currentOwner?._context ?? null;
    this._queue = currentOwner?._queue ?? queues[effectType];
  }

  read(): T {
    // 追蹤依賴
    if (currentObserver && currentObserver !== this) {
      addObserver(this, currentObserver);
    }

    // 確保值最新
    if (this._state !== STATE_CLEAN) {
      this._updateIfNecessary();
    }

    if (this._error !== undefined) {
      throw this._error;
    }

    return this._value;
  }

  write(value: T): void {
    if (Object.is(this._value, value)) return;

    this._value = value;
    this._epoch = ++globalClock;
    this._state = STATE_CLEAN;

    // 通知觀察者
    this._notifyObservers(STATE_DIRTY);
  }

  _updateIfNecessary(): void {
    // 已釋放或已是最新
    if (this._state === STATE_DISPOSED || this._state === STATE_CLEAN) {
      return;
    }

    // STATE_CHECK: 檢查父節點是否真的變了
    if (this._state === STATE_CHECK) {
      const sources = this._sources;
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (source) {
          source._updateIfNecessary?.();

          // 如果父節點 epoch 更新了，說明真的變了
          if (source._epoch > this._epoch) {
            this._state = STATE_DIRTY;
            break;
          }
        }
      }
    }

    // STATE_DIRTY: 必須重新計算
    if (this._state === STATE_DIRTY) {
      this.update();
    }

    // 標記為最新
    this._state = STATE_CLEAN;
  }

  update(): void {
    // 防止無限循環
    if (++updateCount > MAX_UPDATES) {
      throw new Error('[Zen] Potential infinite loop detected');
    }

    // 運行 cleanup
    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
      this._cleanup = null;
    }

    // 運行在自己的 owner context
    const prevOwner = currentOwner;
    const prevObserver = currentObserver;
    currentOwner = this;
    currentObserver = this;

    // 清除舊依賴
    clearObservers(this);

    try {
      const newValue = this._fn();

      // 更新值和 epoch
      if (!Object.is(this._value, newValue)) {
        this._value = newValue;
        this._epoch = ++globalClock;

        // 通知觀察者 (skip the observer that triggered this update)
        this._notifyObservers(STATE_DIRTY, prevObserver);
      }

      this._error = undefined;
      this._state = STATE_CLEAN;
    } catch (err) {
      this._error = err;
      this._state = STATE_CLEAN;
      throw err;
    } finally {
      currentObserver = prevObserver;
      currentOwner = prevOwner;
    }
  }

  notify(state: number): void {
    if (this._state >= state || this._state === STATE_DISPOSED) {
      return;
    }

    this._state = state;

    // 如果是 effect，調度執行
    if (this._effectType !== EFFECT_PURE) {
      scheduleEffect(this, this._effectType);
    }

    // 傳播 CHECK 到深層觀察者
    if (state === STATE_DIRTY) {
      this._notifyObservers(STATE_CHECK);
    }
  }

  _notifyObservers(state: number, skipObserver?: ObserverType | null): void {
    const observers = this._observers;

    for (let i = 0; i < observers.length; i++) {
      const observer = observers[i];
      // Skip notifying the observer that triggered this update to prevent double-execution
      if (observer && observer !== skipObserver) {
        observer.notify(state);
      }
    }
  }

  dispose(): void {
    if (this._state === STATE_DISPOSED) return;

    this._state = STATE_DISPOSED;

    // 清除依賴
    clearObservers(this);

    // 運行 cleanup
    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
      this._cleanup = null;
    }

    // 運行 disposal
    disposeOwner(this);

    // 從隊列移除
    if (this._queueSlot !== -1 && this._queue) {
      const queue = this._queue._effects;
      const lastIdx = queue.length - 1;

      if (this._queueSlot < lastIdx) {
        const last = queue[lastIdx]!;
        queue[this._queueSlot] = last;
        last._queueSlot = this._queueSlot;
      }

      queue.pop();
      this._queueSlot = -1;
    }
  }
}

// ============================================================================
// SIGNAL (ZenNode)
// ============================================================================

class Signal<T> implements SourceType {
  _value: T;
  _observers: ObserverType[] = [];
  _observerSlots: number[] = [];
  _epoch = 0;

  constructor(initial: T) {
    this._value = initial;
  }

  get value(): T {
    // 追蹤依賴
    if (currentObserver) {
      addObserver(this, currentObserver);
    }
    return this._value;
  }

  set value(next: T) {
    if (Object.is(this._value, next)) return;

    this._value = next;
    this._epoch = ++globalClock;

    // 通知觀察者：直接子節點 DIRTY，深層 CHECK
    const observers = this._observers;
    for (let i = 0; i < observers.length; i++) {
      const observer = observers[i];
      if (observer) {
        observer.notify(STATE_DIRTY);
      }
    }
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export interface ZenNode<T> {
  readonly value: T;
  value: T;
}

export interface ComputedNode<T> {
  readonly value: T;
}

export function zen<T>(initial: T): ZenNode<T> {
  return new Signal(initial) as any;
}

export function computed<T>(fn: () => T): ComputedNode<T> {
  const c = new Computation(fn, undefined as any, EFFECT_PURE);

  return {
    get value() {
      return c.read();
    },
  } as any;
}

export function effect(fn: () => undefined | (() => void)): Unsubscribe {
  const e = new Computation(
    () => {
      const cleanup = fn();
      if (cleanup) {
        e._cleanup = cleanup;
      }
      return undefined;
    },
    undefined,
    EFFECT_USER,
  );

  // Effect 立即執行一次
  e.update();

  return () => e.dispose();
}

export function subscribe<T>(
  node: ZenNode<T> | ComputedNode<T>,
  listener: Listener<T>,
): Unsubscribe {
  let hasValue = false;
  let previousValue!: T;

  return effect(() => {
    const currentValue = (node as any).value;

    if (!hasValue) {
      hasValue = true;
      previousValue = currentValue;
      return;
    }

    listener(currentValue, previousValue);
    previousValue = currentValue;
  });
}

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      flush();
    }
  }
}

export function untrack<T>(fn: () => T): T {
  const prev = currentObserver;
  currentObserver = null;
  try {
    return fn();
  } finally {
    currentObserver = prev;
  }
}

export function peek<T>(node: ZenNode<T> | ComputedNode<T>): T {
  return untrack(() => (node as any).value);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ZenNode as ZenCore, ComputedNode as ComputedCore };

export type { ZenNode as Zen, ZenNode as ReadonlyZen, ComputedNode as ComputedZen };
export type { Unsubscribe as AnyZen };
