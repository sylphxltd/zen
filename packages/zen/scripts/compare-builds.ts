#!/usr/bin/env bun
/**
 * Compare Standard vs Optimized Build
 *
 * Compares bundle size and performance between:
 * - Standard build (dist/index.js)
 * - Optimized build (dist/optimized/zen-optimized.js)
 */

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

interface BuildStats {
  name: string;
  path: string;
  raw: number;
  minified: number;
  gzipped: number;
  brotli?: number;
}

function getFileSize(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

function getGzipSize(path: string): number {
  try {
    const content = readFileSync(path);
    return gzipSync(content, { level: 9 }).length;
  } catch {
    return 0;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

function formatDiff(original: number, optimized: number): string {
  const diff = ((optimized - original) / original) * 100;
  const sign = diff > 0 ? '+' : '';
  const color = diff < 0 ? '\x1b[32m' : diff > 0 ? '\x1b[31m' : '\x1b[33m';
  const reset = '\x1b[0m';
  return `${color}${sign}${diff.toFixed(1)}%${reset}`;
}

async function analyzeBuild(name: string, path: string): Promise<BuildStats> {
  const raw = getFileSize(path);
  const gzipped = getGzipSize(path);

  return {
    name,
    path,
    raw,
    minified: raw, // bunup already minifies
    gzipped,
  };
}

async function main() {
  console.log('🔬 Comparing Standard vs Optimized Build\n');

  const distDir = join(import.meta.dir, '../dist');

  // Analyze builds
  const standard = await analyzeBuild('Standard', join(distDir, 'index.js'));
  const optimized = await analyzeBuild('Optimized', join(distDir, 'optimized/zen-optimized.js'));

  // Print results
  console.log('📦 Bundle Sizes:\n');
  console.log('┌─────────────┬──────────────┬──────────────┬────────────┐');
  console.log('│ Build       │ Raw          │ Minified     │ Gzipped    │');
  console.log('├─────────────┼──────────────┼──────────────┼────────────┤');
  console.log(
    `│ Standard    │ ${formatBytes(standard.raw).padEnd(12)} │ ${formatBytes(standard.minified).padEnd(12)} │ ${formatBytes(standard.gzipped).padEnd(10)} │`,
  );
  console.log(
    `│ Optimized   │ ${formatBytes(optimized.raw).padEnd(12)} │ ${formatBytes(optimized.minified).padEnd(12)} │ ${formatBytes(optimized.gzipped).padEnd(10)} │`,
  );
  console.log('└─────────────┴──────────────┴──────────────┴────────────┘\n');

  // Calculate savings
  console.log('💰 Size Reduction:\n');
  console.log(`Raw:      ${formatDiff(standard.raw, optimized.raw)}`);
  console.log(`Minified: ${formatDiff(standard.minified, optimized.minified)}`);
  console.log(`Gzipped:  ${formatDiff(standard.gzipped, optimized.gzipped)}`);
  console.log();

  // Absolute savings
  const rawSaved = standard.raw - optimized.raw;
  const gzipSaved = standard.gzipped - optimized.gzipped;
  console.log(`Saved: ${formatBytes(rawSaved)} raw, ${formatBytes(gzipSaved)} gzipped\n`);

  // Print what's included/excluded
  console.log('📋 Build Contents:\n');
  console.log('Standard Build includes:');
  console.log('  ✅ zen, computed, computedAsync, select, map, deepMap');
  console.log('  ✅ batch, subscribe, get, set');
  console.log('  ✅ effect, batched, batchedUpdate');
  console.log('  ✅ onSet, onNotify, onStart, onStop, onMount');
  console.log('  ✅ untracked, tracked, isTracking');
  console.log('  ✅ mapCreator, listenKeys, listenPaths');
  console.log();
  console.log('Optimized Build includes:');
  console.log('  ✅ zen, computed, computedAsync, select, map');
  console.log('  ✅ batch, subscribe, setKey');
  console.log('  ❌ get/set (use .value property)');
  console.log('  ❌ deepMap (use map + nested structure)');
  console.log('  ❌ effect (use subscribe)');
  console.log('  ❌ batched/batchedUpdate (use batch)');
  console.log('  ❌ lifecycle hooks (manual cleanup)');
  console.log('  ❌ untracked utilities (explicit deps)');
  console.log('  ❌ mapCreator, listenKeys, listenPaths');
  console.log();

  // Recommendations
  if (gzipSaved > 0) {
    const percentage = ((gzipSaved / standard.gzipped) * 100).toFixed(1);
    console.log(`✨ Recommendation: Use optimized build for ${percentage}% smaller bundle size!`);
  } else {
    console.log('⚠️  Warning: Optimized build is not smaller. Check tree-shaking configuration.');
  }
}

main().catch(console.error);
