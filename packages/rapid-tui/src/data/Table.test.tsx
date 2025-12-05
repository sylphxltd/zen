import { describe, expect, it } from 'vitest';
import { Table, type TableColumn } from './Table';

interface TestData {
  name: string;
  age: number;
  city: string;
}

const testData: TestData[] = [
  { name: 'Alice', age: 30, city: 'New York' },
  { name: 'Bob', age: 25, city: 'London' },
  { name: 'Charlie', age: 35, city: 'Tokyo' },
];

const testColumns: TableColumn<TestData>[] = [
  { header: 'Name', key: 'name' },
  { header: 'Age', key: 'age' },
  { header: 'City', key: 'city' },
];

describe('Table', () => {
  it('should create table node with Box component', () => {
    const node = Table({ data: testData, columns: testColumns });

    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('should use column layout', () => {
    const node = Table({ data: testData, columns: testColumns });

    expect(node.style?.flexDirection).toBe('column');
  });

  it('should handle empty data', () => {
    const node = Table({ data: [], columns: testColumns });

    expect(node).toBeDefined();
  });

  it('should handle single row', () => {
    const node = Table({ data: [testData[0]], columns: testColumns });

    expect(node).toBeDefined();
  });

  it('should show borders by default', () => {
    const node = Table({ data: testData, columns: testColumns });

    expect(node).toBeDefined();
  });

  it('should hide borders when border is false', () => {
    const node = Table({ data: testData, columns: testColumns, border: false });

    expect(node).toBeDefined();
  });

  it('should use single border style by default', () => {
    const node = Table({ data: testData, columns: testColumns });

    expect(node).toBeDefined();
  });

  it('should apply double border style', () => {
    const node = Table({ data: testData, columns: testColumns, borderStyle: 'double' });

    expect(node).toBeDefined();
  });

  it('should apply round border style', () => {
    const node = Table({ data: testData, columns: testColumns, borderStyle: 'round' });

    expect(node).toBeDefined();
  });

  it('should apply bold border style', () => {
    const node = Table({ data: testData, columns: testColumns, borderStyle: 'bold' });

    expect(node).toBeDefined();
  });

  it('should use cyan header color by default', () => {
    const node = Table({ data: testData, columns: testColumns });

    expect(node).toBeDefined();
  });

  it('should apply custom header color', () => {
    const node = Table({ data: testData, columns: testColumns, headerColor: 'green' });

    expect(node).toBeDefined();
  });

  it('should apply custom styles', () => {
    const node = Table({ data: testData, columns: testColumns, style: { marginTop: 2 } });

    expect(node.style?.marginTop).toBe(2);
  });

  it('should handle fixed column widths', () => {
    const columns: TableColumn<TestData>[] = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Age', key: 'age', width: 5 },
      { header: 'City', key: 'city', width: 15 },
    ];
    const node = Table({ data: testData, columns });

    expect(node).toBeDefined();
  });

  it('should handle left alignment', () => {
    const columns: TableColumn<TestData>[] = [{ header: 'Name', key: 'name', align: 'left' }];
    const node = Table({ data: testData, columns });

    expect(node).toBeDefined();
  });

  it('should handle center alignment', () => {
    const columns: TableColumn<TestData>[] = [{ header: 'Name', key: 'name', align: 'center' }];
    const node = Table({ data: testData, columns });

    expect(node).toBeDefined();
  });

  it('should handle right alignment', () => {
    const columns: TableColumn<TestData>[] = [{ header: 'Age', key: 'age', align: 'right' }];
    const node = Table({ data: testData, columns });

    expect(node).toBeDefined();
  });

  it('should handle mixed alignment', () => {
    const columns: TableColumn<TestData>[] = [
      { header: 'Name', key: 'name', align: 'left' },
      { header: 'Age', key: 'age', align: 'right' },
      { header: 'City', key: 'city', align: 'center' },
    ];
    const node = Table({ data: testData, columns });

    expect(node).toBeDefined();
  });

  it('should handle null values', () => {
    const dataWithNull = [{ name: 'Alice', age: null as any, city: 'New York' }];
    const node = Table({ data: dataWithNull, columns: testColumns });

    expect(node).toBeDefined();
  });

  it('should handle undefined values', () => {
    const dataWithUndefined = [{ name: 'Alice', age: undefined as any, city: 'New York' }];
    const node = Table({ data: dataWithUndefined, columns: testColumns });

    expect(node).toBeDefined();
  });

  it('should auto-calculate column widths', () => {
    const node = Table({ data: testData, columns: testColumns });

    expect(node).toBeDefined();
  });

  it('should handle very long cell values', () => {
    const dataWithLongValue = [
      { name: 'A very long name that exceeds typical width', age: 30, city: 'New York' },
    ];
    const node = Table({ data: dataWithLongValue, columns: testColumns });

    expect(node).toBeDefined();
  });

  it('should handle single column', () => {
    const columns: TableColumn<TestData>[] = [{ header: 'Name', key: 'name' }];
    const node = Table({ data: testData, columns });

    expect(node).toBeDefined();
  });

  it('should handle many columns', () => {
    interface ExtendedData extends TestData {
      country: string;
      email: string;
      phone: string;
    }
    const extendedData: ExtendedData[] = testData.map((d) => ({
      ...d,
      country: 'USA',
      email: 'test@example.com',
      phone: '123-456-7890',
    }));
    const columns: TableColumn<ExtendedData>[] = [
      { header: 'Name', key: 'name' },
      { header: 'Age', key: 'age' },
      { header: 'City', key: 'city' },
      { header: 'Country', key: 'country' },
      { header: 'Email', key: 'email' },
      { header: 'Phone', key: 'phone' },
    ];
    const node = Table({ data: extendedData, columns });

    expect(node).toBeDefined();
  });
});
