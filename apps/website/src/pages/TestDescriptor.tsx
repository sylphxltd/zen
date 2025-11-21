/**
 * Test Page: Descriptor Pattern for Context Propagation
 *
 * Verifies that the descriptor pattern correctly executes components
 * in parent-first order, fixing Context propagation.
 */

import { createContext, onMount, useContext } from '@zen/runtime';
import { signal } from '@zen/signal';

// Create test context
const TestContext = createContext<string>('default');

let executionOrder: string[] = [];

// Child component that accesses context
function TestChild() {
  executionOrder.push('Child-execute');
  const value = useContext(TestContext);
  executionOrder.push(`Child-got-value:${value}`);

  return (
    <div class="test-result">
      <strong>Child received:</strong> {value}
    </div>
  );
}

// Parent component that provides context
function TestParent() {
  executionOrder.push('Parent-execute');

  return (
    <div class="test-case">
      <h3>Test: Context Provider</h3>
      <p>Parent component</p>
      <TestContext.Provider value="from-parent">
        <TestChild />
      </TestContext.Provider>
    </div>
  );
}

export function TestDescriptor() {
  const testResults = signal<string[]>([]);
  const testStatus = signal<'running' | 'passed' | 'failed'>('running');

  onMount(() => {
    // Reset test state
    executionOrder = [];

    // Small delay to ensure components have rendered
    setTimeout(() => {
      const results: string[] = [];

      // Verify correct execution order
      const parentIndex = executionOrder.indexOf('Parent-execute');
      const childIndex = executionOrder.indexOf('Child-execute');

      results.push(`Execution order: ${executionOrder.join(' → ')}`);

      if (parentIndex === -1 || childIndex === -1) {
        results.push('❌ FAILED: Components did not execute');
        testStatus.value = 'failed';
        testResults.value = results;
        return;
      }

      if (parentIndex >= childIndex) {
        results.push('❌ FAILED: Child executed before Parent!');
        testStatus.value = 'failed';
        testResults.value = results;
        return;
      }

      results.push('✅ Parent executed before Child');

      // Verify child got correct value
      if (!executionOrder.includes('Child-got-value:from-parent')) {
        results.push('❌ FAILED: Child did not get correct context value!');
        testStatus.value = 'failed';
        testResults.value = results;
        return;
      }

      results.push('✅ Child received context value from Parent');
      results.push('✅ PASSED: Descriptor pattern working correctly!');
      testStatus.value = 'passed';
      testResults.value = results;
    }, 100);
  });

  return (
    <div class="container" style={{ paddingTop: '120px' }}>
      <h1>Descriptor Pattern Test (ADR-011)</h1>
      <p>Testing Context propagation with the descriptor pattern.</p>

      <div class="test-section" style={{ marginTop: '32px' }}>
        <TestParent />
      </div>

      <div
        class="test-results"
        style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor:
            testStatus.value === 'passed'
              ? '#d4edda'
              : testStatus.value === 'failed'
                ? '#f8d7da'
                : '#fff3cd',
          border: `1px solid ${
            testStatus.value === 'passed'
              ? '#c3e6cb'
              : testStatus.value === 'failed'
                ? '#f5c6cb'
                : '#ffeeba'
          }`,
          borderRadius: '4px',
        }}
      >
        <h3>
          Test Status:{' '}
          {testStatus.value === 'running'
            ? '⏳ Running...'
            : testStatus.value === 'passed'
              ? '✅ PASSED'
              : '❌ FAILED'}
        </h3>
        <ul style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          {testResults.value.map((result) => (
            <li key={result}>{result}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
