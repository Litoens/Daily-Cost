import test from 'node:test';
import assert from 'node:assert/strict';
import { monthSummary } from '../js/income.js';
import { filterExpenses, toCsv } from '../js/expenses.js';
import { formatSignedMoney } from '../js/money.js';

const costs = [
  { id: 'c1', date: '2026-11-09', category: 'Meat', amount: '20.00' },
  { id: 'c2', date: '2026-11-01', category: 'Transport', amount: '42.40' },
  { id: 'c3', date: '2026-10-31', category: 'Other', amount: '500.00' }
];
const income = [
  { id: 'i1', date: '2026-11-01', source: 'Salary', amount: '1200.00', notes: 'November pay' },
  { id: 'i2', date: '2026-11-10', source: 'Extra', amount: '0.10', notes: null },
  { id: 'i3', date: '2026-10-01', source: 'Salary', amount: '1100.00', notes: '' }
];

test('monthSummary counts only the current month', () => {
  assert.deepEqual(monthSummary(costs, income, '2026-11-13'), { earnedCents: 120010, spentCents: 6240, leftCents: 113770 });
  assert.deepEqual(monthSummary(costs, [], '2026-11-13'), { earnedCents: 0, spentCents: 6240, leftCents: -6240 });
  assert.deepEqual(monthSummary([], [], '2026-11-13'), { earnedCents: 0, spentCents: 0, leftCents: 0 });
  assert.deepEqual(monthSummary(costs, income, '2026-10-15'), { earnedCents: 110000, spentCents: 50000, leftCents: 60000 });
});

test('formatSignedMoney', () => {
  assert.equal(formatSignedMoney(113760), '+$1,137.60');
  assert.equal(formatSignedMoney(-8420), '-$84.20');
  assert.equal(formatSignedMoney(0), '$0.00');
});

test('filterExpenses on income rows via keyOf', () => {
  const keyOf = (r) => r.source;
  const labelOf = (v) => ({ Salary: 'Sueldo', Extra: 'Ingreso extra' }[v]);
  const ids = (l) => l.map((r) => r.id);
  assert.deepEqual(ids(filterExpenses(income, { keyOf })), ['i1', 'i2', 'i3']);
  assert.deepEqual(ids(filterExpenses(income, { keyOf, category: 'Salary' })), ['i1', 'i3']);
  assert.deepEqual(ids(filterExpenses(income, { keyOf, labelOf, search: 'sueldo' })), ['i1', 'i3']);
  assert.deepEqual(ids(filterExpenses(income, { keyOf, search: 'pay', minCents: 100000 })), ['i1']);
});

test('toCsv with the source column', () => {
  assert.equal(toCsv([income[0], { ...income[1], notes: '+bonus' }], 'source'),
    '﻿date,source,amount,notes\r\n' +
    '2026-11-01,Salary,1200.00,November pay\r\n' +
    "2026-11-10,Extra,0.10,'+bonus\r\n");
});
