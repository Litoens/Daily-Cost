import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllPages } from '../js/expenses.js';

const source = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));
const pager = (all, calls, failAt = -1) => async (from, to) => {
  calls.push([from, to]);
  if (calls.length === failAt) return { data: null, error: { message: 'boom' } };
  return { data: all.slice(from, to + 1), error: null };
};

test('loads 2500 rows in three pages', async () => {
  const calls = [];
  const { data, error } = await fetchAllPages(pager(source(2500), calls));
  assert.equal(error, null);
  assert.equal(data.length, 2500);
  assert.deepEqual(calls, [[0, 999], [1000, 1999], [2000, 2999]]);
});
test('exactly one full page asks once more', async () => {
  const calls = [];
  const { data } = await fetchAllPages(pager(source(1000), calls));
  assert.equal(data.length, 1000);
  assert.equal(calls.length, 2);
});
test('empty table', async () => {
  const { data } = await fetchAllPages(pager([], []));
  assert.deepEqual(data, []);
});
test('error on a later page returns no partial data', async () => {
  const { data, error } = await fetchAllPages(pager(source(2500), [], 2));
  assert.equal(data, null);
  assert.equal(error.message, 'boom');
});
