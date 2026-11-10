import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, filterExpenses, groupByDay, computeStats, categoryBreakdown, periodItems, toCsv } from '../js/expenses.js';

const VALUES = ['Meat', 'Food & Dining', 'Transport', 'Utilities', 'Entertainment', 'Other'];
const rows = [
  { id: 'a', date: '2026-11-09', category: 'Transport', amount: '12.50', notes: 'Bus pass' },
  { id: 'b', date: '2026-11-09', category: 'Meat', amount: '20.00', notes: null },
  { id: 'c', date: '2026-11-08', category: 'Food & Dining', amount: '0.10', notes: 'coffee' },
  { id: 'd', date: '2026-10-31', category: 'Weird', amount: '0.20', notes: '' }
];
const ids = (list) => list.map((r) => r.id);
const es = (c) => ({ Transport: 'Transporte', Meat: 'Carnes y supermercado' }[c] || c);

test('filterExpenses', () => {
  assert.deepEqual(ids(filterExpenses(rows, {})), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids(filterExpenses(rows, { search: 'BUS' })), ['a']);
  assert.deepEqual(ids(filterExpenses(rows, { search: 'transporte', labelOf: es })), ['a']);
  assert.deepEqual(ids(filterExpenses(rows, { search: 'transport', labelOf: es })), ['a']);
  assert.deepEqual(ids(filterExpenses(rows, { search: '2026-10' })), ['d']);
  assert.deepEqual(ids(filterExpenses(rows, { category: 'Meat' })), ['b']);
  assert.deepEqual(ids(filterExpenses(rows, { search: 'coffee', category: 'Meat' })), []);
});
test('filterExpenses amount and date bounds', () => {
  assert.deepEqual(ids(filterExpenses(rows, { minCents: 1250 })), ['a', 'b']);       // inclusive
  assert.deepEqual(ids(filterExpenses(rows, { maxCents: 1250 })), ['a', 'c', 'd']);  // inclusive
  assert.deepEqual(ids(filterExpenses(rows, { minCents: 100, maxCents: 1500 })), ['a']);
  assert.deepEqual(ids(filterExpenses(rows, { minCents: 0 })), ['a', 'b', 'c', 'd']); // 0 is a real bound
  assert.deepEqual(ids(filterExpenses(rows, { from: '2026-11-09' })), ['a', 'b']);
  assert.deepEqual(ids(filterExpenses(rows, { to: '2026-11-08' })), ['c', 'd']);
  assert.deepEqual(ids(filterExpenses(rows, { from: '2026-11-01', to: '2026-11-08' })), ['c']);
  assert.deepEqual(ids(filterExpenses(rows, { search: 'bus', minCents: 1000, from: '2026-11-01' })), ['a']);
  assert.deepEqual(ids(filterExpenses(rows, { minCents: 5000, maxCents: 100 })), []);  // inverted range
});
test('groupByDay', () => {
  const days = groupByDay(rows);
  assert.deepEqual(days.map((d) => d.date), ['2026-11-09', '2026-11-08', '2026-10-31']);
  assert.equal(days[0].subtotalCents, 3250);
  assert.deepEqual(ids(days[0].items), ['a', 'b']);
});
test('computeStats', () => {
  assert.deepEqual(computeStats(rows, '2026-11-09'), { todayCents: 3250, monthCents: 3260, allCents: 3280 });
  assert.deepEqual(computeStats([], '2026-11-09'), { todayCents: 0, monthCents: 0, allCents: 0 });
});
test('categoryBreakdown', () => {
  const b = categoryBreakdown(rows, VALUES);
  assert.equal(b.totalCents, 3280);
  assert.deepEqual(b.rows.map((r) => r.value), ['Meat', 'Food & Dining', 'Transport', 'Other']);
  assert.equal(b.rows.at(-1).cents, 20);
  assert.ok(Math.abs(b.rows.reduce((s, r) => s + r.pct, 0) - 100) < 1e-9);
  assert.deepEqual(categoryBreakdown([], VALUES), { totalCents: 0, rows: [] });
});
test('escapeHtml', () => {
  assert.equal(escapeHtml(`<img src=x onerror="a('b')">&`), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
});

test('periodItems', () => {
  assert.deepEqual(ids(periodItems(rows, 'month', '2026-11-09')), ['a', 'b', 'c']);
  assert.deepEqual(ids(periodItems(rows, 'all', '2026-11-09')), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids(periodItems(rows, 'month', '2026-12-01')), []);
  assert.deepEqual(ids(periodItems(rows, 'today', '2026-11-09')), ['a', 'b']);
  assert.deepEqual(ids(periodItems(rows, 'today', '2026-11-10')), []);
  // 2026-11-09 is a Monday: its week runs Mon 9 to Sun 15, so Sunday 8 belongs to the previous week.
  assert.deepEqual(ids(periodItems(rows, 'week', '2026-11-09')), ['a', 'b']);
  assert.deepEqual(ids(periodItems(rows, 'week', '2026-11-15')), ['a', 'b']);
  assert.deepEqual(ids(periodItems(rows, 'week', '2026-11-08')), ['c']);
  assert.deepEqual(ids(periodItems(rows, 'week', '2026-11-16')), []);
});

test('toCsv', () => {
  const csv = toCsv([
    { date: '2026-11-09', category: 'Food & Dining', amount: '12.5', notes: 'a "b", c' },
    { date: '2026-11-08', category: 'Other', amount: 3, notes: '=SUM(A1)' },
    { date: '2026-11-07', category: 'Meat', amount: '1.00', notes: null },
    { date: '2026-11-06', category: 'Meat', amount: '2.00', notes: 'two\nlines' }
  ]);
  assert.equal(csv,
    '\uFEFFdate,category,amount,notes\r\n' +
    '2026-11-09,Food & Dining,12.50,"a ""b"", c"\r\n' +
    "2026-11-08,Other,3.00,'=SUM(A1)\r\n" +
    '2026-11-07,Meat,1.00,\r\n' +
    '2026-11-06,Meat,2.00,"two\nlines"\r\n');
  assert.equal(toCsv([]), '\uFEFFdate,category,amount,notes\r\n');
});
