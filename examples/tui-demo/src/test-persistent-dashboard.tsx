#!/usr/bin/env bun
/** @jsxImportSource @zen/tui */
/**
 * Persistent Renderer - Comprehensive Dashboard Demo
 *
 * Demonstrates the persistent renderer with multiple components:
 * - Natural children syntax (no wrapping in functions)
 * - Multiple reactive signals
 * - Complex layouts with borders and styling
 * - Keyboard interactions
 */

import { signal, computed } from '@zen/signal';
import { Box, Text, renderToTerminalPersistent } from '@zen/tui';

// Application state
const counter = signal(0);
const todos = signal(['Build TUI framework', 'Add reactivity', 'Create demos']);
const selectedTab = signal(0);
const toggleState = signal(false);

// Computed values
const counterColor = computed(() => {
  if (counter.value < 5) return 'green';
  if (counter.value < 10) return 'yellow';
  return 'red';
});

const statusMessage = computed(() => {
  if (toggleState.value) return '✓ Enabled';
  return '✗ Disabled';
});

const tabs = ['Dashboard', 'Tasks', 'Settings'];

function Header() {
  return Box({
    borderStyle: 'double',
    borderColor: 'cyan',
    style: {
      flexDirection: 'column' as const,
      padding: 1,
      marginBottom: 1,
    },
    children: [
      Text({
        children: '⚡ Persistent Renderer Dashboard',
        bold: true,
        color: 'cyan',
      }),
      Box({
        style: {
          flexDirection: 'row' as const,
          marginTop: 1,
        },
        children: [
          Text({
            children: () => `Counter: ${counter.value}`,
            color: counterColor,
          }),
          Text({
            children: ' | ',
            dim: true,
          }),
          Text({
            children: () => `Status: ${statusMessage.value}`,
            color: () => (toggleState.value ? 'green' : 'red'),
          }),
          Text({
            children: ' | ',
            dim: true,
          }),
          Text({
            children: () => `Tasks: ${todos.value.length}`,
            color: 'magenta',
          }),
        ],
      }),
    ],
  });
}

function TabBar() {
  return Box({
    style: {
      flexDirection: 'row' as const,
      marginBottom: 1,
    },
    children: tabs.map((tab, index) =>
      Box({
        borderStyle: () => (selectedTab.value === index ? 'round' : 'single'),
        borderColor: () => (selectedTab.value === index ? 'yellow' : 'white'),
        style: {
          padding: 0.5,
          marginRight: 1,
        },
        children: [
          Text({
            children: tab,
            bold: () => selectedTab.value === index,
            color: () => (selectedTab.value === index ? 'yellow' : 'white'),
          }),
        ],
      }),
    ),
  });
}

function DashboardTab() {
  return Box({
    borderStyle: 'single',
    borderColor: 'white',
    style: {
      flexDirection: 'column' as const,
      padding: 1,
    },
    children: [
      Text({
        children: 'Welcome to the Dashboard',
        bold: true,
        color: 'white',
      }),
      Text({
        children: () =>
          `Current counter value: ${counter.value} (${counter.value % 2 === 0 ? 'even' : 'odd'})`,
        color: counterColor,
        style: { marginTop: 1 },
      }),
      Box({
        style: {
          flexDirection: 'row' as const,
          marginTop: 1,
        },
        children: [
          Box({
            borderStyle: 'round',
            borderColor: 'green',
            style: { padding: 1, marginRight: 1 },
            children: [
              Text({
                children: () => `✓\n${counter.value}`,
                color: 'green',
                bold: true,
              }),
            ],
          }),
          Box({
            borderStyle: 'round',
            borderColor: () => (toggleState.value ? 'green' : 'red'),
            style: { padding: 1 },
            children: [
              Text({
                children: () => (toggleState.value ? '■\nON' : '□\nOFF'),
                color: () => (toggleState.value ? 'green' : 'red'),
                bold: true,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function TasksTab() {
  return Box({
    borderStyle: 'single',
    borderColor: 'magenta',
    style: {
      flexDirection: 'column' as const,
      padding: 1,
    },
    children: [
      Text({
        children: 'Task List',
        bold: true,
        color: 'magenta',
      }),
      ...todos.value.map((todo, index) =>
        Text({
          children: `${index + 1}. ${todo}`,
          color: 'white',
          style: { marginTop: 0.5 },
        }),
      ),
      Text({
        children: () => `Total tasks: ${todos.value.length}`,
        dim: true,
        style: { marginTop: 1 },
      }),
    ],
  });
}

function SettingsTab() {
  return Box({
    borderStyle: 'single',
    borderColor: 'blue',
    style: {
      flexDirection: 'column' as const,
      padding: 1,
    },
    children: [
      Text({
        children: 'Settings',
        bold: true,
        color: 'blue',
      }),
      Text({
        children: () => `Auto-increment: ${toggleState.value ? 'Yes' : 'No'}`,
        style: { marginTop: 1 },
      }),
      Text({
        children: () => `Counter threshold: ${counter.value >= 10 ? 'Exceeded' : 'OK'}`,
        color: () => (counter.value >= 10 ? 'red' : 'green'),
        style: { marginTop: 0.5 },
      }),
    ],
  });
}

function App() {
  return Box({
    style: {
      flexDirection: 'column' as const,
      padding: 1,
    },
    children: [
      Header(),
      TabBar(),
      () => {
        // Reactive tab content - switches based on selectedTab
        if (selectedTab.value === 0) return DashboardTab();
        if (selectedTab.value === 1) return TasksTab();
        return SettingsTab();
      },
      Box({
        style: {
          marginTop: 1,
        },
        children: [
          Text({
            children: 'Controls: [Space] +1  [t] Toggle  [1/2/3] Tabs  [a] Add Task  [Ctrl+C] Exit',
            dim: true,
            color: 'cyan',
          }),
        ],
      }),
    ],
  });
}

// Auto-increment when toggle is on
setInterval(() => {
  if (toggleState.value) {
    counter.value++;
  }
}, 1000);

// Auto-exit after 5 seconds for testing
setTimeout(() => {
  process.exit(0);
}, 5000);

await renderToTerminalPersistent(() => App(), {
  fps: 10,
  onKeyPress: (key) => {
    if (key === ' ') {
      counter.value++;
    } else if (key === 't' || key === 'T') {
      toggleState.value = !toggleState.value;
    } else if (key === '1') {
      selectedTab.value = 0;
    } else if (key === '2') {
      selectedTab.value = 1;
    } else if (key === '3') {
      selectedTab.value = 2;
    } else if (key === 'a' || key === 'A') {
      todos.value = [...todos.value, `New task ${todos.value.length + 1}`];
    }
  },
});
