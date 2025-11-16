import { bench, describe } from 'vitest';
import * as ZenOriginal from './zen';
import * as ZenOptimized from './zen-optimized';

describe('read performance comparison', () => {
  bench('[ORIGINAL] single read', () => {
    const count = ZenOriginal.zen(42);
    return () => {
      count.value;
    };
  });

  bench('[OPTIMIZED] single read', () => {
    const count = ZenOptimized.zen(42);
    return () => {
      count.value;
    };
  });

  bench('[ORIGINAL] read 100x in computed', () => {
    const count = ZenOriginal.zen(0);
    const sum = ZenOriginal.computed(() => {
      let total = 0;
      for (let i = 0; i < 100; i++) {
        total += count.value;
      }
      return total;
    });

    let i = 0;
    return () => {
      count.value = i++;
      sum.value;
    };
  });

  bench('[OPTIMIZED] read 100x in computed', () => {
    const count = ZenOptimized.zen(0);
    const sum = ZenOptimized.computed(() => {
      let total = 0;
      for (let i = 0; i < 100; i++) {
        total += count.value;
      }
      return total;
    });

    let i = 0;
    return () => {
      count.value = i++;
      sum.value;
    };
  });

  bench('[ORIGINAL] read 1000x in computed', () => {
    const count = ZenOriginal.zen(0);
    const sum = ZenOriginal.computed(() => {
      let total = 0;
      for (let i = 0; i < 1000; i++) {
        total += count.value;
      }
      return total;
    });

    let i = 0;
    return () => {
      count.value = i++;
      sum.value;
    };
  });

  bench('[OPTIMIZED] read 1000x in computed', () => {
    const count = ZenOptimized.zen(0);
    const sum = ZenOptimized.computed(() => {
      let total = 0;
      for (let i = 0; i < 1000; i++) {
        total += count.value;
      }
      return total;
    });

    let i = 0;
    return () => {
      count.value = i++;
      sum.value;
    };
  });
});

describe('write performance comparison', () => {
  bench('[ORIGINAL] single write', () => {
    const count = ZenOriginal.zen(0);
    let i = 0;
    return () => {
      count.value = i++;
    };
  });

  bench('[OPTIMIZED] single write', () => {
    const count = ZenOptimized.zen(0);
    let i = 0;
    return () => {
      count.value = i++;
    };
  });

  bench('[ORIGINAL] batch write 10x', () => {
    const count = ZenOriginal.zen(0);
    let i = 0;
    return () => {
      ZenOriginal.batch(() => {
        for (let j = 0; j < 10; j++) {
          count.value = i++;
        }
      });
    };
  });

  bench('[OPTIMIZED] batch write 10x', () => {
    const count = ZenOptimized.zen(0);
    let i = 0;
    return () => {
      ZenOptimized.batch(() => {
        for (let j = 0; j < 10; j++) {
          count.value = i++;
        }
      });
    };
  });

  bench('[ORIGINAL] heavy write 1000x', () => {
    const count = ZenOriginal.zen(0);
    let i = 0;
    return () => {
      for (let j = 0; j < 1000; j++) {
        count.value = i++;
      }
    };
  });

  bench('[OPTIMIZED] heavy write 1000x', () => {
    const count = ZenOptimized.zen(0);
    let i = 0;
    return () => {
      for (let j = 0; j < 1000; j++) {
        count.value = i++;
      }
    };
  });
});

describe('reactivity patterns comparison', () => {
  bench('[ORIGINAL] diamond pattern', () => {
    const a = ZenOriginal.zen(1);
    const b = ZenOriginal.computed(() => a.value * 2);
    const c = ZenOriginal.computed(() => a.value * 3);
    const d = ZenOriginal.computed(() => b.value + c.value);

    let i = 0;
    return () => {
      a.value = i++;
      d.value;
    };
  });

  bench('[OPTIMIZED] diamond pattern', () => {
    const a = ZenOptimized.zen(1);
    const b = ZenOptimized.computed(() => a.value * 2);
    const c = ZenOptimized.computed(() => a.value * 3);
    const d = ZenOptimized.computed(() => b.value + c.value);

    let i = 0;
    return () => {
      a.value = i++;
      d.value;
    };
  });

  bench('[ORIGINAL] deep chain 10 layers', () => {
    const a = ZenOriginal.zen(1);
    const b = ZenOriginal.computed(() => a.value + 1);
    const c = ZenOriginal.computed(() => b.value + 1);
    const d = ZenOriginal.computed(() => c.value + 1);
    const e = ZenOriginal.computed(() => d.value + 1);
    const f = ZenOriginal.computed(() => e.value + 1);
    const g = ZenOriginal.computed(() => f.value + 1);
    const h = ZenOriginal.computed(() => g.value + 1);
    const i = ZenOriginal.computed(() => h.value + 1);
    const j = ZenOriginal.computed(() => i.value + 1);

    let counter = 0;
    return () => {
      a.value = counter++;
      j.value;
    };
  });

  bench('[OPTIMIZED] deep chain 10 layers', () => {
    const a = ZenOptimized.zen(1);
    const b = ZenOptimized.computed(() => a.value + 1);
    const c = ZenOptimized.computed(() => b.value + 1);
    const d = ZenOptimized.computed(() => c.value + 1);
    const e = ZenOptimized.computed(() => d.value + 1);
    const f = ZenOptimized.computed(() => e.value + 1);
    const g = ZenOptimized.computed(() => f.value + 1);
    const h = ZenOptimized.computed(() => g.value + 1);
    const i = ZenOptimized.computed(() => h.value + 1);
    const j = ZenOptimized.computed(() => i.value + 1);

    let counter = 0;
    return () => {
      a.value = counter++;
      j.value;
    };
  });

  bench('[ORIGINAL] wide fanout 100', () => {
    const source = ZenOriginal.zen(0);
    const computeds = Array.from({ length: 100 }, () =>
      ZenOriginal.computed(() => source.value * 2),
    );

    let i = 0;
    return () => {
      source.value = i++;
      for (const c of computeds) {
        c.value;
      }
    };
  });

  bench('[OPTIMIZED] wide fanout 100', () => {
    const source = ZenOptimized.zen(0);
    const computeds = Array.from({ length: 100 }, () =>
      ZenOptimized.computed(() => source.value * 2),
    );

    let i = 0;
    return () => {
      source.value = i++;
      for (const c of computeds) {
        c.value;
      }
    };
  });
});
