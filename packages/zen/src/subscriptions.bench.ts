import { set, subscribe, zen } from '@sylphx/zen';
import { bench, describe } from 'vitest';

// Benchmark to test the notifyListeners optimization
// Testing impact of removing array spread in notification loop

describe('Multiple Subscriptions - Notification Performance', () => {
  // Baseline: 1 subscriber
  bench('1 subscriber, 100 updates', () => {
    const atom = zen(0);
    subscribe(atom, () => {});

    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });

  // Test with 5 subscribers
  bench('5 subscribers, 100 updates', () => {
    const atom = zen(0);
    for (let i = 0; i < 5; i++) {
      subscribe(atom, () => {});
    }

    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });

  // Test with 10 subscribers (matches benchmark report)
  bench('10 subscribers, 100 updates', () => {
    const atom = zen(0);
    for (let i = 0; i < 10; i++) {
      subscribe(atom, () => {});
    }

    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });

  // Test with 20 subscribers (stress test)
  bench('20 subscribers, 100 updates', () => {
    const atom = zen(0);
    for (let i = 0; i < 20; i++) {
      subscribe(atom, () => {});
    }

    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });

  // Test with 50 subscribers (extreme case)
  bench('50 subscribers, 100 updates', () => {
    const atom = zen(0);
    for (let i = 0; i < 50; i++) {
      subscribe(atom, () => {});
    }

    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });
});

describe('Multiple Subscriptions - Single Update', () => {
  // Focus on single update cost with many subscribers

  bench('10 subscribers, single update', () => {
    const atom = zen(0);
    for (let i = 0; i < 10; i++) {
      subscribe(atom, () => {});
    }
    set(atom, 1);
  });

  bench('20 subscribers, single update', () => {
    const atom = zen(0);
    for (let i = 0; i < 20; i++) {
      subscribe(atom, () => {});
    }
    set(atom, 1);
  });

  bench('50 subscribers, single update', () => {
    const atom = zen(0);
    for (let i = 0; i < 50; i++) {
      subscribe(atom, () => {});
    }
    set(atom, 1);
  });
});
