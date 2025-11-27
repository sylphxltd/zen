/** @jsxImportSource @zen/tui */
/**
 * Simple Calculator - Text-based display only
 */

import { Box, Text, signal, useInput } from '@zen/tui';

export function SimpleCalculator() {
  const display = signal('0');
  const operation = signal<string | null>(null);
  const previousValue = signal<number | null>(null);
  const waitingForOperand = signal(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand.value) {
      display.value = digit;
      waitingForOperand.value = false;
    } else {
      display.value = display.value === '0' ? digit : display.value + digit;
    }
  };

  const performOperation = (nextOp: string) => {
    const inputValue = Number.parseFloat(display.value);

    if (previousValue.value === null) {
      previousValue.value = inputValue;
    } else if (operation.value) {
      const result = calculate(previousValue.value, inputValue, operation.value);
      display.value = String(result);
      previousValue.value = result;
    }

    waitingForOperand.value = true;
    operation.value = nextOp;
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  };

  const equals = () => {
    if (operation.value && previousValue.value !== null) {
      const inputValue = Number.parseFloat(display.value);
      const result = calculate(previousValue.value, inputValue, operation.value);
      display.value = String(result);
      previousValue.value = null;
      operation.value = null;
      waitingForOperand.value = true;
    }
  };

  const clear = () => {
    display.value = '0';
    operation.value = null;
    previousValue.value = null;
    waitingForOperand.value = false;
  };

  // Keyboard input
  useInput((input, key) => {
    if (/[0-9]/.test(input)) {
      inputDigit(input);
    } else if (input === '+' || input === '-' || input === '*' || input === '/') {
      performOperation(input);
    } else if (key.return || input === '=') {
      equals();
    } else if (input === 'c' || input === 'C') {
      clear();
    }
  });

  return (
    <Box style={{ flexDirection: 'column', gap: 1, padding: 1 }}>
      {/* Display */}
      <Box
        style={{
          backgroundColor: 'black',
          paddingLeft: 1,
          paddingRight: 1,
          paddingTop: 1,
          paddingBottom: 1,
          justifyContent: 'flex-end',
        }}
      >
        <Text style={{ color: 'green', bold: true }}>{() => display.value}</Text>
      </Box>

      {/* Button Layout */}
      <Box style={{ flexDirection: 'column', gap: 0 }}>
        <Text style={{ color: 'gray' }}>┌────┬────┬────┬────┐</Text>
        <Text style={{ color: 'gray' }}>│ 7 │ 8 │ 9 │ ÷ │</Text>
        <Text style={{ color: 'gray' }}>├────┼────┼────┼────┤</Text>
        <Text style={{ color: 'gray' }}>│ 4 │ 5 │ 6 │ × │</Text>
        <Text style={{ color: 'gray' }}>├────┼────┼────┼────┤</Text>
        <Text style={{ color: 'gray' }}>│ 1 │ 2 │ 3 │ - │</Text>
        <Text style={{ color: 'gray' }}>├────┼────┼────┼────┤</Text>
        <Text style={{ color: 'gray' }}>│ 0 │ . │ = │ + │</Text>
        <Text style={{ color: 'gray' }}>└────┴────┴────┴────┘</Text>
        <Text style={{ color: 'gray' }}>│ C │ Clear │</Text>
        <Text style={{ color: 'gray' }}>└────┴──────────────┘</Text>
      </Box>

      {/* Instructions */}
      <Text style={{ color: 'cyan', dim: true }}>Keyboard: 0-9, +, -, *, /, =, C</Text>

      {/* Status */}
      {() =>
        operation.value && (
          <Text style={{ color: 'yellow', dim: true }}>
            Op: {previousValue.value} {operation.value}
          </Text>
        )
      }
    </Box>
  );
}
