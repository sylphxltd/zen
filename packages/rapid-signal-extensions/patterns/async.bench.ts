import { bench, describe } from 'bun:test';
import { signal } from '@rapid/signal';
import { computedAsync } from './async';

describe('computedAsync primitives', () => {
  bench('create computedAsync', () => {
    computedAsync(async () => ({ data: 'test' }));
  });

  bench('read state', () => {
    const user = computedAsync(async () => ({ name: 'Alice' }));

    return () => {
      user.state.value;
    };
  });

  bench('refetch', async () => {
    const user = computedAsync(async () => ({ name: 'Alice' }));

    return async () => {
      await user.refetch();
    };
  });
});

describe('computedAsync with dependencies', () => {
  bench('create with 1 dep', () => {
    const id = signal(1);
    computedAsync(async () => ({ id: id.value }), [id]);
  });

  bench('create with 3 deps', () => {
    const a = signal(1);
    const b = signal(2);
    const c = signal(3);
    computedAsync(async () => ({ a: a.value, b: b.value, c: c.value }), [a, b, c]);
  });

  bench('dep change triggers refetch', async () => {
    const userId = signal(1);
    const _user = computedAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return { id: userId.value };
    }, [userId]);

    let i = 0;
    return () => {
      userId.value = i++;
    };
  });
});

describe('computedAsync patterns', () => {
  bench('simple async data fetch', async () => {
    return async () => {
      const _user = computedAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return { name: 'Alice', age: 30 };
      });

      await new Promise((resolve) => setTimeout(resolve, 5));
    };
  });

  bench('reactive async with deps', () => {
    const query = signal('');
    const _results = computedAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return query.value ? [`Result for ${query.value}`] : [];
    }, [query]);

    let i = 0;
    return () => {
      query.value = `search${i++}`;
    };
  });

  bench('abort on refetch', async () => {
    const user = computedAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { name: 'Alice' };
    });

    return async () => {
      const _p1 = user.refetch();
      const p2 = user.refetch(); // Should abort p1
      await p2;
    };
  });

  bench('manual abort', () => {
    const user = computedAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { name: 'Alice' };
    });

    return () => {
      user.abort();
    };
  });
});

describe('computedAsync error handling', () => {
  bench('successful fetch', async () => {
    return async () => {
      const user = computedAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return { name: 'Alice' };
      });

      await new Promise((resolve) => setTimeout(resolve, 5));
      user.state.value.data;
    };
  });

  bench('failed fetch', async () => {
    return async () => {
      const user = computedAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        throw new Error('Failed');
      });

      await new Promise((resolve) => setTimeout(resolve, 5));
      user.state.value.error;
    };
  });

  bench('non-Error throw', async () => {
    return async () => {
      const user = computedAsync(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        throw 'String error';
      });

      await new Promise((resolve) => setTimeout(resolve, 5));
      user.state.value.error;
    };
  });
});
