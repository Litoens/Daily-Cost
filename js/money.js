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

// Explicit sign for a balance: +$1,137.60 / -$84.20; zero has no sign.
export function formatSignedMoney(cents) {
  if (cents === 0) return formatMoney(0);
  return (cents > 0 ? '+' : '-') + formatMoney(Math.abs(cents));
}
