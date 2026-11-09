// Pure expense helpers: filtering, grouping, stats and chart maths. No DOM, no i18n.
import { toCents, sumCents } from './money.js';
import { monthKey } from './dates.js';

export function escapeHtml(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

export function filterExpenses(items, { search = '', category = '', labelOf = (c) => c } = {}) {
  const needle = search.toLowerCase();
  return items.filter((item) => {
    const matchesSearch =
      item.category.toLowerCase().includes(needle) ||
      labelOf(item.category).toLowerCase().includes(needle) ||
      (item.notes && item.notes.toLowerCase().includes(needle)) ||
      item.date.includes(needle);
    return matchesSearch && (category === '' || item.category === category);
  });
}

export function groupByDay(items) {
  const days = new Map();
  for (const item of items) {
    if (!days.has(item.date)) days.set(item.date, []);
    days.get(item.date).push(item);
  }
  return [...days].map(([date, dayItems]) => ({ date, items: dayItems, subtotalCents: sumCents(dayItems) }));
}

export function computeStats(items, todayISO) {
  const month = monthKey(todayISO);
  let todayCents = 0;
  let monthCents = 0;
  let allCents = 0;
  for (const item of items) {
    const cents = toCents(item.amount);
    allCents += cents;
    if (item.date === todayISO) todayCents += cents;
    if (item.date && monthKey(item.date) === month) monthCents += cents;
  }
  return { todayCents, monthCents, allCents };
}

export function categoryBreakdown(items, categoryValues) {
  const sums = new Map(categoryValues.map((v) => [v, 0]));
  let totalCents = 0;
  for (const item of items) {
    const cents = toCents(item.amount);
    const key = sums.has(item.category) ? item.category : 'Other';
    sums.set(key, (sums.get(key) || 0) + cents);
    totalCents += cents;
  }
  const rows = categoryValues
    .filter((v) => sums.get(v) > 0)
    .map((value) => ({ value, cents: sums.get(value), pct: (sums.get(value) / totalCents) * 100 }));
  return { totalCents, rows };
}
