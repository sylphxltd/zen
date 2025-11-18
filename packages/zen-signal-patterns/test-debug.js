import { map } from './src/map.js';
import { subscribe } from '@zen/signal';

const form = map({ name: '', email: '' });

let calls = 0;
const nameZ = form.selectKey('name');

// Subscribe to computed
subscribe(nameZ, (value) => {
  console.log('Name changed:', value, 'call#', ++calls);
});

console.log('Setting name to John...');
form.setKey('name', 'John');

console.log('Final calls:', calls);
