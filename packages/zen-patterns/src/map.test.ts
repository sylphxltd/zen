import { describe, expect, it, vi } from 'vitest';
import { subscribe } from '@sylphx/zen';
import { map, listenKeys, setKey } from './map';

describe('map', () => {
  it('should create a map with initial values', () => {
    const form = map({ name: '', email: '', age: 0 });

    expect(form.value).toEqual({ name: '', email: '', age: 0 });
  });

  it('should update keys immutably', () => {
    const form = map({ name: 'Alice', email: 'alice@example.com' });
    const oldValue = form.value;

    form.setKey('name', 'Bob');

    expect(form.value.name).toBe('Bob');
    expect(form.value).not.toBe(oldValue); // Should be new object
  });

  it('should provide selective key reactivity', () => {
    const form = map({ name: '', email: '', age: 0 });

    const nameListener = vi.fn();
    const emailListener = vi.fn();

    listenKeys(form, ['name'], nameListener);
    listenKeys(form, ['email'], emailListener);

    // Listeners are called immediately on subscription with initial values
    expect(nameListener).toHaveBeenCalledTimes(1);
    expect(emailListener).toHaveBeenCalledTimes(1);

    form.setKey('name', 'John');
    expect(nameListener).toHaveBeenCalledTimes(2);
    expect(emailListener).toHaveBeenCalledTimes(1);

    form.setKey('email', 'john@example.com');
    expect(nameListener).toHaveBeenCalledTimes(2);
    expect(emailListener).toHaveBeenCalledTimes(2);

    form.setKey('age', 25);
    expect(nameListener).toHaveBeenCalledTimes(2);
    expect(emailListener).toHaveBeenCalledTimes(2);
  });

  it('should support multiple keys in listener', () => {
    const form = map({ name: '', email: '', age: 0 });

    let changes = 0;
    listenKeys(form, ['name', 'email'], () => changes++);

    form.setKey('name', 'Alice');
    form.setKey('email', 'alice@example.com');
    form.setKey('age', 30);

    expect(changes).toBe(2); // Only name and email
  });

  it('should pass value, key, and full object to listener', () => {
    const form = map({ name: 'Alice', email: 'alice@example.com' });

    const listener = vi.fn();
    const unsub = listenKeys(form, ['name'], listener);

    // Clear initial call on subscription
    listener.mockClear();

    form.setKey('name', 'Bob');

    expect(listener).toHaveBeenCalledWith('Bob', 'name', expect.objectContaining({ name: 'Bob', email: 'alice@example.com' }));

    unsub();
  });

  it('should support unsubscribe', () => {
    const form = map({ name: '', email: '' });

    let changes = 0;
    const unsubscribe = listenKeys(form, ['name'], () => changes++);

    form.setKey('name', 'Alice');
    expect(changes).toBe(1);

    unsubscribe();

    form.setKey('name', 'Bob');
    expect(changes).toBe(1); // Should not increment
  });

  it('should support setKey helper', () => {
    const form = map({ name: 'Alice' });

    setKey(form, 'name', 'Bob');

    expect(form.value.name).toBe('Bob');
  });

  it('should support selectKey for computed access', () => {
    const form = map({ name: 'Alice', age: 25 });

    const nameZ = form.selectKey('name');

    // Need to subscribe to trigger initial computation
    const unsub = subscribe(nameZ, vi.fn());

    expect(nameZ.value).toBe('Alice');

    form.setKey('name', 'Bob');
    expect(nameZ.value).toBe('Bob');

    unsub();
  });

  it('should cache selectKey computeds', () => {
    const form = map({ name: 'Alice' });

    const nameZ1 = form.selectKey('name');
    const nameZ2 = form.selectKey('name');

    expect(nameZ1).toBe(nameZ2); // Should be same instance
  });
});
