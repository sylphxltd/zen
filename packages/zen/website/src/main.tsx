/**
 * ZenJS Website Entry Point
 */

import { render } from '../../src/index.js';
import { App } from './App.js';

// Render app
const root = document.getElementById('root');
if (root) {
  render(() => App(), root);
} else {
}
