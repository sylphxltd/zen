/**
 * Simple Version Comparison Script
 * Compares v2.0.0 (current) vs v1.2.1 (published)
 */

// Import published version
const pub = await import('@sylphx/zen');
// Import current version from dist
const cur = await import('./dist/index.js');

const iterations = 100000;

function benchmark(_name: string, fn: () => void, iters = iterations) {
  const start = performance.now();
  for (let i = 0; i < iters; i++) {
    fn();
  }
  const end = performance.now();
  const duration = end - start;
  const opsPerSec = (iters / duration) * 1000;
  return { duration, opsPerSec };
}

function compare(
  _category: string,
  _testName: string,
  pubFn: () => void,
  curFn: () => void,
  iters = iterations,
) {
  const pubResult = benchmark('v1.2.1', pubFn, iters);
  const curResult = benchmark('v2.0.0', curFn, iters);

  const improvement = ((curResult.opsPerSec - pubResult.opsPerSec) / pubResult.opsPerSec) * 100;

  return improvement;
}

const improvements: number[] = [];

improvements.push(
  compare(
    'Signal Creation',
    'zen(0)',
    () => pub.zen(0),
    () => cur.zen(0),
  ),
);

const pubSig = pub.zen(0);
const curSig = cur.zen(0);

improvements.push(
  compare(
    'Signal Read',
    'get(signal)',
    () => pub.get(pubSig),
    () => cur.get(curSig),
  ),
);

improvements.push(
  compare(
    'Signal Write',
    'set(signal, value)',
    () => pub.set(pubSig, Math.random()),
    () => cur.set(curSig, Math.random()),
  ),
);
const _getterResult = benchmark('getter', () => curSig.value);
const _setterResult = benchmark('setter', () => {
  curSig.value = Math.random();
});

const pubSub = pub.zen(0);
const curSub = cur.zen(0);

improvements.push(
  compare(
    'Subscribe/Unsubscribe',
    'subscribe() + unsub()',
    () => {
      const unsub = pub.subscribe(pubSub, () => {});
      unsub();
    },
    () => {
      const unsub = cur.subscribe(curSub, () => {});
      unsub();
    },
    10000,
  ),
);

const pubNotify = pub.zen(0);
const curNotify = cur.zen(0);
let pubCount = 0;
let curCount = 0;
pub.subscribe(pubNotify, () => pubCount++);
cur.subscribe(curNotify, () => curCount++);

improvements.push(
  compare(
    'Notify Listeners',
    'set() with 1 subscriber',
    () => pub.set(pubNotify, Math.random()),
    () => cur.set(curNotify, Math.random()),
    50000,
  ),
);

const pubA = pub.zen(1);
const pubB = pub.zen(2);
const curA = cur.zen(1);
const curB = cur.zen(2);

improvements.push(
  compare(
    'Computed Creation',
    'computed([a, b], fn)',
    () => pub.computed([pubA, pubB], (a: number, b: number) => a + b),
    () => cur.computed([curA, curB], (a: number, b: number) => a + b),
    10000,
  ),
);

const pubComp = pub.computed([pubA, pubB], (a: number, b: number) => a + b);
const curComp = cur.computed([curA, curB], (a: number, b: number) => a + b);

improvements.push(
  compare(
    'Computed Read',
    'get(computed)',
    () => pub.get(pubComp),
    () => cur.get(curComp),
  ),
);

pub.subscribe(pubComp, () => {});
cur.subscribe(curComp, () => {});

improvements.push(
  compare(
    'Computed Update',
    'set(source) triggers recompute',
    () => pub.set(pubA, Math.random()),
    () => cur.set(curA, Math.random()),
    50000,
  ),
);

const pubBatch = Array.from({ length: 10 }, () => pub.zen(0));
const curBatch = Array.from({ length: 10 }, () => cur.zen(0));

improvements.push(
  compare(
    'Batch',
    'batch(10 updates)',
    () => pub.batch(() => pubBatch.forEach((s, i) => pub.set(s, i))),
    () => cur.batch(() => curBatch.forEach((s, i) => cur.set(s, i))),
    10000,
  ),
);

improvements.push(
  compare(
    'Map Creation',
    'map({ ... })',
    () => pub.map({ count: 0, name: 'test' }),
    () => cur.map({ count: 0, name: 'test' }),
    10000,
  ),
);

const pubMap = pub.map({ count: 0, name: 'test' });
const curMap = cur.map({ count: 0, name: 'test' });

improvements.push(
  compare(
    'Map Update',
    'setKey(map, key, value)',
    () => pub.setKey(pubMap, 'count', Math.random()),
    () => cur.setKey(curMap, 'count', Math.random()),
    50000,
  ),
);

const pubRoot = pub.zen(1);
const pubD1 = pub.computed([pubRoot], (x: number) => x * 2);
const pubD2 = pub.computed([pubRoot], (x: number) => x * 3);
const pubFinal = pub.computed(
  [pubD1, pubD2],
  (a: number | null, b: number | null) => (a || 0) + (b || 0),
);
pub.subscribe(pubFinal, () => {});

const curRoot = cur.zen(1);
const curD1 = cur.computed([curRoot], (x: number) => x * 2);
const curD2 = cur.computed([curRoot], (x: number) => x * 3);
const curFinal = cur.computed(
  [curD1, curD2],
  (a: number | null, b: number | null) => (a || 0) + (b || 0),
);
cur.subscribe(curFinal, () => {});

improvements.push(
  compare(
    'Reactive Graph',
    '1 root → 2 computed → 1 final',
    () => pub.set(pubRoot, Math.random()),
    () => cur.set(curRoot, Math.random()),
    50000,
  ),
);

const pubStress = pub.zen(0);
const curStress = cur.zen(0);

improvements.push(
  compare(
    'Stress',
    '1000 sequential updates',
    () => {
      for (let i = 0; i < 1000; i++) pub.set(pubStress, i);
    },
    () => {
      for (let i = 0; i < 1000; i++) cur.set(curStress, i);
    },
    100,
  ),
);

const _avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
const _fasterCount = improvements.filter((i) => i > 0).length;
const _totalTests = improvements.length;
