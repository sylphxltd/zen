// Import zen atom factory
import { zen } from '@zen/signal';
import { bench, describe } from 'vitest';
import { craftZen, produce } from './index';

// --- produce Benchmarks ---
// Note: produce() internally uses @zen/craft, these benchmarks measure the overhead
describe('produce: Simple Object Replace', () => {
  const base = { value: 1 };
  bench('zen-craft', () => {
    produce(base, (draft) => {
      draft.value = 2;
    });
  });
});
describe('produce: Nested Object Replace', () => {
  const base = { a: { b: { c: 1 } } };
  bench('zen-craft', () => {
    produce(base, (draft) => {
      draft.a.b.c = 2;
    });
  });
});

describe('produce: Array Push (Small)', () => {
  const base = { items: [1, 2, 3] };
  bench('zen-craft', () => {
    produce(base, (draft) => {
      draft.items.push(4);
    });
  });
});

describe('produce: Array Push (Large)', () => {
  const largeArrayBase = { items: Array.from({ length: 1000 }, (_, i) => i) };
  bench('zen-craft', () => {
    const currentBase = { items: [...largeArrayBase.items] };
    produce(currentBase, (draft) => {
      draft.items.push(1000);
    });
  });
});

describe('produce: Array Splice (Large)', () => {
  const largeArrayBase = { items: Array.from({ length: 1000 }, (_, i) => i) };
  bench('zen-craft', () => {
    const currentBase = { items: [...largeArrayBase.items] };
    produce(currentBase, (draft) => {
      draft.items.splice(500, 1, -1);
    });
  });
});
describe('produce: Map Set (Add/Replace)', () => {
  const createMapBase = () => ({
    data: new Map(Array.from({ length: 100 }, (_, i) => [`key${i}`, i])),
  });
  bench('zen-craft', () => {
    const currentBase = createMapBase();
    produce(currentBase, (draft) => {
      draft.data.set('key50', -1); // Replace
      draft.data.set('newKey', 1000); // Add
    });
  });
});

describe('produce: Map Delete', () => {
  const createMapBase = () => ({
    data: new Map(Array.from({ length: 100 }, (_, i) => [`key${i}`, i])),
  });
  bench('zen-craft', () => {
    const currentBase = createMapBase();
    produce(currentBase, (draft) => {
      draft.data.delete('key50');
    });
  });
});

describe('produce: Map Clear', () => {
  const createMapBase = () => ({
    data: new Map(Array.from({ length: 100 }, (_, i) => [`key${i}`, i])),
  });
  bench('zen-craft', () => {
    const currentBase = createMapBase();
    produce(currentBase, (draft) => {
      draft.data.clear();
    });
  });
});

describe('produce: Set Add', () => {
  const createSetBase = () => ({
    data: new Set(Array.from({ length: 100 }, (_, i) => `item${i}`)),
  });
  bench('zen-craft', () => {
    const currentBase = createSetBase();
    produce(currentBase, (draft) => {
      draft.data.add('newItem');
    });
  });
});

describe('produce: Set Delete', () => {
  const createSetBase = () => ({
    data: new Set(Array.from({ length: 100 }, (_, i) => `item${i}`)),
  });
  bench('zen-craft', () => {
    const currentBase = createSetBase();
    produce(currentBase, (draft) => {
      draft.data.delete('item50');
    });
  });
});

describe('produce: Set Clear', () => {
  const createSetBase = () => ({
    data: new Set(Array.from({ length: 100 }, (_, i) => `item${i}`)),
  });
  bench('zen-craft', () => {
    const currentBase = createSetBase();
    produce(currentBase, (draft) => {
      draft.data.clear();
    });
  });
});
// --- craftZen Benchmarks ---
// These measure the performance of zen-craft integration with zen atoms
describe('craftZen: Simple Object Replace', () => {
  const myZen = zen({ value: 1 });
  bench('zen-craft + zen', () => {
    craftZen(myZen, (draft) => {
      draft.value = draft.value === 1 ? 2 : 1;
    });
  });
});

describe('craftZen: Nested Object Replace', () => {
  const myZen = zen({ a: { b: { c: 1 } } });
  bench('zen-craft + zen', () => {
    craftZen(myZen, (draft) => {
      draft.a.b.c = draft.a.b.c === 1 ? 2 : 1;
    });
  });
});

describe('craftZen: Array Update (Small)', () => {
  const myZen = zen({ items: [1, 2, 3] });
  bench('zen-craft + zen', () => {
    craftZen(myZen, (draft) => {
      draft.items[0] = draft.items[0] + 1;
    });
  });
});

describe('craftZen: Array Update (Large)', () => {
  const myZen = zen({ items: Array.from({ length: 1000 }, (_, i) => i) });
  bench('zen-craft + zen', () => {
    craftZen(myZen, (draft) => {
      draft.items[500] = draft.items[500] + 1;
    });
  });
});
