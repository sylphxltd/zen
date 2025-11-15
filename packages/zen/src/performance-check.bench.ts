import { batch, computed, effect, subscribe, zen } from '@sylphx/zen';
import { bench, describe } from 'vitest';

describe('Core Performance - zen.ts with lifecycle events', () => {
  describe('Atom Creation', () => {
    bench('create zen atom', () => {
      zen(0);
    });
  });

  describe('Atom Read/Write (no listeners)', () => {
    bench('read atom value', () => {
      const a = zen(0);
      const _ = a.value;
    });

    bench('write atom value', () => {
      const a = zen(0);
      a.value = 1;
    });

    bench('read/write 100 times', () => {
      const a = zen(0);
      for (let i = 0; i < 100; i++) {
        a.value = i;
        const _ = a.value;
      }
    });
  });

  describe('Atom with Listeners', () => {
    bench('write with 1 listener', () => {
      const a = zen(0);
      let _count = 0;
      subscribe(a, () => {
        _count++;
      });
      a.value = 1;
    });

    bench('write with 5 listeners', () => {
      const a = zen(0);
      let _count = 0;
      for (let i = 0; i < 5; i++) {
        subscribe(a, () => {
          _count++;
        });
      }
      a.value = 1;
    });

    bench('write with 10 listeners', () => {
      const a = zen(0);
      let _count = 0;
      for (let i = 0; i < 10; i++) {
        subscribe(a, () => {
          _count++;
        });
      }
      a.value = 1;
    });
  });

  describe('Computed', () => {
    bench('create computed', () => {
      const a = zen(0);
      computed(() => a.value * 2);
    });

    bench('read computed value', () => {
      const a = zen(0);
      const c = computed(() => a.value * 2);
      const _ = c.value;
    });

    bench('computed chain (depth 5)', () => {
      const a = zen(0);
      const c1 = computed(() => a.value * 2);
      const c2 = computed(() => c1.value * 2);
      const c3 = computed(() => c2.value * 2);
      const c4 = computed(() => c3.value * 2);
      const c5 = computed(() => c4.value * 2);
      a.value = 1;
      const _ = c5.value;
    });
  });

  describe('Batching', () => {
    bench('batch 2 updates with 1 listener', () => {
      const a = zen(0);
      const b = zen(0);
      let _count = 0;
      subscribe(a, () => {
        _count++;
      });
      subscribe(b, () => {
        _count++;
      });
      batch(() => {
        a.value = 1;
        b.value = 1;
      });
    });

    bench('batch 10 updates with 1 listener each', () => {
      const atoms = Array.from({ length: 10 }, () => zen(0));
      let _count = 0;
      for (const a of atoms) {
        subscribe(a, () => {
          _count++;
        });
      }
      batch(() => {
        for (const a of atoms) {
          a.value = 1;
        }
      });
    });

    bench('batch 100 updates with 1 listener each', () => {
      const atoms = Array.from({ length: 100 }, () => zen(0));
      let _count = 0;
      for (const a of atoms) {
        subscribe(a, () => {
          _count++;
        });
      }
      batch(() => {
        for (const a of atoms) {
          a.value = 1;
        }
      });
    });
  });

  describe('Effect', () => {
    bench('create effect with 1 dependency', () => {
      const a = zen(0);
      effect(() => {
        a.value;
      });
    });

    bench('effect trigger (1 dep)', () => {
      const a = zen(0);
      let _count = 0;
      effect(() => {
        a.value;
        _count++;
      });
      a.value = 1;
    });

    bench('effect trigger (5 deps)', () => {
      const a = zen(0);
      const b = zen(0);
      const c = zen(0);
      const d = zen(0);
      const e = zen(0);
      let _count = 0;
      effect(() => {
        a.value + b.value + c.value + d.value + e.value;
        _count++;
      });
      a.value = 1;
    });
  });

  describe('Subscribe/Unsubscribe (lifecycle hotpath)', () => {
    bench('subscribe and unsubscribe (no lifecycle listeners)', () => {
      const a = zen(0);
      const unsub = subscribe(a, () => {});
      unsub();
    });

    bench('subscribe and unsubscribe 100 times', () => {
      const a = zen(0);
      for (let i = 0; i < 100; i++) {
        const unsub = subscribe(a, () => {});
        unsub();
      }
    });
  });
});
