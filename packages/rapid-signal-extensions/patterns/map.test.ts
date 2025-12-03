import { describe, expect, it, mock } from 'bun:test';
import { subscribe } from '@rapid/signal';
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

    // Subscribe doesn't call listeners immediately
    expect(nameCalls).toEqual([]);
    expect(emailCalls).toEqual([]);

    form.setKey('name', 'John');
    // Listener should be called after value changes
    expect(form.selectKey('name').value).toBe('John');
    expect(nameCalls).toEqual(['John']);

    form.setKey('email', 'john@example.com');
    expect(form.selectKey('email').value).toBe('john@example.com');
    expect(emailCalls).toEqual(['john@example.com']);

    form.setKey('age', 25);
    // Age changes shouldn't affect name/email listeners
    expect(nameCalls).toEqual(['John']);
    expect(emailCalls).toEqual(['john@example.com']);
  });

  it('should support multiple keys in listener', () => {
    const form = map({ name: '', email: '', age: 0 });

    let changes = 0;
    listenKeys(form, ['name', 'email'], () => changes++);

    // No initial calls
    expect(changes).toBe(0);

    form.setKey('name', 'Alice');
    form.setKey('email', 'alice@example.com');
    form.setKey('age', 30);

    expect(changes).toBe(2); // Only name and email trigger listeners
  });

  it('should pass value, key, and full object to listener', () => {
    const form = map({ name: 'Original', email: 'test@example.com' });

    const calls: Array<{ value: string; key: string; obj: any }> = [];
    const listener = (value: string, key: 'name', obj: any) => {
      calls.push({ value, key, obj });
    };
    const unsub = listenKeys(form, ['name'], listener);

    // Subscribe doesn't call immediately
    expect(calls.length).toBe(0);

    form.setKey('name', 'Updated');

    // Listener called with new value after change
    expect(form.selectKey('name').value).toBe('Updated');
    expect(calls.length).toBe(1);
    expect(calls[0]?.value).toBe('Updated');
    expect(calls[0]?.key).toBe('name');

    unsub();
  });

  it('should support unsubscribe', () => {
    const form = map({ name: '', email: '' });

    let changes = 0;
    const unsubscribe = listenKeys(form, ['name'], () => changes++);

    // No initial call
    expect(changes).toBe(0);

    form.setKey('name', 'Alice');
    expect(changes).toBe(1);

    unsubscribe();

    form.setKey('name', 'Bob');
    expect(changes).toBe(1); // Should not increment after unsubscribe
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
    const unsub = subscribe(nameZ, mock());

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
