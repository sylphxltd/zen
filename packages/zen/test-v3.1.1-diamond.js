// Test v3.1.1's behavior in diamond pattern
// Copy v3.1.1 implementation inline for testing

let currentListener = null;
let batchDepth = 0;
const pendingNotifications = new Map();

const zenProto = {
  get value() {
    if (currentListener) {
      const sources = currentListener._sources;
      if (!sources.includes(this)) {
        sources.push(this);
      }
    }
    return this._value;
  },
  set value(newValue) {
    const oldValue = this._value;
    if (Object.is(newValue, oldValue)) return;

    this._value = newValue;

    // Mark computed dependents as dirty
    const listeners = this._listeners;
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i];
        if (listener._computedZen) {
          listener._computedZen._dirty = true;
        }
      }
    }

    // NO AUTO-BATCH
    if (batchDepth > 0) {
      if (!pendingNotifications.has(this)) {
        pendingNotifications.set(this, oldValue);
      }
    } else {
      // Direct notify
      if (listeners) {
        for (let i = 0; i < listeners.length; i++) {
          listeners[i](newValue, oldValue);
        }
      }
    }
  },
};

function zen(initialValue) {
  const signal = Object.create(zenProto);
  signal._kind = 'zen';
  signal._value = initialValue;
  return signal;
}

function updateComputed(c) {
  const prevListener = currentListener;
  currentListener = c;

  try {
    const newValue = c._calc();
    c._dirty = false;

    if (c._value !== null && Object.is(newValue, c._value)) return;

    const oldValue = c._value;
    c._value = newValue;

    if (batchDepth > 0) {
      if (!pendingNotifications.has(c)) {
        pendingNotifications.set(c, oldValue);
      }
    } else {
      const listeners = c._listeners;
      if (listeners) {
        for (let i = 0; i < listeners.length; i++) {
          listeners[i](newValue, oldValue);
        }
      }
    }
  } finally {
    currentListener = prevListener;
  }
}

function subscribeToSources(c) {
  const onSourceChange = () => {
    c._dirty = true;
    updateComputed(c);  // ← EAGER UPDATE!
  };
  onSourceChange._computedZen = c;

  c._unsubs = [];
  for (let i = 0; i < c._sources.length; i++) {
    const source = c._sources[i];
    if (!source._listeners) source._listeners = [];
    source._listeners.push(onSourceChange);
  }
}

const computedProto = {
  get value() {
    if (currentListener) {
      const sources = currentListener._sources;
      if (!sources.includes(this)) {
        sources.push(this);
      }
    }

    if (this._dirty) {
      updateComputed(this);
      if (this._unsubs === undefined && this._sources.length > 0) {
        subscribeToSources(this);
      }
    }
    return this._value;
  },
};

function computed(calc) {
  const c = Object.create(computedProto);
  c._kind = 'computed';
  c._value = null;
  c._dirty = true;
  c._calc = calc;
  c._sources = [];
  return c;
}

// ============================================================================
// TEST: Diamond Pattern
// ============================================================================

let leftCount = 0;
let rightCount = 0;
let resultCount = 0;

const source = zen(0);

const left = computed(() => {
  leftCount++;
  return source.value * 2;
});

const right = computed(() => {
  rightCount++;
  return source.value + 10;
});

const result = computed(() => {
  resultCount++;
  return left.value + right.value;
});

// Force subscription
const _ = result.value;

console.log('After setup:');
console.log('  left:', leftCount, 'right:', rightCount, 'result:', resultCount);

// Reset counters
leftCount = rightCount = resultCount = 0;

// Update source 10 times WITHOUT batch
for (let i = 0; i < 10; i++) {
  source.value = i;
}

console.log('\nAfter 10 updates (NO BATCH):');
console.log('  left:', leftCount, 'right:', rightCount, 'result:', resultCount);
console.log('\nExpected: each should be 10 (one calculation per update)');

if (leftCount > 10 || rightCount > 10 || resultCount > 10) {
  console.log('\n❌ REDUNDANT CALCULATIONS DETECTED!');
  console.log('This is the diamond pattern glitch in v3.1.1');
} else {
  console.log('\n✅ No redundant calculations');
}
