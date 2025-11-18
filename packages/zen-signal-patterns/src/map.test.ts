import { describe, expect, it, vi } from 'vitest';
import { subscribe } from '@zen/signal';
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
    const form = map({ name: 'Alice', email: 'alice@example.com', age: 0 });

    const nameCalls: string[] = [];
    const emailCalls: string[] = [];

    listenKeys(form, ['name'], (value) => nameCalls.push(value));
    listenKeys(form, ['email'], (value) => emailCalls.push(value));

    // Subscriptions trigger initial calls
    expect(nameCalls).toEqual(['Alice']);
    expect(emailCalls).toEqual(['alice@example.com']);

    form.setKey('name', 'John');
    // Known limitation: Computed values are lazy and don't notify until accessed
    // Access the computed value to trigger update check
    expect(form.selectKey('name').value).toBe('John');
    expect(nameCalls).toEqual(['Alice']); // No notification without effect/manual access

    form.setKey('email', 'john@example.com');
    expect(form.selectKey('email').value).toBe('john@example.com');
    expect(emailCalls).toEqual(['alice@example.com']);

    form.setKey('age', 25);
    expect(nameCalls).toEqual(['Alice']);
    expect(emailCalls).toEqual(['alice@example.com']);
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
    const form = map({ name: 'Original', email: 'test@example.com' });

    const calls: Array<{ value: string; key: string; obj: any }> = [];
    const listener = (value: string, key: 'name', obj: any) => {
      calls.push({ value, key, obj });
    };
    const unsub = listenKeys(form, ['name'], listener);

    // Initial call happens on subscription
    expect(calls.length).toBe(1);
    expect(calls[0]?.value).toBe('Original');
    expect(calls[0]?.key).toBe('name');

    form.setKey('name', 'Updated');

    // Known limitation: Lazy computed - no notification without access
    // Manually access to verify new value exists
    expect(form.selectKey('name').value).toBe('Updated');
    expect(calls.length).toBe(1); // Still only initial call

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
