// Pure date helpers. Dates are local calendar days as YYYY-MM-DD.

// Local calendar date, `daysAgo` days back. (valueAsDate would use UTC and
// flip to tomorrow in the evening for users west of Greenwich.)
export function localISO(daysAgo = 0, now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthKey(iso) {
  return iso.slice(0, 7);
}

// First day (Monday) of the calendar week containing the given local day.
export function weekStart(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  return localISO((day.getDay() + 6) % 7, day);
}
