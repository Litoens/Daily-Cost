// Pure income helpers. No DOM, no i18n. Income rows mirror expense rows but keep `source` instead of `category`.
import { sumCents } from './money.js';
import { computeStats, periodItems } from './expenses.js';

// The two fixed income sources (stored values never change; labels come from i18n `src.*`).
export const SOURCE_VALUES = ['Salary', 'Extra'];

// Current calendar month: what came in, what went out, and what is left (may be negative).
export function monthSummary(costs, income, todayISO) {
  const spentCents = computeStats(costs, todayISO).monthCents;
  const earnedCents = sumCents(periodItems(income, 'month', todayISO));
  return { earnedCents, spentCents, leftCents: earnedCents - spentCents };
}
