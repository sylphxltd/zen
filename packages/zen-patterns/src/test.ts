// Quick manual test of all patterns
import { subscribe, zen } from '../../zen/src/index';
import { computedAsync, deepMap, listenKeys, listenPaths, map, store } from './index';
const counter = store(() => {
  const count = zen(0);
  return {
    count,
    increase: () => count.value++,
    decrease: () => count.value--,
  };
});

counter.increase();
const form = map({ name: '', email: '', age: 0 });

let nameChanges = 0;
let emailChanges = 0;

listenKeys(form, ['name'], () => nameChanges++);
listenKeys(form, ['email'], () => emailChanges++);

form.setKey('name', 'John');
form.setKey('email', 'john@example.com');
const config = deepMap({
  ui: {
    theme: 'dark',
    layout: { sidebar: 'left', width: 200 },
  },
});

let themeChanges = 0;
let sidebarChanges = 0;

listenPaths(config, ['ui.theme'], () => themeChanges++);
listenPaths(config, ['ui.layout.sidebar'], () => sidebarChanges++);

config.setPath('ui.theme', 'light');
config.setPath('ui.layout.width', 300); // Should not trigger listeners
const mockApi = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { id: 1, name: 'Test User' };
};

const _user = computedAsync(mockApi);

setTimeout(() => {}, 200);
