/**
 * Table component for TUI
 *
 * Display tabular data with headers, borders, and formatting.
 * Matches Ink's ink-table behavior.
 */

import { type MaybeReactive, resolve } from '@zen/runtime';
import type { TUINode } from '../core/types.js';
import { Box } from '../primitives/Box.js';
import { Text } from '../primitives/Text.js';

export interface TableColumn<T = any> {
  header: string;
  key: keyof T;
  width?: number; // Fixed width, or auto-size if not provided
  align?: 'left' | 'center' | 'right';
}

type BorderStyleType = 'single' | 'double' | 'round' | 'bold';

export interface TableProps<T = any> {
  /** Table data - supports MaybeReactive */
  data: MaybeReactive<T[]>;
  /** Column definitions - supports MaybeReactive */
  columns: MaybeReactive<TableColumn<T>[]>;
  /** Show borders (default: true) - supports MaybeReactive */
  border?: MaybeReactive<boolean>;
  /** Border style - supports MaybeReactive */
  borderStyle?: MaybeReactive<BorderStyleType>;
  /** Header color - supports MaybeReactive */
  headerColor?: MaybeReactive<string>;
  /** Custom styles */
  style?: any;
}

export function Table<T = any>(props: TableProps<T>): TUINode {
  // Format cell value with alignment
  const formatCell = (
    value: any,
    width: number,
    align: 'left' | 'center' | 'right' = 'left',
  ): string => {
    const str = String(value ?? '');
    const padded = str.padEnd(width, ' ');

    if (align === 'right') {
      return padded.padStart(width, ' ');
    }
    if (align === 'center') {
      const leftPad = Math.floor((width - str.length) / 2);
      const rightPad = width - str.length - leftPad;
      return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
    }

    return padded; // left align
  };

  // Combine header + rows with reactive children
  return Box({
    style: {
      flexDirection: 'column',
      ...props.style,
    },
    children: () => {
      const data = resolve(props.data);
      const columns = resolve(props.columns);
      const border = resolve(props.border) !== false; // default true
      const borderStyle = resolve(props.borderStyle) || 'single';
      const headerColor = resolve(props.headerColor) || 'cyan';

      // Calculate column widths
      const columnWidths: number[] = columns.map((col, _index) => {
        // Use specified width, or auto-calculate
        if (col.width) return col.width;

        // Auto-size: max of header and all data values
        const headerWidth = col.header.length;
        const dataWidths = data.map((row) => {
          const value = row[col.key];
          return String(value ?? '').length;
        });

        return Math.max(headerWidth, ...dataWidths, 3); // Min width 3
      });

      // Header row
      const headerRow = Box({
        style: {
          flexDirection: 'row',
          borderStyle: border ? borderStyle : undefined,
          borderColor: headerColor,
          paddingX: border ? 1 : 0,
        },
        children: columns.map((col, index) =>
          Text({
            key: `header-${index}`,
            children: formatCell(col.header, columnWidths[index], col.align),
            color: headerColor,
            bold: true,
            style: { marginRight: index < columns.length - 1 ? 2 : 0 },
          }),
        ),
      });

      // Data rows
      const dataRows = data.map((row, rowIndex) =>
        Box({
          key: `row-${rowIndex}`,
          style: {
            flexDirection: 'row',
            borderStyle: border ? borderStyle : undefined,
            paddingX: border ? 1 : 0,
          },
          children: columns.map((col, colIndex) => {
            const value = row[col.key];
            return Text({
              key: `cell-${rowIndex}-${colIndex}`,
              children: formatCell(value, columnWidths[colIndex], col.align),
              style: { marginRight: colIndex < columns.length - 1 ? 2 : 0 },
            });
          }),
        }),
      );

      return [headerRow, ...dataRows];
    },
  });
}
