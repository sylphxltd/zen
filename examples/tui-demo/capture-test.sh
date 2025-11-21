#!/bin/bash

# Capture raw output with escape sequences visible
OUTPUT_FILE="/tmp/cursor-debug-output.txt"

echo "Running cursor debug test..."
echo "Output will be saved to: $OUTPUT_FILE"
echo ""
echo "Instructions:"
echo "1. Press 's' (first key)"
echo "2. Press 'd' (second key)"
echo "3. Press 'f' (third key)"
echo "4. Press Ctrl+C to exit"
echo ""
echo "Starting in 2 seconds..."
sleep 2

# Run the test and capture output with escape sequences
# Use 'cat -v' to make escape sequences visible
bun src/cursor-debug.tsx 2>&1 | tee "$OUTPUT_FILE"

echo ""
echo "Raw output saved to: $OUTPUT_FILE"
echo "You can view it with: cat -v $OUTPUT_FILE"
