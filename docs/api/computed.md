# Computed API

## computed()

Creates a derived value that automatically tracks dependencies and updates when they change.

**Zen v3 features auto-tracking** - dependencies are tracked automatically when you access `.value` inside the computed function.

```typescript
// Auto-tracking (v3) - recommended
function computed<R>(
  computeFn: () => R
): Computed<R>

// Explicit dependencies (optional) - for performance-critical code
function computed<R>(
  computeFn: () => R,
  dependencies?: AnyZen[]
): Computed<R>
```

### Parameters

- `computeFn` - Function that computes the value. Dependencies are tracked when you access `.value` inside this function.
- `dependencies` *(optional)* - Array of Zen stores to explicitly depend on. Use for performance-critical code.

### Returns

A read-only Zen store with the computed value.

### Example

```typescript
import { zen, computed } from '@sylphx/zen';

const firstName = zen('John');
const lastName = zen('Doe');

// Auto-tracks firstName and lastName - no dependency array!
const fullName = computed(() =>
  `${firstName.value} ${lastName.value}`
);

console.log(fullName.value); // "John Doe"

firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"
```

---

## Auto-tracking

Zen v3 automatically tracks which signals you access inside computed functions:

```typescript
const a = zen(1);
const b = zen(2);

// Automatically tracks both a and b
const sum = computed(() => a.value + b.value);

console.log(sum.value); // 3

a.value = 10;
console.log(sum.value); // 12 (automatically recalculated)
```

### Conditional Dependencies

Auto-tracking shines with conditional logic - only subscribes to actively accessed signals:

```typescript
const mode = zen<'light' | 'dark'>('light');
const lightBg = zen('#ffffff');
const darkBg = zen('#000000');

// Only tracks the active branch!
const background = computed(() =>
  mode.value === 'light' ? lightBg.value : darkBg.value
);

// Changing darkBg doesn't trigger updates when mode is 'light'
darkBg.value = '#111111'; // No update!

mode.value = 'dark'; // Now subscribes to darkBg
```

**Performance:** 2.12x faster than explicit dependency lists for conditional logic!

---

## Explicit Dependencies (Optional)

For performance-critical code, you can specify dependencies explicitly:

```typescript
const a = zen(1);
const b = zen(2);

// Explicit deps (slightly faster, but more verbose)
const sum = computed(() => a.value + b.value, [a, b]);
```

**When to use explicit dependencies:**
- Performance-critical hot paths
- Profiler shows computed is a bottleneck
- Dependencies are static and known

**When to use auto-tracking (default):**
- Everything else (recommended for 90% of cases)
- Conditional dependencies
- Dynamic dependencies

---

## Characteristics

### Automatic Updates

Computed values recalculate when dependencies change:

```typescript
const count = zen(0);
const doubled = computed(() => count.value * 2);

console.log(doubled.value); // 0
count.value = 5;
console.log(doubled.value); // 10
```

### Lazy Evaluation

Only evaluates when accessed:

```typescript
const input = zen(10);

const expensive = computed(() => {
  console.log('Computing...');
  return expensiveOperation(input.value);
});

// No log yet
console.log(expensive.value); // Logs "Computing..." then result
console.log(expensive.value); // Cached - no log
```

### Read-only

Cannot be written to directly:

```typescript
const count = zen(0);
const doubled = computed(() => count.value * 2);

doubled.value = 10; // ❌ Error - computed values are read-only
```

### Caching

Results are cached until dependencies change:

```typescript
const count = zen(0);
let callCount = 0;

const doubled = computed(() => {
  callCount++;
  return count.value * 2;
});

doubled.value; // callCount = 1
doubled.value; // callCount = 1 (cached)

count.value = 5;
doubled.value; // callCount = 2 (recalculated)
```

---

## Multiple Dependencies

Auto-tracks all accessed signals:

```typescript
const a = zen(1);
const b = zen(2);
const c = zen(3);

// Automatically tracks a, b, and c
const sum = computed(() =>
  a.value + b.value + c.value
);

console.log(sum.value); // 6
```

---

## Chaining

Chain computed values:

```typescript
const base = zen(10);

const doubled = computed(() => base.value * 2);
const quadrupled = computed(() => doubled.value * 2);

console.log(quadrupled.value); // 40

base.value = 20;
console.log(quadrupled.value); // 80
```

---

## Subscribing

Subscribe to computed values:

```typescript
const count = zen(0);
const doubled = computed(() => count.value * 2);

subscribe(doubled, (newValue, oldValue) => {
  console.log(`Doubled: ${oldValue} → ${newValue}`);
});

count.value = 5; // Logs: "Doubled: 0 → 10"
```

---

## Type Definition

```typescript
interface Computed<T> {
  readonly value: T;
}
```

---

## Common Patterns

### Filtering

```typescript
const items = zen([1, 2, 3, 4, 5]);

const evenItems = computed(() =>
  items.value.filter(x => x % 2 === 0)
);
```

### Mapping

```typescript
const users = zen<User[]>([]);

const userNames = computed(() =>
  users.value.map(u => u.name)
);
```

### Aggregation

```typescript
const numbers = zen([1, 2, 3, 4, 5]);

const sum = computed(() =>
  numbers.value.reduce((acc, n) => acc + n, 0)
);
```

### Conditional Logic

```typescript
const age = zen(20);

const category = computed(() => {
  const a = age.value;
  if (a < 13) return 'child';
  if (a < 20) return 'teen';
  if (a < 65) return 'adult';
  return 'senior';
});
```

---

## Best Practices

### ✅ Access .value at the top

```typescript
// ✅ Good - access .value synchronously
const result = computed(() => {
  const a = signalA.value;
  const b = signalB.value;
  return processData(a, b);
});

// ❌ Bad - nested access might not be tracked
const result = computed(() => {
  return processData(signalA.value, signalB.value);
});
```

### ✅ Keep computations pure

```typescript
// ✅ Good - pure function
const doubled = computed(() => count.value * 2);

// ❌ Bad - side effects
const doubled = computed(() => {
  console.log('Computing'); // Side effect
  return count.value * 2;
});
```

### ✅ Split expensive computations

```typescript
const data = zen(largeDataset);

// ✅ Good - split into steps
const processed = computed(() => process(data.value));
const filtered = computed(() => filter(processed.value));
const sorted = computed(() => sort(filtered.value));

// ❌ Bad - all in one
const result = computed(() => {
  return sort(filter(process(data.value)));
});
```

---

## See Also

- [Core API](/api/core) - Basic stores
- [Computed Values Guide](/guide/computed) - Detailed guide
- [Migration Guide](/guide/migration-v2-to-v3) - Upgrading from v2
- [Performance](/guide/performance) - Optimization tips
