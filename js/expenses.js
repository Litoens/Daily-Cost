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

// 'month' keeps rows in the same calendar month as todayISO; 'all' keeps everything.
export function periodItems(items, period, todayISO) {
  if (period !== 'month') return items;
  const month = monthKey(todayISO);
  return items.filter((item) => item.date && monthKey(item.date) === month);
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

// Supabase returns at most 1000 rows per request: walk the ranges until a short page.
// getPage(from, to) resolves to { data, error }. Any error discards partial data.
export async function fetchAllPages(getPage, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await getPage(from, from + pageSize - 1);
    if (error) return { data: null, error };
    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) return { data: rows, error: null };
  }
}

function csvField(value) {
  const text = String(value);
  return /["\r\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// CSV of the given expenses, with a UTF-8 BOM so spreadsheets read accents correctly.
// Notes starting with = + - @ get a leading ' so a spreadsheet never runs them as a formula.
export function toCsv(items) {
  const lines = ['date,category,amount,notes'];
  for (const item of items) {
    const notes = item.notes == null ? '' : String(item.notes);
    const safeNotes = /^[=+\-@]/.test(notes) ? `'${notes}` : notes;
    lines.push([
      csvField(item.date),
      csvField(item.category),
      (toCents(item.amount) / 100).toFixed(2),
      csvField(safeNotes)
    ].join(','));
  }
  return '\uFEFF' + lines.map((line) => line + '\r\n').join('');
}
