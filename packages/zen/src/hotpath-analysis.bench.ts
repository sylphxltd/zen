import { bench, describe } from 'vitest';
import { zen, set, subscribe, computed } from './zen';

describe('Hot Path Analysis - Notification Loop', () => {
  bench('baseline: set without listeners (measures pure set overhead)', () => {
    const atom = zen(0);
    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });

  bench('set + 1 listener (empty function)', () => {
    const atom = zen(0);
    subscribe(atom, () => {});
    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });

  bench('set + 10 listeners (empty functions)', () => {
    const atom = zen(0);
    for (let i = 0; i < 10; i++) {
      subscribe(atom, () => {});
    }
    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });

  bench('set + 10 listeners (with simple work: counter++)', () => {
    const atom = zen(0);
    let counter = 0;
    for (let i = 0; i < 10; i++) {
      subscribe(atom, () => { counter++; });
    }
    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });
});

describe('Hot Path Analysis - Computed Updates', () => {
  bench('computed chain: base -> computed (x2) -> computed (x2)', () => {
    const base = zen(0);
    const c1 = computed([base], ([v]: [number]) => v * 2);
    const c2 = computed([c1], ([v]: [number]) => v * 2);
    subscribe(c2, () => {});

    for (let i = 0; i < 100; i++) {
      set(base, i);
    }
  });

  bench('computed with 5 sources, all changing', () => {
    const sources = Array.from({ length: 5 }, () => zen(0));
    const sum = computed(sources, (...vals: number[]) => vals.reduce((a, b) => a + b, 0));
    subscribe(sum, () => {});

    for (let i = 0; i < 100; i++) {
      for (const source of sources) {
        set(source, i);
      }
    }
  });

  bench('computed with 5 sources, only 1 changing', () => {
    const sources = Array.from({ length: 5 }, () => zen(0));
    const sum = computed(sources, (...vals: number[]) => vals.reduce((a, b) => a + b, 0));
    subscribe(sum, () => {});

    for (let i = 0; i < 100; i++) {
      set(sources[0], i); // Only update first source
    }
  });
});

describe('Hot Path Analysis - Memory Allocation', () => {
  bench('rapid zen creation and updates', () => {
    for (let i = 0; i < 100; i++) {
      const atom = zen(i);
      subscribe(atom, () => {});
      set(atom, i + 1);
    }
  });

  bench('zen reuse with unsubscribe', () => {
    const atom = zen(0);
    for (let i = 0; i < 100; i++) {
      const unsub = subscribe(atom, () => {});
      set(atom, i);
      unsub();
    }
  });
});

describe('Hot Path Analysis - Listener Patterns', () => {
  bench('many listeners, few updates', () => {
    const atom = zen(0);
    for (let i = 0; i < 50; i++) {
      subscribe(atom, () => {});
    }
    for (let i = 0; i < 10; i++) {
      set(atom, i);
    }
  });

  bench('few listeners, many updates', () => {
    const atom = zen(0);
    for (let i = 0; i < 5; i++) {
      subscribe(atom, () => {});
    }
    for (let i = 0; i < 200; i++) {
      set(atom, i);
    }
  });
});
