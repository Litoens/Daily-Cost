// Pure money helpers. Amounts are handled as integer cents to avoid float drift.

export function toCents(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function sumCents(items) {
  return items.reduce((total, item) => total + toCents(item.amount), 0);
}

export function formatMoney(cents) {
  const dollars = (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${dollars}`;
}
