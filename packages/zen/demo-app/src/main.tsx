/**
 * ZenJS Demo App - Entry Point
 */

import { render } from 'zenjs';
import App from './App';
import './style.css';

// Render app
const root = document.getElementById('app');
if (root) {
  render(() => <App />, root);
}
