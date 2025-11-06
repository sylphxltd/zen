import { bench, describe } from 'vitest';
import { set, subscribe, zen } from './zen';

describe('Version Tracking Overhead', () => {
  bench('baseline: set with no subscribers (measures pure version overhead)', () => {
    const atom = zen(0);
    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });

  bench('set with 1 subscriber', () => {
    const atom = zen(0);
    subscribe(atom, () => {});
    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });

  bench('set with 10 subscribers', () => {
    const atom = zen(0);
    for (let i = 0; i < 10; i++) {
      subscribe(atom, () => {});
    }
    for (let i = 0; i < 100; i++) {
      set(atom, i);
    }
  });
});

describe('Update Patterns', () => {
  bench('many small updates (1000 updates, 1 subscriber)', () => {
    const atom = zen(0);
    subscribe(atom, () => {});
    for (let i = 0; i < 1000; i++) {
      set(atom, i);
    }
  });

  bench('many small updates (1000 updates, 10 subscribers)', () => {
    const atom = zen(0);
    for (let i = 0; i < 10; i++) {
      subscribe(atom, () => {});
    }
    for (let i = 0; i < 1000; i++) {
      set(atom, i);
    }
  });
});
