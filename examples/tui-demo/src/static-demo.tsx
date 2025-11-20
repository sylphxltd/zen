/**
 * Demo: Static, Newline, and Spacer Components
 *
 * Showcases:
 * - Static component for efficient non-reactive list rendering
 * - Newline for spacing between sections
 * - Spacer for flexible layout (push content to bottom)
 */

import { Box, Newline, Spacer, Static, Text, renderToTerminalReactive, signal } from '@zen/tui';

// Static log entries (non-reactive)
const logEntries = [
  { time: '10:00:00', level: 'INFO', message: 'Server started on port 3000' },
  { time: '10:00:01', level: 'INFO', message: 'Connected to database' },
  { time: '10:00:02', level: 'SUCCESS', message: 'All services initialized' },
  { time: '10:00:03', level: 'INFO', message: 'Ready to accept connections' },
];

// Recent activity (reactive)
const recentActivity = signal('Idle');
const activeConnections = signal(0);

function App() {
  return (
    <Box style={{ width: 80, borderStyle: 'round', padding: 1 }}>
      {/* Header */}
      <Box style={{ borderStyle: 'single', padding: 1 }}>
        <Text bold color="cyan">
          📝 Server Log Viewer
        </Text>
      </Box>

      <Newline count={1} />

      {/* Static logs section */}
      <Box>
        <Text bold color="yellow">
          Boot Logs:
        </Text>
        <Newline />
        <Static items={logEntries}>
          {(entry) => (
            <Text>
              <Text dim>[{entry.time}]</Text>{' '}
              <Text
                color={entry.level === 'SUCCESS' ? 'green' : 'cyan'}
                bold={entry.level === 'SUCCESS'}
              >
                {entry.level}
              </Text>{' '}
              - {entry.message}
            </Text>
          )}
        </Static>
      </Box>

      <Newline count={2} />

      {/* Spacer pushes footer to bottom */}
      <Spacer />

      {/* Footer with reactive status */}
      <Box style={{ borderStyle: 'single', padding: 1 }}>
        <Text>
          Status: <Text color="green">{recentActivity.value}</Text> | Connections:{' '}
          <Text bold>{activeConnections.value}</Text>
        </Text>
      </Box>
    </Box>
  );
}

// Render
const cleanup = renderToTerminalReactive(App);

// Simulate activity updates
let connectionCount = 0;
const activities = ['Processing request', 'Database query', 'Cache update', 'API call', 'Idle'];
let activityIndex = 0;

const interval = setInterval(() => {
  activityIndex = (activityIndex + 1) % activities.length;
  recentActivity.value = activities[activityIndex];

  // Random connection changes
  connectionCount = Math.max(0, connectionCount + (Math.random() > 0.5 ? 1 : -1));
  activeConnections.value = connectionCount;
}, 1000);

// Cleanup on Ctrl+C
process.on('SIGINT', () => {
  clearInterval(interval);
  cleanup();
  process.exit(0);
});
