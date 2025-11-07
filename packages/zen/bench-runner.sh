#!/bin/bash
echo "================================================"
echo "Karma Performance Benchmark (Multiple Runs)"
echo "================================================"
echo ""

RUNS=5

for i in $(seq 1 $RUNS); do
  echo "==== Run $i/$RUNS ===="
  bun test --run packages/zen/src/karma.bench.ts
  echo ""
done

echo "================================================"
echo "Benchmark completed: $RUNS runs"
echo "================================================"
