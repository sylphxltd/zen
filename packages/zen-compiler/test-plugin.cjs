/**
 * Test script for zen-compiler plugin
 * Run with: node test-plugin.js
 */

const { transformSync } = require('@babel/core');
const fs = require('fs');
const path = require('path');

// Read the example code
const exampleCode = fs.readFileSync(
  path.join(__dirname, 'src/example.ts'),
  'utf-8'
);

console.log('=== Input Code ===\n');
console.log(exampleCode);
console.log('\n=== Running Compiler Plugin ===\n');

try {
  // Load the compiled plugin
  const zenCompilerPlugin = require('./dist/index.cjs').default;

  // Transform with our plugin
  const result = transformSync(exampleCode, {
    plugins: [
      [
        zenCompilerPlugin,
        {
          staticAnalysis: true,
          warnings: true,
          moduleName: '@sylphx/zen',
        },
      ],
    ],
    filename: 'example.ts',
    presets: ['@babel/preset-typescript'],
  });

  console.log('\n=== Transformation Complete ===\n');

  if (result && result.code) {
    console.log('Output code (first 500 chars):');
    console.log(result.code.substring(0, 500));
    console.log('...\n');
  }
} catch (error) {
  console.error('Error running compiler plugin:');
  console.error(error);
  process.exit(1);
}
