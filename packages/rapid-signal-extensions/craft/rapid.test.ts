import { signal as atom, subscribe } from '@rapid/signal';
import { describe, expect, it, mock } from 'bun:test';
import { craftSignal } from './rapid';

// Define interfaces for test states
interface SimpleState {
  a: number;
  b?: { c: number };
}
interface NestedState {
  data: { value: number; items: string[] };
}

describe('craftSignal', () => {
  it('should update atom state immutably based on recipe mutations', () => {
    const baseState: SimpleState = { a: 1, b: { c: 2 } };
    const myAtom = atom(baseState);
    const listener = mock(() => {});
    subscribe(myAtom, listener);

    craftSignal(
      myAtom,
      (draft) => {
        draft.a = 10;
        if (draft.b) {
          draft.b.c = 20;
        }
        return undefined;
      },
    );

    const nextState = myAtom.value;
    expect(nextState).not.toBe(baseState);
    expect(nextState.b).not.toBe(baseState.b);
    expect(nextState).toEqual({ a: 10, b: { c: 20 } });
    // Listener called 1x for state change (subscribe doesn't call immediately)
    expect(listener.mock.calls.length).toBe(1);
    expect(baseState).toEqual({ a: 1, b: { c: 2 } });
  });

  it('should not update atom or call listener if recipe results in no changes', () => {
    const baseState = { a: 1 };
    const myAtom = atom(baseState);
    const listener = mock(() => {});
    subscribe(myAtom, listener);

    craftSignal(
      myAtom,
      (_draft) => {
        return undefined;
      },
    );

    expect(myAtom.value).toBe(baseState);
    // No listener calls since state didn't change (and subscribe doesn't call immediately)
    expect(listener.mock.calls.length).toBe(0);
  });

  it('should update atom with the exact value returned by the recipe', () => {
    const baseState = { a: 1 };
    const myAtom = atom(baseState);
    const listener = mock(() => {});
    subscribe(myAtom, listener);
    const newState = { b: 2 };

    craftSignal(
      myAtom,
      (_draft) => {
        return newState as any;
      },
    );

    expect(myAtom.value).toBe(newState);
    // Listener called 1x for state change
    expect(listener.mock.calls.length).toBe(1);
  });

  it('should handle mutations in nested structures', () => {
    const baseState: NestedState = { data: { value: 1, items: ['a', 'b'] } };
    const myAtom = atom(baseState);
    const listener = mock(() => {});
    subscribe(myAtom, listener);

    craftSignal(
      myAtom,
      (draft) => {
        draft.data.value = 100;
        draft.data.items.push('c');
        return undefined;
      },
    );

    const nextState = myAtom.value;
    expect(nextState).not.toBe(baseState);
    expect(nextState.data).not.toBe(baseState.data);
    expect(nextState.data.items).not.toBe(baseState.data.items);
    expect(nextState.data.value).toBe(100);
    expect(nextState.data.items).toEqual(['a', 'b', 'c']);
    // Listener called 1x for state change
    expect(listener.mock.calls.length).toBe(1);
  });

  it('should pass options correctly to the underlying produce function', () => {
    const baseState = { a: 1 };
    const myAtom = atom(baseState);

    const [patches, inversePatches] = craftSignal(
      myAtom,
      (draft) => {
        draft.a = 2;
        return undefined;
      },
      { patches: true, inversePatches: true },
    );

    expect(myAtom.value).toEqual({ a: 2 });
    expect(Array.isArray(patches)).toBe(true);
    expect(Array.isArray(inversePatches)).toBe(true);
  });
});
