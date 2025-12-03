/**
 * TUI Showcase Component
 *
 * Demonstrates @rapid/tui capabilities with a simulated terminal interface.
 * Shows real TUI component examples rendered as styled HTML to mimic terminal output.
 */

import { computed, signal } from '@rapid/signal';
import { For, Show } from '@rapid/web';
import { Icon } from './Icon.tsx';

export function TUIShowcase() {
  const activeDemo = signal<'input' | 'select' | 'progress' | 'layout'>('input');

  // Simulated TUI state for demos
  const inputValue = signal('');
  const selectedOption = signal(0);
  const progressValue = signal(45);
  const checkboxes = signal([
    { label: 'TypeScript', checked: true },
    { label: 'React', checked: false },
    { label: 'Tailwind', checked: true },
  ]);

  const demos = [
    { id: 'input' as const, name: 'Text Input', icon: 'lucide:text-cursor' },
    { id: 'select' as const, name: 'Select & Checkbox', icon: 'lucide:list' },
    { id: 'progress' as const, name: 'Progress & Spinner', icon: 'lucide:loader' },
    { id: 'layout' as const, name: 'Layout & Boxes', icon: 'lucide:layout' },
  ];

  const selectOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

  return (
    <section class="py-20 px-0 bg-[#0d1117]">
      <div class="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 font-medium mb-6">
            <Icon icon="lucide:terminal" width="20" height="20" />
            <span>@rapid/tui</span>
          </div>
          <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">
            Beautiful <span class="text-green-400">Terminal UIs</span>
          </h2>
          <p class="text-xl text-gray-400 max-w-3xl mx-auto">
            Build interactive CLI applications with the same reactive model.
            <br />
            Like Ink, but with fine-grained reactivity for optimal performance.
          </p>
        </div>

        {/* Demo Tabs */}
        <div class="flex flex-wrap gap-3 justify-center mb-8">
          <For each={demos}>
            {(demo) => (
              <button
                type="button"
                class={
                  activeDemo.value === demo.id
                    ? 'px-5 py-2.5 bg-green-500 text-black rounded font-medium transition-all flex items-center gap-2'
                    : 'px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded font-medium transition-all flex items-center gap-2'
                }
                onClick={() => {
                  activeDemo.value = demo.id;
                }}
              >
                <Icon icon={demo.icon} width="18" height="18" />
                {demo.name}
              </button>
            )}
          </For>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Terminal Preview */}
          <div class="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            {/* Terminal Header */}
            <div class="bg-[#21262d] border-b border-gray-800 px-4 py-3 flex items-center gap-2">
              <div class="flex gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500" />
                <div class="w-3 h-3 rounded-full bg-yellow-500" />
                <div class="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span class="text-gray-400 text-sm ml-2 font-mono">rapid-tui-demo</span>
            </div>

            {/* Terminal Content */}
            <div class="p-6 font-mono text-sm min-h-[400px]">
              {/* Input Demo */}
              <Show when={computed(() => activeDemo.value === 'input')}>
                <div class="space-y-4">
                  <div class="text-cyan-400 font-bold">┌ Welcome to Rapid TUI</div>
                  <div class="text-gray-400">│</div>
                  <div class="text-white">│ Enter your name:</div>
                  <div class="flex items-center text-white">
                    <span class="text-gray-500">│ </span>
                    <span class="text-green-400">❯ </span>
                    <input
                      type="text"
                      value={inputValue.value}
                      onInput={(e) => {
                        inputValue.value = (e.target as HTMLInputElement).value;
                      }}
                      class="bg-transparent border-none outline-none text-white flex-1"
                      placeholder="Type here..."
                    />
                    <span class="bg-green-400 text-black px-0.5 animate-pulse">▋</span>
                  </div>
                  <div class="text-gray-400">│</div>
                  <Show when={computed(() => inputValue.value.length > 0)}>
                    <div class="text-green-400">│ Hello, {inputValue}! 👋</div>
                  </Show>
                  <div class="text-cyan-400">└───────────────────────</div>
                </div>
              </Show>

              {/* Select Demo */}
              <Show when={computed(() => activeDemo.value === 'select')}>
                <div class="space-y-1">
                  <div class="text-cyan-400 font-bold mb-3">
                    Select an option (↑/↓ to navigate):
                  </div>
                  <For each={selectOptions}>
                    {(option, index) => (
                      <div
                        class={`cursor-pointer ${
                          index() === selectedOption.value
                            ? 'text-black bg-cyan-400 px-2 -mx-2'
                            : 'text-gray-300'
                        }`}
                        onClick={() => {
                          selectedOption.value = index();
                        }}
                      >
                        {index() === selectedOption.value ? '❯ ' : '  '}
                        {option}
                      </div>
                    )}
                  </For>

                  <div class="mt-6 text-yellow-400 font-bold">Checkboxes (Space to toggle):</div>
                  <div class="mt-2 space-y-1">
                    <For each={checkboxes.value}>
                      {(item, index) => (
                        <div
                          class="cursor-pointer text-gray-300 hover:text-white"
                          onClick={() => {
                            const updated = [...checkboxes.value];
                            updated[index()] = { ...item, checked: !item.checked };
                            checkboxes.value = updated;
                          }}
                        >
                          <span class={item.checked ? 'text-green-400' : 'text-gray-500'}>
                            {item.checked ? '☑' : '☐'}
                          </span>{' '}
                          {item.label}
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              {/* Progress Demo */}
              <Show when={computed(() => activeDemo.value === 'progress')}>
                <div class="space-y-6">
                  <div>
                    <div class="text-cyan-400 font-bold mb-2">Progress Bar:</div>
                    <div class="flex items-center gap-3">
                      <div class="flex-1 bg-gray-800 h-4 rounded overflow-hidden">
                        <div
                          class="h-full bg-gradient-to-r from-green-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${progressValue.value}%` }}
                        />
                      </div>
                      <span class="text-white w-12 text-right">{progressValue}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progressValue.value}
                      onInput={(e) => {
                        progressValue.value = Number((e.target as HTMLInputElement).value);
                      }}
                      class="w-full mt-2 accent-green-500"
                    />
                  </div>

                  <div>
                    <div class="text-yellow-400 font-bold mb-2">Spinners:</div>
                    <div class="flex items-center gap-6">
                      <div class="flex items-center gap-2">
                        <span class="text-cyan-400 animate-spin inline-block">⠋</span>
                        <span class="text-gray-300">Loading...</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-green-400 animate-pulse">●</span>
                        <span class="text-gray-300">Processing</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-yellow-400 animate-bounce">▶</span>
                        <span class="text-gray-300">Running</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="text-magenta-400 font-bold mb-2 text-purple-400">
                      Status Messages:
                    </div>
                    <div class="space-y-1">
                      <div class="text-green-400">✔ Build successful</div>
                      <div class="text-yellow-400">⚠ 3 warnings</div>
                      <div class="text-cyan-400">ℹ Running tests...</div>
                    </div>
                  </div>
                </div>
              </Show>

              {/* Layout Demo */}
              <Show when={computed(() => activeDemo.value === 'layout')}>
                <div class="space-y-4">
                  <div class="text-cyan-400 font-bold">Flexbox Layout with Yoga:</div>

                  {/* Bordered Box */}
                  <div class="border border-gray-600 rounded p-3">
                    <div class="text-white mb-2">┌─ Dashboard ──────────────────┐</div>
                    <div class="flex gap-4">
                      <div class="flex-1 border border-green-500/50 p-2 text-center">
                        <div class="text-green-400 text-lg font-bold">1,234</div>
                        <div class="text-gray-400 text-xs">Users</div>
                      </div>
                      <div class="flex-1 border border-cyan-500/50 p-2 text-center">
                        <div class="text-cyan-400 text-lg font-bold">5,678</div>
                        <div class="text-gray-400 text-xs">Events</div>
                      </div>
                      <div class="flex-1 border border-yellow-500/50 p-2 text-center">
                        <div class="text-yellow-400 text-lg font-bold">99.9%</div>
                        <div class="text-gray-400 text-xs">Uptime</div>
                      </div>
                    </div>
                    <div class="text-white mt-2">└──────────────────────────────┘</div>
                  </div>

                  {/* Nested Boxes */}
                  <div class="border border-purple-500/50 p-3">
                    <div class="text-purple-400 mb-2">Nested Flexbox:</div>
                    <div class="flex gap-2">
                      <div class="bg-red-500/20 border border-red-500/50 p-2 flex-1 text-center text-red-400">
                        A
                      </div>
                      <div class="flex flex-col gap-2 flex-1">
                        <div class="bg-green-500/20 border border-green-500/50 p-2 text-center text-green-400">
                          B
                        </div>
                        <div class="bg-blue-500/20 border border-blue-500/50 p-2 text-center text-blue-400">
                          C
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </div>

          {/* Code Example */}
          <div class="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
            <div class="bg-[#21262d] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
              <span class="text-gray-400 text-sm font-mono">
                {() => `${activeDemo.value}-demo.tsx`}
              </span>
              <span class="text-xs text-gray-500">@rapid/tui</span>
            </div>

            <div class="p-6 overflow-x-auto">
              <Show when={computed(() => activeDemo.value === 'input')}>
                <pre class="text-sm font-mono text-gray-300">{`import { signal } from '@rapid/signal'
import { render, Box, Text, TextInput } from '@rapid/tui'

function App() {
  const name = signal('')

  return (
    <Box borderStyle="round" borderColor="cyan" padding={1}>
      <Text bold color="cyan">Welcome to Rapid TUI</Text>

      <Box marginY={1}>
        <Text>Enter your name:</Text>
        <TextInput
          value={name}
          onChange={v => name.value = v}
          placeholder="Type here..."
        />
      </Box>

      <Show when={() => name.value.length > 0}>
        <Text color="green">
          Hello, {() => name.value}! 👋
        </Text>
      </Show>
    </Box>
  )
}

render(<App />)`}</pre>
              </Show>

              <Show when={computed(() => activeDemo.value === 'select')}>
                <pre class="text-sm font-mono text-gray-300">{`import { signal } from '@rapid/signal'
import { render, Box, Text, SelectInput, Checkbox } from '@rapid/tui'

function App() {
  const selected = signal(0)
  const features = signal([
    { label: 'TypeScript', checked: true },
    { label: 'React', checked: false },
    { label: 'Tailwind', checked: true },
  ])

  return (
    <Box flexDirection="column" gap={2}>
      <Text bold color="cyan">
        Select an option:
      </Text>

      <SelectInput
        options={[
          { label: 'Option 1', value: 0 },
          { label: 'Option 2', value: 1 },
          { label: 'Option 3', value: 2 },
        ]}
        value={selected}
        onChange={v => selected.value = v}
      />

      <Text bold color="yellow">Checkboxes:</Text>
      <For each={features.value}>
        {(item, i) => (
          <Checkbox
            label={item.label}
            checked={item.checked}
            onChange={checked => {
              features.value[i()].checked = checked
            }}
          />
        )}
      </For>
    </Box>
  )
}`}</pre>
              </Show>

              <Show when={computed(() => activeDemo.value === 'progress')}>
                <pre class="text-sm font-mono text-gray-300">{`import { signal, effect } from '@rapid/signal'
import { render, Box, Text, ProgressBar, Spinner } from '@rapid/tui'

function App() {
  const progress = signal(0)

  // Simulate progress
  effect(() => {
    const interval = setInterval(() => {
      if (progress.value < 100) {
        progress.value += 1
      }
    }, 50)
    return () => clearInterval(interval)
  })

  return (
    <Box flexDirection="column" gap={2}>
      <Text bold color="cyan">Progress Bar:</Text>
      <ProgressBar
        value={progress}
        width={40}
        color="green"
      />

      <Text bold color="yellow">Spinners:</Text>
      <Box gap={4}>
        <Spinner type="dots" label="Loading..." />
        <Spinner type="pulse" label="Processing" />
        <Spinner type="arrow" label="Running" />
      </Box>

      <Text bold color="magenta">Status:</Text>
      <StatusMessage type="success">Build successful</StatusMessage>
      <StatusMessage type="warning">3 warnings</StatusMessage>
      <StatusMessage type="info">Running tests...</StatusMessage>
    </Box>
  )
}`}</pre>
              </Show>

              <Show when={computed(() => activeDemo.value === 'layout')}>
                <pre class="text-sm font-mono text-gray-300">{`import { render, Box, Text } from '@rapid/tui'

function Dashboard() {
  return (
    <Box
      borderStyle="round"
      borderColor="gray"
      padding={1}
      flexDirection="column"
    >
      <Text bold>Dashboard</Text>

      {/* Flex row with equal columns */}
      <Box flexDirection="row" gap={2} marginY={1}>
        <Box flex={1} borderStyle="single" borderColor="green" padding={1}>
          <Text color="green" bold>1,234</Text>
          <Text dim>Users</Text>
        </Box>

        <Box flex={1} borderStyle="single" borderColor="cyan" padding={1}>
          <Text color="cyan" bold>5,678</Text>
          <Text dim>Events</Text>
        </Box>

        <Box flex={1} borderStyle="single" borderColor="yellow" padding={1}>
          <Text color="yellow" bold>99.9%</Text>
          <Text dim>Uptime</Text>
        </Box>
      </Box>

      {/* Nested flex layout */}
      <Box flexDirection="row" gap={1}>
        <Box flex={1} backgroundColor="red" padding={1}>A</Box>
        <Box flex={1} flexDirection="column" gap={1}>
          <Box backgroundColor="green" padding={1}>B</Box>
          <Box backgroundColor="blue" padding={1}>C</Box>
        </Box>
      </Box>
    </Box>
  )
}

render(<Dashboard />)`}</pre>
              </Show>
            </div>
          </div>
        </div>

        {/* TUI Components Grid */}
        <div class="mt-16">
          <h3 class="text-2xl font-bold text-white text-center mb-8">Complete Component Library</h3>

          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Box', icon: 'lucide:square', desc: 'Flexbox container' },
              { name: 'Text', icon: 'lucide:type', desc: 'Styled text' },
              { name: 'TextInput', icon: 'lucide:text-cursor', desc: 'Text input field' },
              { name: 'SelectInput', icon: 'lucide:list', desc: 'Dropdown select' },
              { name: 'Checkbox', icon: 'lucide:check-square', desc: 'Toggle checkbox' },
              { name: 'Radio', icon: 'lucide:circle-dot', desc: 'Radio buttons' },
              { name: 'Button', icon: 'lucide:mouse-pointer-click', desc: 'Clickable button' },
              { name: 'Spinner', icon: 'lucide:loader', desc: 'Loading indicator' },
              { name: 'ProgressBar', icon: 'lucide:bar-chart', desc: 'Progress display' },
              { name: 'Tabs', icon: 'lucide:folder', desc: 'Tab navigation' },
              { name: 'ScrollBox', icon: 'lucide:scroll', desc: 'Scrollable area' },
              { name: 'Toast', icon: 'lucide:bell', desc: 'Notifications' },
            ].map((comp) => (
              <div
                key={comp.name}
                class="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center hover:border-green-500/50 transition-colors"
              >
                <Icon icon={comp.icon} width="24" height="24" class="text-green-400 mx-auto mb-2" />
                <div class="text-white font-medium text-sm">{comp.name}</div>
                <div class="text-gray-500 text-xs mt-1">{comp.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div class="mt-16 text-center">
          <div class="inline-flex flex-wrap gap-4 justify-center">
            <a
              href="/docs/tui"
              class="px-8 py-4 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <Icon icon="lucide:book-open" width="20" height="20" />
              TUI Documentation
            </a>
            <a
              href="https://github.com/SylphxAI/rapid/tree/main/packages/rapid-tui"
              class="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-700 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Icon icon="lucide:github" width="20" height="20" />
              View Source
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
