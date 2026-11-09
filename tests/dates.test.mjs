import test from 'node:test';
import assert from 'node:assert/strict';
import { localISO, monthKey } from '../js/dates.js';

test('localISO uses the local calendar day', () => {
  assert.equal(localISO(0, new Date(2026, 10, 9, 23, 30)), '2026-11-09');
  assert.equal(localISO(1, new Date(2026, 0, 1, 0, 5)), '2025-12-31');
  assert.equal(localISO(1, new Date(2026, 2, 1, 12, 0)), '2026-02-28');
});
test('localISO does not mutate its argument', () => {
  const now = new Date(2026, 10, 9, 12, 0);
  localISO(3, now);
  assert.equal(now.getDate(), 9);
});
test('monthKey', () => assert.equal(monthKey('2026-11-09'), '2026-11'));
