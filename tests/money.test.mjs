import test from 'node:test';
import assert from 'node:assert/strict';
import { toCents, sumCents, formatMoney } from '../js/money.js';

test('toCents', () => {
  assert.equal(toCents('20.10'), 2010);
  assert.equal(toCents(19.999), 2000);
  assert.equal(toCents('abc'), 0);
  assert.equal(toCents(null), 0);
});
test('sumCents is exact', () => {
  assert.equal(sumCents([{ amount: '0.10' }, { amount: 0.2 }]), 30);
  assert.equal(sumCents([]), 0);
});
test('formatMoney', () => {
  assert.equal(formatMoney(0), '$0.00');
  assert.equal(formatMoney(5), '$0.05');
  assert.equal(formatMoney(123456), '$1,234.56');
});
