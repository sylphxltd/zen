import { describe, expect, it } from 'vitest';
import { zen } from '@zen/signal';
import { store } from './store';

describe('store', () => {
  it('should create a store from factory function', () => {
    const counter = store(() => {
      const count = zen(0);
      return {
        count,
        increase: () => count.value++,
      };
    });

    expect(counter.count.value).toBe(0);
    counter.increase();
    expect(counter.count.value).toBe(1);
  });

  it('should support multiple reactive values', () => {
    const myStore = store(() => {
      const name = zen('Alice');
      const age = zen(25);
      return { name, age };
    });

    expect(myStore.name.value).toBe('Alice');
    expect(myStore.age.value).toBe(25);

    myStore.name.value = 'Bob';
    myStore.age.value = 30;

    expect(myStore.name.value).toBe('Bob');
    expect(myStore.age.value).toBe(30);
  });

  it('should support methods in store', () => {
    const todoStore = store(() => {
      const todos = zen<string[]>([]);
      return {
        todos,
        add: (todo: string) => {
          todos.value = [...todos.value, todo];
        },
        clear: () => {
          todos.value = [];
        },
      };
    });

    todoStore.add('Task 1');
    todoStore.add('Task 2');
    expect(todoStore.todos.value).toEqual(['Task 1', 'Task 2']);

    todoStore.clear();
    expect(todoStore.todos.value).toEqual([]);
  });
});
