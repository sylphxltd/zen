# API Reference

Complete reference for Rapid's core APIs.

## signal()

Create a reactive signal.

```typescript
function signal<T>(initialValue: T): Signal<T>
```

**Parameters:**
- `initialValue`: The initial value of the signal

**Returns:** A signal object with a `.value` property

**Example:**
```typescript
const count = signal(0);
const name = signal('John');
const user = signal({ id: 1, name: 'Jane' });
```

## computed()

Create a computed value that derives from other signals.

```typescript
function computed<T>(fn: () => T): Computed<T>
```

**Parameters:**
- `fn`: A function that computes the value

**Returns:** A computed signal (read-only)

**Example:**
```typescript
const firstName = signal('John');
const lastName = signal('Doe');

const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);
```

## effect()

Run a side effect when signals change.

```typescript
function effect(fn: () => void | (() => void)): () => void
```

**Parameters:**
- `fn`: The effect function. Can return a cleanup function.

**Returns:** A dispose function to stop the effect

**Example:**
```typescript
const count = signal(0);

const dispose = effect(() => {
  document.title = `Count: ${count.value}`;

  return () => {
    document.title = 'App';
  };
});

// Later: stop the effect
dispose();
```

## render()

Render a component to the DOM.

```typescript
function render(
  componentFn: () => Element,
  container: HTMLElement
): void
```

**Parameters:**
- `componentFn`: Function that returns the root element
- `container`: DOM element to render into

**Example:**
```typescript
import { render } from '@rapid/web';

render(
  () => <App />,
  document.getElementById('root')
);
```

## Control Flow Components

### For

Efficiently render lists.

```typescript
<For each={items}>
  {(item, index) => <div>{item}</div>}
</For>
```

### Show

Conditionally render content.

```typescript
<Show when={isVisible}>
  <div>Visible content</div>
</Show>

<Show when={user} fallback={<div>Loading...</div>}>
  <div>Hello {user.name}</div>
</Show>
```

### Switch / Match

Pattern matching for rendering.

```typescript
<Switch>
  <Match when={status === 'loading'}>
    <Spinner />
  </Match>
  <Match when={status === 'error'}>
    <Error />
  </Match>
  <Match when={status === 'success'}>
    <Content />
  </Match>
</Switch>
```
