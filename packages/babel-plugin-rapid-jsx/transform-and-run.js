#!/usr/bin/env bun
/**
 * Transform a TSX file with Babel and run it
 * Usage: bun transform-and-run.js input.tsx
 */

import { transformSync } from '@babel/core';
import zenJsxPlugin from './dist/index.js';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

const inputFile = process.argv[2];

if (!inputFile) {
  console.error('Usage: bun transform-and-run.js input.tsx');
  process.exit(1);
}

const inputPath = resolve(inputFile);
const text = await Bun.file(inputPath).text();

// First pass: TypeScript + JSX transform
const tsResult = transformSync(text, {
  filename: inputPath,
  presets: [
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
      jsxPragma: 'jsx',
      jsxPragmaFrag: 'Fragment',
    }]
  ],
  plugins: [
    ['@babel/plugin-transform-react-jsx', {
      runtime: 'automatic',
      importSource: '@rapid/tui',
    }]
  ],
});

if (!tsResult || !tsResult.code) {
  console.error('TypeScript transform failed');
  process.exit(1);
}

// Second pass: Apply rapid-jsx plugin for lazy children
const result = transformSync(tsResult.code, {
  filename: inputPath,
  plugins: [zenJsxPlugin],
});

if (!result || !result.code) {
  console.error('Transform failed');
  process.exit(1);
}

// Write to temp file
const tempFile = inputPath.replace(/\.tsx$/, '.transformed.js');
writeFileSync(tempFile, result.code);

console.log(`Transformed ${inputFile} -> ${tempFile}`);
console.log('Running transformed file...\n');

// Run the transformed file
await import(tempFile);
