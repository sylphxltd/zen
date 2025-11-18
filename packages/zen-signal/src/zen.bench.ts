import { bench, describe } from 'vitest';
import { batch, computed, effect, subscribe, zen } from './zen';

describe('zen primitives', () => {
  bench('create zen signal', () => {
    zen(0);
  });

  bench('read zen value', () => {
    const count = zen(42);
    count.value;
  });

  bench('write zen value', () => {
    const count = zen(0);
    count.value = 1;
  });

  bench('write same value (no-op)', () => {
    const count = zen(42);
    count.value = 42;
  });
});

describe('computed', () => {
  bench('create computed', () => {
    const count = zen(0);
    computed(() => count.value * 2);
  });

  bench('read computed (cached)', () => {
    const count = zen(42);
    const doubled = computed(() => count.value * 2);
    doubled.value; // warm up

    return () => {
      doubled.value;
    };
  });

  bench('read computed (stale)', () => {
    const count = zen(0);
    const doubled = computed(() => count.value * 2);
    doubled.value; // warm up

    let i = 0;
    return () => {
      count.value = i++;
      doubled.value;
    };
  });

  bench('computed chain (3 levels)', () => {
    const a = zen(1);
    const b = computed(() => a.value * 2);
    const c = computed(() => b.value * 2);
    const d = computed(() => c.value * 2);

    let i = 0;
    return () => {
      a.value = i++;
      d.value;
    };
  });

  bench('computed with 3 dependencies', () => {
    const a = zen(1);
    const b = zen(2);
    const c = zen(3);
    const sum = computed(() => a.value + b.value + c.value);
    sum.value; // warm up

    let i = 0;
    return () => {
      a.value = i++;
      sum.value;
    };
  });

  bench('dynamic dependencies switch', () => {
    const toggle = zen(true);
    const a = zen(1);
    const b = zen(10);
    const dynamic = computed(() => (toggle.value ? a.value : b.value));

    subscribe(dynamic, () => {}); // activate subscriptions

    return () => {
      toggle.value = !toggle.value;
      dynamic.value;
    };
  });
});

describe('subscribe', () => {
  bench('subscribe to zen', () => {
    const count = zen(0);
    subscribe(count, () => {});
  });

  bench('subscribe + unsubscribe', () => {
    const count = zen(0);
    return () => {
      const unsub = subscribe(count, () => {});
      unsub();
    };
  });

  bench('notify 1 subscriber', () => {
    const count = zen(0);
    subscribe(count, () => {});

    let i = 0;
    return () => {
      count.value = i++;
    };
  });

  bench('notify 3 subscribers', () => {
    const count = zen(0);
    subscribe(count, () => {});
    subscribe(count, () => {});
    subscribe(count, () => {});

    let i = 0;
    return () => {
      count.value = i++;
    };
  });

  bench('notify 10 subscribers', () => {
    const count = zen(0);
    for (let i = 0; i < 10; i++) {
      subscribe(count, () => {});
    }

    let i = 0;
    return () => {
      count.value = i++;
    };
  });

  bench('subscribe to computed', () => {
    const count = zen(0);
    const doubled = computed(() => count.value * 2);

    return () => {
      subscribe(doubled, () => {});
    };
  });
});

describe('effect', () => {
  bench('create effect', () => {
    const count = zen(0);
    effect(() => {
      count.value;
    });
  });

  bench('effect + dispose', () => {
    const count = zen(0);
    return () => {
      const dispose = effect(() => {
        count.value;
      });
      dispose();
    };
  });

  bench('effect re-execution', () => {
    const count = zen(0);
    effect(() => {
      count.value;
    });

    let i = 0;
    return () => {
      count.value = i++;
    };
  });

  bench('effect with cleanup', () => {
    const count = zen(0);
    effect(() => {
      count.value;
      return () => {}; // cleanup
    });

    let i = 0;
    return () => {
      count.value = i++;
    };
  });

  bench('effect dynamic dependencies', () => {
    const toggle = zen(true);
    const a = zen(1);
    const b = zen(10);

    effect(() => {
      toggle.value ? a.value : b.value;
    });

    return () => {
      toggle.value = !toggle.value;
    };
  });
});

describe('batch', () => {
  bench('batch 1 update', () => {
    const count = zen(0);
    subscribe(count, () => {});

    let i = 0;
    return () => {
      batch(() => {
        count.value = i++;
      });
    };
  });

  bench('batch 3 updates (same signal)', () => {
    const count = zen(0);
    subscribe(count, () => {});

    let i = 0;
    return () => {
      batch(() => {
        count.value = i++;
        count.value = i++;
        count.value = i++;
      });
    };
  });

  bench('batch 3 signals', () => {
    const a = zen(0);
    const b = zen(0);
    const c = zen(0);
    subscribe(a, () => {});
    subscribe(b, () => {});
    subscribe(c, () => {});

    let i = 0;
    return () => {
      batch(() => {
        a.value = i++;
        b.value = i++;
        c.value = i++;
      });
    };
  });

  bench('nested batch (2 levels)', () => {
    const count = zen(0);
    subscribe(count, () => {});

    let i = 0;
    return () => {
      batch(() => {
        batch(() => {
          count.value = i++;
        });
      });
    };
  });
});

describe('real-world patterns', () => {
  bench('counter with derived state', () => {
    const count = zen(0);
    const doubled = computed(() => count.value * 2);
    const quadrupled = computed(() => doubled.value * 2);

    subscribe(quadrupled, () => {});

    let i = 0;
    return () => {
      count.value = i++;
    };
  });

  bench('form state (3 fields)', () => {
    const name = zen('');
    const email = zen('');
    const age = zen(0);

    const isValid = computed(
      () => name.value.length > 0 && email.value.includes('@') && age.value >= 18,
    );

    subscribe(isValid, () => {});

    let i = 0;
    return () => {
      batch(() => {
        name.value = `User${i}`;
        email.value = `user${i}@example.com`;
        age.value = 20 + (i % 50);
      });
      i++;
    };
  });

  bench('todo list (10 items)', () => {
    const todos = zen(
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        text: `Task ${i}`,
        done: false,
      })),
    );

    const completed = computed(() => todos.value.filter((t) => t.done).length);

    const remaining = computed(() => todos.value.length - completed.value);

    subscribe(remaining, () => {});

    let i = 0;
    return () => {
      const current = todos.value;
      const idx = i % 10;
      const item = current[idx];
      if (item) {
        todos.value = [
          ...current.slice(0, idx),
          { ...item, done: !item.done },
          ...current.slice(idx + 1),
        ];
      }
      i++;
    };
  });

  bench('reactive graph (diamond pattern)', () => {
    const a = zen(1);
    const b = computed(() => a.value * 2);
    const c = computed(() => a.value * 3);
    const d = computed(() => b.value + c.value);

    subscribe(d, () => {});

    let i = 0;
    return () => {
      a.value = i++;
    };
  });

  bench('conditional rendering simulation', () => {
    const showDetails = zen(false);
    const user = zen({ name: 'Alice', age: 30 });

    const display = computed(() =>
      showDetails.value ? `${user.value.name} (${user.value.age})` : user.value.name,
    );

    subscribe(display, () => {});

    let i = 0;
    return () => {
      if (i % 2 === 0) {
        showDetails.value = !showDetails.value;
      } else {
        user.value = { name: `User${i}`, age: 20 + (i % 50) };
      }
      i++;
    };
  });
});
