# Daily Cost Tracker: Hardening and Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the correctness, security and accessibility defects found in the November 2026 audit, make the logic testable, and add the four features the product is missing (edit an expense, a Today figure, a per-month chart, CSV export).

**Architecture:** The app stays a static, no-build ES-module site. Pure logic (money, dates, filtering, grouping, validation, CSV, pagination) moves out of `js/app.js` into small flat modules in `js/` that have no DOM or Supabase imports, so they can be unit-tested with Node's built-in test runner. `js/app.js` keeps all DOM and Supabase code and calls those modules.

**Tech Stack:** HTML, CSS, vanilla JS ES modules, Supabase JS v2 from jsDelivr, GitHub Pages, GitHub Actions, `node:test` (Node 22 in CI). No npm dependencies, no `package.json`.

**Spec:** There is no separate spec. The "Audit findings" section below is the spec; each finding has an id (F1...) that tasks refer to. Read `PRODUCT.md` and `DESIGN.md` before starting any task.

## Global Constraints

- No build step, no bundler, no `package.json`, no new runtime dependency. Tests use only `node:test` and `node:assert/strict`.
- New JS modules live flat in `js/` (not in subfolders): CI syntax-checks `js/*.js` only.
- Pure modules (`money.js`, `dates.js`, `expenses.js`, `validate.js`) must not import `i18n.js`, `supabaseClient.js`, or touch `document`/`window`.
- Stored category values never change: `Meat`, `Food & Dining`, `Transport`, `Utilities`, `Entertainment`, `Other`.
- Existing element ids in `index.html` are kept. New ids are listed per task.
- Every user-visible string goes through `js/i18n.js` with a key in **both** `en` and `es`. `tests/check.mjs` fails otherwise.
- Amounts are shown in dollars with a leading `$`, in both languages.
- Design rules from `DESIGN.md` hold: chartreuse (`--accent`) only on the one primary action of a view; category hues only mark categories; 4px corners; no shadows on rows or buttons; 3px focus outline on every interactive element; 44px minimum tap size under `@media (pointer: coarse)`.
- Line numbers in this plan refer to commit `076c6aa`. They drift as tasks land: locate code by function or selector name.
- Commits: one per task, imperative sentence, no type prefix (match `git log`, e.g. "Add show/hide toggle to password fields"). **No `Co-Authored-By` or "Generated with" lines.** Do not push, merge or open a PR unless the user asks.
- Work on a new branch `hardening-and-features` created from `ux-improvements`.
- Never run SQL against the Supabase project and never change its dashboard settings. Tasks that need that say "USER ACTION".
- Commands for every task before committing:
  - `for f in js/*.js tests/*.mjs; do node --check "$f"; done` (expect no output)
  - `node tests/check.mjs` (expect two `OK:` lines)
  - `node --test tests/*.test.mjs` (expect `fail 0`; available from Task 1 on)
- Each task has a "Manual check" list. These need a browser and a signed-in account. If you cannot run them, say so in your report: write "manual checks not run", never "verified".

## Audit findings (the spec)

Bugs:
- **F1 Totals go wrong after 1,000 expenses.** `fetchCosts` does one `select('*')`; Supabase returns at most 1,000 rows per request, so older rows silently drop out of totals and the chart.
- **F2 Double submit creates duplicate expenses.** No form disables its button while its request is in flight.
- **F3 Escape steals focus.** The global `keydown` handler (`app.js:392`) moves focus to the profile button on every Escape, even when the menu is closed.
- **F4 Spanish search does not find categories.** Search matches the stored English value (`Transport`), not the label on screen (`Transporte`).
- **F5 Money is summed as floats.** `0.1 + 0.2` drift; sums must be integer cents.
- **F6 Stale fetch can repaint after sign-out.** A slow `fetchCosts` that resolves after sign-out refills `costsCache`. Also every auth event (token refresh, tab focus) refetches everything, and the first load fetches twice.
- **F7 Delete uses a global and `alert`.** `window.deleteCost` plus inline `onclick`; failure shows a browser alert instead of the toast.

Security:
- **F8 Password rule rejects symbols.** 4 to 16 characters, letters and digits only, and the same check blocks sign-in. New rule (decided by the user): still 4 to 16 characters with at least one letter and one digit, but symbols and any other characters are now allowed. Checked on sign-up and password change only.
- **F9 Unpinned third-party script, no CSP.** `@supabase/supabase-js@2` floats; a bad release runs with the user's session.
- **F10 `update` RLS policy has no `with check`.** A user can reassign a row's `user_id`. No length limit on `notes`; zero amounts allowed.
- **F11 Developer text shown to users.** `auth.linkError` tells users to fix the Supabase Site URL. Supabase errors are English only.

Accessibility and mobile:
- **F12** Message boxes are not live regions; auth tabs expose no state; the profile menu claims `role="menu"` with no arrow keys; Delete buttons have no row-specific name; the Undo toast vanishes while focused; the sign-in password field has no `autocomplete`.
- **F13** On phones the history list is a scroll box inside the page scroll (`max-height: 30rem`).

Missing product pieces:
- **F14** An expense cannot be edited, only deleted and re-entered.
- **F15** The headline number is all-time spend; there is no figure for today.
- **F16** The donut is all-time only; a daily tracker needs this month.
- **F17** No way to get data out (CSV).
- **F18** No favicon, theme colour or web manifest.

Housekeeping:
- **F19** `DESIGN.md`, `README.md` and `PRODUCT.md` describe an older layout; `.btn-logout` is dead CSS; category options are hard-coded twice.

## File structure

| File | Responsibility | Tasks |
|---|---|---|
| `js/money.js` (new) | cents conversion, summing, formatting | 1 |
| `js/dates.js` (new) | local ISO dates, month keys | 1 |
| `js/expenses.js` (new) | filter, group, stats, breakdown, period, pagination, CSV, HTML escaping | 2, 4, 10, 11 |
| `js/validate.js` (new) | email and password rules, auth error mapping | 7 |
| `js/app.js` | DOM and Supabase only | most |
| `js/icons.js` | add `pencil`, `trash` UI icons | 3 |
| `js/i18n.js` | new keys | most |
| `tests/*.test.mjs` (new) | unit tests, one file per module | 1, 2, 4, 7, 10, 11 |
| `tests/check.mjs` | static wiring checks plus forbidden-pattern guards | 3, 7, 12 |
| `migrations/2026-11-09-harden-costs.sql` (new) | DB hardening for existing projects | 13 |
| `icon.svg`, `manifest.webmanifest` (new) | install metadata | 14 |

## Task order and suggested model

Tasks run in order; each leaves the app working. Tasks 1 to 7 are fixes, 8 to 11 features, 12 to 14 platform, 15 docs.

| Task | Depends on | Model | Note |
|---|---|---|---|
| 1, 2, 4, 7, 10, 11 | previous | Sonnet 5.5 | test-first on pure modules |
| 3, 5, 6, 9, 14, 15 | previous | Sonnet 5.5 | DOM/CSS, manual checks |
| 8 | 3, 5 | Sonnet 5.5, then review by a stronger model | most state |
| 12 | 3 | Sonnet 5.5, browser check is mandatory | a wrong CSP blanks the site |
| 13 | none | Sonnet 5.5 | writes SQL only; user runs it |

## Review Focus

1. Amounts arrive from PostgREST as strings (`"20.00"`) and may be `0.1`/`0.2` style values: sums must be exact. Pinned by `tests/money.test.mjs` (Task 1).
2. An account with more than 1,000 rows, or exactly 1,000: every row is loaded, once. Pinned by `tests/pagination.test.mjs` (Task 4).
3. A row whose category is not one of the six (legacy or hand-edited data): it renders, counts under Other in the chart, and never throws. Pinned in `tests/expenses.test.mjs` (Task 2).
4. Notes containing `<script>`, quotes, commas, newlines or a leading `=`: escaped in HTML, quoted and neutralised in CSV. Pinned in `tests/expenses.test.mjs` (Tasks 2 and 11).
5. Late evening and month/year boundaries in a timezone west of UTC: "today" and "this month" follow the local calendar. Pinned by `tests/dates.test.mjs` (Task 1).
6. Signing out, or double-clicking submit, while a request is in flight. No unit test is possible; covered by code requirements and manual checks in Tasks 4 and 5.

---

### Task 1: Test runner, `money.js`, `dates.js`

**Files:**
- Create: `js/money.js`, `js/dates.js`, `tests/money.test.mjs`, `tests/dates.test.mjs`
- Modify: `js/app.js` (remove local `localISO`, lines 36-42; import it), `.github/workflows/ci.yml`

**Interfaces:**
- Produces:
  - `toCents(value: number | string): number` integer cents, `Math.round(Number(value) * 100)`, non-numeric gives `0`
  - `sumCents(items: Array<{ amount: number | string }>): number`
  - `formatMoney(cents: number): string` always `en-US` grouping, two decimals, `$` prefix
  - `localISO(daysAgo = 0, now = new Date()): string` local `YYYY-MM-DD`
  - `monthKey(iso: string): string` `YYYY-MM`

- [ ] **Step 1: Write the failing tests**

`tests/money.test.mjs`:
```js
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
```

`tests/dates.test.mjs`:
```js
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
```

- [ ] **Step 2: Run** `node --test tests/*.test.mjs`. Expected: FAIL, cannot find module `js/money.js`.
- [ ] **Step 3: Implement both modules** to the signatures above. `formatMoney` uses `(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- [ ] **Step 4: Use `localISO` from `js/dates.js` in `app.js`**: delete the local function, add the import. Do not change money rendering yet (Task 2 does).
- [ ] **Step 5: Add a CI step** in the `check` job after "HTML and id wiring": name `Unit tests`, run `node --test tests/*.test.mjs`.
- [ ] **Step 6: Run the three global commands.** Expected: all pass.
- [ ] **Step 7: Commit** "Add unit test runner with money and date modules".

---

### Task 2: `expenses.js` and render through it (F4, F5, F19)

**Files:**
- Create: `js/expenses.js`, `tests/expenses.test.mjs`
- Modify: `js/app.js` (`renderCosts`, `renderChart`, `escapeHtml`, lang-change handler), `index.html` (category filter options, lines 186-191)

**Interfaces:**
- Consumes: `toCents`, `sumCents`, `formatMoney`, `monthKey`.
- Produces (all pure, never mutate input):
  - `escapeHtml(str: string): string` moved from `app.js` unchanged
  - `filterExpenses(items, { search = '', category = '', labelOf = (c) => c }): items` case-insensitive; a row matches when the search text is in its stored category, in `labelOf(category)`, in its notes, or in its date
  - `groupByDay(items): Array<{ date: string, items: Array, subtotalCents: number }>` keeps input order
  - `computeStats(items, todayISO: string): { todayCents, monthCents, allCents }`
  - `categoryBreakdown(items, categoryValues: string[]): { totalCents: number, rows: Array<{ value: string, cents: number, pct: number }> }` rows in `categoryValues` order, only where `cents > 0`; a category not in `categoryValues` is counted under `'Other'`; `pct` is unrounded `cents / totalCents * 100`

- [ ] **Step 1: Write the failing tests** in `tests/expenses.test.mjs`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, filterExpenses, groupByDay, computeStats, categoryBreakdown } from '../js/expenses.js';

const VALUES = ['Meat', 'Food & Dining', 'Transport', 'Utilities', 'Entertainment', 'Other'];
const rows = [
  { id: 'a', date: '2026-11-09', category: 'Transport', amount: '12.50', notes: 'Bus pass' },
  { id: 'b', date: '2026-11-09', category: 'Meat', amount: '20.00', notes: null },
  { id: 'c', date: '2026-11-08', category: 'Food & Dining', amount: '0.10', notes: 'coffee' },
  { id: 'd', date: '2026-10-31', category: 'Weird', amount: '0.20', notes: '' }
];
const ids = (list) => list.map((r) => r.id);
const es = (c) => ({ Transport: 'Transporte', Meat: 'Carnes y supermercado' }[c] || c);

test('filterExpenses', () => {
  assert.deepEqual(ids(filterExpenses(rows, {})), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids(filterExpenses(rows, { search: 'BUS' })), ['a']);
  assert.deepEqual(ids(filterExpenses(rows, { search: 'transporte', labelOf: es })), ['a']);
  assert.deepEqual(ids(filterExpenses(rows, { search: 'transport', labelOf: es })), ['a']);
  assert.deepEqual(ids(filterExpenses(rows, { search: '2026-10' })), ['d']);
  assert.deepEqual(ids(filterExpenses(rows, { category: 'Meat' })), ['b']);
  assert.deepEqual(ids(filterExpenses(rows, { search: 'coffee', category: 'Meat' })), []);
});
test('groupByDay', () => {
  const days = groupByDay(rows);
  assert.deepEqual(days.map((d) => d.date), ['2026-11-09', '2026-11-08', '2026-10-31']);
  assert.equal(days[0].subtotalCents, 3250);
  assert.deepEqual(ids(days[0].items), ['a', 'b']);
});
test('computeStats', () => {
  assert.deepEqual(computeStats(rows, '2026-11-09'), { todayCents: 3250, monthCents: 3260, allCents: 3280 });
  assert.deepEqual(computeStats([], '2026-11-09'), { todayCents: 0, monthCents: 0, allCents: 0 });
});
test('categoryBreakdown', () => {
  const b = categoryBreakdown(rows, VALUES);
  assert.equal(b.totalCents, 3280);
  assert.deepEqual(b.rows.map((r) => r.value), ['Meat', 'Food & Dining', 'Transport', 'Other']);
  assert.equal(b.rows.at(-1).cents, 20);
  assert.ok(Math.abs(b.rows.reduce((s, r) => s + r.pct, 0) - 100) < 1e-9);
  assert.deepEqual(categoryBreakdown([], VALUES), { totalCents: 0, rows: [] });
});
test('escapeHtml', () => {
  assert.equal(escapeHtml(`<img src=x onerror="a('b')">&`), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
});
```
- [ ] **Step 2: Run** `node --test tests/*.test.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `js/expenses.js`.**
- [ ] **Step 4: Rewrite `renderCosts` and `renderChart` in `app.js` on top of these functions.** Rules:
  - `labelOf` is `(c) => t('cat.' + c)`.
  - Every amount on screen goes through `formatMoney(cents)`. After this step `app.js` contains no `.toFixed(`.
  - Stats use `computeStats(costsCache, localISO(0))`; this task still renders only `monthCents` and `allCents`.
  - The chart keeps its markup and arc maths; `pct` and totals come from `categoryBreakdown(costsCache, CATEGORIES.map((c) => c.value))`. The legend is still sorted by amount, largest first, and the arcs stay in `CATEGORIES` order.
  - Delete the local `escapeHtml`; import it.
- [ ] **Step 5: Generate the category filter options.** In `index.html` keep only the "All Categories" option inside `#category-filter`. In `app.js` add `renderCategoryFilter()` that rebuilds the options from `CATEGORIES` (value = stored value, text = `t('cat.' + value)`), keeps the current selection, and is called once at start-up and in the `onLangChange` callback.
- [ ] **Step 6: Run the three global commands.** Expected: pass.
- [ ] **Step 7: Manual check.** List, subtotals, summary line, both stats and the donut show the same numbers as before (now with thousands separators). In ES, typing `transporte` in search finds Transport rows. Switching language keeps the selected category filter.
- [ ] **Step 8: Commit** "Move expense maths into tested modules and search by translated category".

---

### Task 3: Row actions by delegation, icon buttons (F7, F12 part)

**Files:**
- Modify: `js/app.js` (`renderCosts` row markup, `window.deleteCost`), `js/icons.js`, `js/i18n.js`, `css/style.css`, `tests/check.mjs`

**Interfaces:**
- Produces:
  - Row buttons carry `data-action="delete"` and `data-id="<uuid>"`. One `click` listener on `costList` dispatches on `e.target.closest('[data-action]')`. Tasks 4 and 8 add the actions `retry` and `edit` to this same listener.
  - `uiIcon('trash')`, `uiIcon('pencil')`
  - CSS class `.icon-btn` (and modifier `.icon-btn.danger`)
  - `async function deleteCost(id)` module-local in `app.js`

- [ ] **Step 1: Add the failing guard** to `tests/check.mjs`, before the i18n block:
```js
const forbidden = [
  [/onclick=/, 'inline onclick handler'],
  [/window\.deleteCost/, 'global deleteCost'],
  [/\balert\(/, 'alert()']
];
const hits = forbidden.filter(([re]) => re.test(js) || re.test(html)).map(([, why]) => why);
if (hits.length) { console.error('Forbidden patterns:', hits.join(', ')); process.exit(1); }
```
- [ ] **Step 2: Run** `node tests/check.mjs`. Expected: exit 1, "Forbidden patterns: inline onclick handler, global deleteCost, alert()".
- [ ] **Step 3: Add the icons** to `UI` in `js/icons.js` (Lucide paths):
```js
pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>'
```
- [ ] **Step 4: Replace the row's Delete button** with `<button type="button" class="icon-btn danger" data-action="delete" data-id="..." aria-label="...">` containing `uiIcon('trash')`. The label is `t('history.deleteAria', { cat, amount })` where `cat` is the translated category and `amount` the formatted money; escape it with `escapeHtml`. Remove key `history.delete`.

  New keys: `history.deleteAria` = `Delete {cat} expense of {amount}` / `Eliminar gasto de {cat} por {amount}`.
- [ ] **Step 5: Replace `window.deleteCost`** with a module-local `deleteCost(id)` called from the delegated listener. On error call `showToast(t('history.deleteFailed', { msg: error.message }), { ms: 8000 })` instead of `alert`. Disable the clicked button while the request runs.
- [ ] **Step 6: CSS.** `.icon-btn`: 2.25rem square, transparent, no border, `border-radius: var(--radius)`, `color: var(--text-muted)`, icon 1.1rem, hover `background: var(--ground); color: var(--ink)`. `.icon-btn.danger:hover`: `background: var(--danger-bg); color: var(--danger)`. Under `@media (pointer: coarse)`: 44px square. Delete the `.btn-danger` rules and its coarse-pointer rule (no longer used), and the dead `.btn-logout` rules.
- [ ] **Step 7: Run the three global commands.** Expected: pass.
- [ ] **Step 8: Manual check.** Delete works by mouse and by keyboard (Tab to the bin, Enter); Undo restores; a screen reader or the accessibility inspector names the button "Delete Transport expense of $12.50".
- [ ] **Step 9: Commit** "Handle row actions by delegation and replace Delete text with an icon button".

---

### Task 4: Load every row, once, for the right user (F1, F6)

**Files:**
- Create: `tests/pagination.test.mjs`
- Modify: `js/expenses.js`, `js/app.js` (`fetchCosts`, `handleSession`, the `costList` listener), `js/i18n.js`

**Interfaces:**
- Produces: `async fetchAllPages(getPage: (from: number, to: number) => Promise<{ data: Array | null, error: object | null }>, pageSize = 1000): Promise<{ data: Array | null, error: object | null }>`. Calls `getPage(0, pageSize - 1)`, then the next range, until a page returns fewer than `pageSize` rows. On any error returns `{ data: null, error }` immediately.

- [ ] **Step 1: Write the failing tests** in `tests/pagination.test.mjs`:
```js
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
```
- [ ] **Step 2: Run** `node --test tests/*.test.mjs`. Expected: FAIL, `fetchAllPages` is not exported.
- [ ] **Step 3: Implement `fetchAllPages`.**
- [ ] **Step 4: Rewrite `fetchCosts`** to use it. The page query is `supabase.from('costs').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }).order('id').range(from, to)`. The three-column order is required: range paging needs a total order.

  Add a stale-response guard: a module counter `fetchSeq`; capture `const seq = ++fetchSeq` and the current user id at the start; after the await, return without touching `costsCache` or the DOM if `seq !== fetchSeq` or the signed-in user id differs.
- [ ] **Step 5: Failure state with Retry.** On error render `<li class="empty-state">` with `t('history.failed')` and `<button type="button" class="text-link link-btn" data-action="retry">`. Handle `retry` in the delegated listener by calling `fetchCosts()`. New key `history.retry` = `Try again` / `Reintentar`.
- [ ] **Step 6: Fetch only when the user changes.** In `handleSession`, remember the previous user id before assigning `currentUser`; when there is a user, update the header as now but call `fetchCosts()` only if the id changed. When there is no user, also do `fetchSeq++` so an in-flight fetch is discarded.
- [ ] **Step 7: Run the three global commands.** Expected: pass.
- [ ] **Step 8: Manual check.** DevTools Network tab: one `costs` request on load (not two); none when switching away from the tab and back. With the network set to Offline, reload: the failure text and "Try again" appear; back online, "Try again" loads the list. Sign in, throttle to Slow 3G, reload and sign out before the list appears: the sign-in card stays and no list flashes in.
- [ ] **Step 9: Commit** "Load all expenses in pages and ignore stale responses".

---

### Task 5: Busy state on every request (F2)

**Files:**
- Modify: `js/app.js` (all five form submit handlers, `#send-reset-link`, `#toast-undo`), `css/style.css`

**Interfaces:**
- Produces: `async function withBusy(el: HTMLFormElement | HTMLButtonElement, fn: () => Promise<void>): Promise<void>` in `app.js`. The button is `el` itself or `el.querySelector('[type="submit"]')`. If the button is already disabled, return without calling `fn`. Otherwise set `disabled` and `aria-busy="true"`, `await fn()`, and restore both in `finally`.

- [ ] **Step 1: Add `withBusy`** and wrap the body after validation of: `authForm`, `forgotForm`, `resetPasswordForm`, `changePasswordForm`, `costForm` submit handlers, and the click handlers of `#send-reset-link` and `#toast-undo`. Validation failures return before `withBusy`, so the button is never left disabled.
- [ ] **Step 2: CSS.** `.btn:disabled, .toast-undo:disabled, .link-btn:disabled { opacity: 0.6; cursor: progress; }` and no `:active` nudge while disabled.
- [ ] **Step 3: Run the three global commands.** Expected: pass.
- [ ] **Step 4: Manual check.** Throttle to Slow 3G; double-click "Add Expense": exactly one new row. The button looks disabled during the request and is enabled again after success and after a forced failure (Offline).
- [ ] **Step 5: Commit** "Disable submit buttons while their request is in flight".

---

### Task 6: Accessibility and mobile fixes (F3, F12, F13)

**Files:**
- Modify: `index.html`, `js/app.js`, `css/style.css`

**Interfaces:**
- Produces:
  - `showMessage(el: HTMLElement, text: string, type: 'error' | 'success'): void` replaces `showAuthMessage`, `showForgotMessage`, `showResetPasswordMessage`, `showChangePasswordMessage`, `showCostMessage`
  - `setAuthMode(signUp: boolean): void` replaces the two tab click handlers

- [ ] **Step 1: Escape.** The global keydown handler closes the menu and focuses `profileBtn` only when the menu is open.
- [ ] **Step 2: Live regions.** Add `role="status"` to the five `.message` elements in `index.html`. Replace the five `show...Message` functions with `showMessage` (it sets `textContent` and `className = 'message ' + type`).
- [ ] **Step 3: Auth tabs.** `setAuthMode(signUp)` does what the two handlers do now, and also: sets `aria-pressed` on both tab buttons; sets `#password`'s `autocomplete` to `new-password` in sign-up mode and `current-password` otherwise; hides `#forgot-link-container` in sign-up mode. Add `aria-pressed` and `autocomplete="current-password"` to the initial markup. Style the active tab from `[aria-pressed="true"]` and drop the `active` class.
- [ ] **Step 4: Profile menu keys.** When the menu opens, focus the first `.menu-item`. While it is open, ArrowDown/ArrowUp move focus between the three `.menu-item` buttons and wrap; Home/End jump to first/last; Tab closes the menu.
- [ ] **Step 5: Toast timing.** While the pointer is over the toast or focus is inside it, the hide timer is cleared; on `mouseleave`/`focusout` it restarts at 4000 ms.
- [ ] **Step 6: Mobile history.** Inside the existing `@media (max-width: 760px)` block: `.cost-list { max-height: none; overflow: visible; }`.
- [ ] **Step 7: Run the three global commands.** Expected: pass.
- [ ] **Step 8: Manual check.** Typing in Notes and pressing Escape leaves focus in Notes. Keyboard only: open the profile menu with Enter, move with arrows, Escape returns to the profile button. Sign Up tab hides "Forgot password?". At 375px width the page has a single scroll and day headers stick to the top of the window. Tab onto Undo in the toast: it stays until focus leaves.
- [ ] **Step 9: Commit** "Fix Escape focus theft and add menu, tab, toast and live-region accessibility".

---

### Task 7: Password policy and translated auth errors (F8, F11)

**Files:**
- Create: `js/validate.js`, `tests/validate.test.mjs`
- Modify: `js/app.js`, `js/i18n.js`, `tests/check.mjs`, `PRODUCT.md` (Operating Context line), `README.md` (Features line)

**Interfaces:**
- Produces:
  - `isValidEmail(email: string): boolean` moved unchanged
  - `isValidPassword(pw: string): boolean` true when length is 4 to 16 and it has at least one ASCII letter and one digit; symbols and any other characters are allowed. The 4 to 16 length is the user's decision: do not change it.
  - `authErrorKey(error: { code?: string, message?: string }): string | null` an i18n key, or `null` when unknown

  Mapping, `code` first and `message` as fallback:

  | code | message matches | key |
  |---|---|---|
  | `invalid_credentials` | `/invalid login credentials/i` | `err.invalidLogin` |
  | `user_already_exists` | `/already registered/i` | `err.alreadyRegistered` |
  | `email_not_confirmed` | `/email not confirmed/i` | `err.emailNotConfirmed` |
  | `over_email_send_rate_limit`, `over_request_rate_limit` | `/rate limit/i` | `err.rateLimit` |
  | `weak_password` | none | `auth.invalidPassword` |
  | `same_password` | none | `pw.same` |
  | none | `/failed to fetch|networkerror|load failed/i` | `err.network` |

  The codes come from the Supabase Auth error-code list. Confirm them against the current Supabase docs (context7 `supabase` "auth error codes") before coding; if a code differs, use the documented one and keep the message fallback.

- [ ] **Step 1: Write the failing tests** in `tests/validate.test.mjs`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, isValidPassword, authErrorKey } from '../js/validate.js';

test('isValidPassword', () => {
  assert.equal(isValidPassword('ab12'), true);
  assert.equal(isValidPassword('ab1!'), true);
  assert.equal(isValidPassword('abcd1234!? ñ'), true);
  assert.equal(isValidPassword('p@ss-w0rd_#'), true);
  assert.equal(isValidPassword('ab1'), false);
  assert.equal(isValidPassword('abcdefgh'), false);
  assert.equal(isValidPassword('12345678'), false);
  assert.equal(isValidPassword('!!!!1111'), false);
  assert.equal(isValidPassword('a1' + 'x'.repeat(14)), true);
  assert.equal(isValidPassword('a1' + 'x'.repeat(15)), false);
});
test('isValidEmail', () => {
  assert.equal(isValidEmail('you@example.com'), true);
  assert.equal(isValidEmail('you@example'), false);
  assert.equal(isValidEmail('a b@example.com'), false);
});
test('authErrorKey', () => {
  assert.equal(authErrorKey({ code: 'invalid_credentials' }), 'err.invalidLogin');
  assert.equal(authErrorKey({ message: 'Invalid login credentials' }), 'err.invalidLogin');
  assert.equal(authErrorKey({ message: 'User already registered' }), 'err.alreadyRegistered');
  assert.equal(authErrorKey({ code: 'email_not_confirmed' }), 'err.emailNotConfirmed');
  assert.equal(authErrorKey({ message: 'Email rate limit exceeded' }), 'err.rateLimit');
  assert.equal(authErrorKey({ message: 'TypeError: Failed to fetch' }), 'err.network');
  assert.equal(authErrorKey({ message: 'Something new' }), null);
  assert.equal(authErrorKey({}), null);
});
```
- [ ] **Step 2: Run** `node --test tests/*.test.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `js/validate.js`**; delete the two validators from `app.js` and import them.
- [ ] **Step 4: Sign-in no longer checks the password format** (a wrong password is the server's answer to give). `isValidPassword` runs only in sign-up mode, in the set-new-password form and in the change-password form.
- [ ] **Step 5: Translate errors.** Add `authErrorText(error)` in `app.js`: `const key = authErrorKey(error); return key ? t(key) : error.message;`. Use it everywhere a Supabase **auth** `error.message` is shown (sign in, sign up, forgot, set new password, change password, email reset link).
- [ ] **Step 6: Reset-link error copy.** In `initSession`, show `t('auth.linkError')` with no variables and `console.warn` the decoded description. Remove key `auth.linkExpired`.
- [ ] **Step 7: Strings** (both languages):

  | key | en | es |
  |---|---|---|
  | `auth.invalidPassword` | Password must be 4 to 16 characters and include at least one letter and one number. Symbols are allowed. | La contraseña debe tener entre 4 y 16 caracteres e incluir al menos una letra y un número. Se permiten símbolos. |
  | `pw.invalidNew` | New password must be 4 to 16 characters and include at least one letter and one number. Symbols are allowed. | La nueva contraseña debe tener entre 4 y 16 caracteres e incluir al menos una letra y un número. Se permiten símbolos. |
  | `auth.linkError` | This reset link is invalid or has expired. Request a new one with "Forgot password?". | Este enlace no es válido o ha expirado. Solicita uno nuevo con «¿Olvidaste tu contraseña?». |
  | `err.invalidLogin` | Wrong email or password. | Correo o contraseña incorrectos. |
  | `err.alreadyRegistered` | An account with this email already exists. Sign in instead. | Ya existe una cuenta con este correo. Inicia sesión. |
  | `err.emailNotConfirmed` | Confirm your email first: open the link we sent you. | Primero confirma tu correo: abre el enlace que te enviamos. |
  | `err.rateLimit` | Too many attempts. Wait a few minutes and try again. | Demasiados intentos. Espera unos minutos e inténtalo de nuevo. |
  | `err.network` | No connection. Check your internet and try again. | Sin conexión. Revisa tu internet e inténtalo de nuevo. |

- [ ] **Step 8: Guard the keys.** In `tests/check.mjs`, read `js/validate.js` and add every `'err.x'`, `'auth.x'`, `'pw.x'` string literal found in it (`/'((?:err|auth|pw)\.[A-Za-z]+)'/g`) to `usedKeys`.
- [ ] **Step 9: Docs.** Update the password sentence in `PRODUCT.md` ("Operating Context") and `README.md` ("Features") to the new rule.
- [ ] **Step 10: Run the three global commands.** Expected: pass.
- [ ] **Step 11: Manual check.** Sign in with a wrong password in ES: "Correo o contraseña incorrectos." Sign up with `abcdef`: the 4 to 16 message. Sign up or change password with `p@ss-w0rd`: accepted.
- [ ] **Step 12: USER NOTE (report it, do not do it):** Supabase enforces its own minimum password length (Authentication settings). If it is above 4, passwords of 4 or 5 characters pass the form but are refused by the server; the user decides whether to lower it.
- [ ] **Step 13: Commit** "Allow symbols in passwords and translate auth errors".

---

### Task 8: Edit an expense (F14)

**Files:**
- Modify: `index.html` (add-expense card), `js/app.js`, `js/i18n.js`, `css/style.css`

**Interfaces:**
- Consumes: the delegated `costList` listener (Task 3), `withBusy` (Task 5), `showToast`.
- Produces: `startEdit(id: string): void`, `stopEdit(): void`, module state `let editingId = null`. New ids: `cost-form-title`, `cost-submit`, `cost-cancel`.

Design: there is one form. Editing loads a row into it; there is no modal and no inline row editor.

- [ ] **Step 1: Markup.** Give the card's `<h2>` the id `cost-form-title` and the submit button the id `cost-submit`. After the submit button add `<button type="button" id="cost-cancel" class="btn btn-secondary hidden" data-i18n="form.cancel">Cancel</button>`.
- [ ] **Step 2: Row button.** Before the bin button, render `<button type="button" class="icon-btn" data-action="edit" data-id="..." aria-label="...">` with `uiIcon('pencil')` and label `t('history.editAria', { cat, amount })`. The row being edited gets `aria-current="true"`.
- [ ] **Step 3: `startEdit(id)`**: find the row in `costsCache` (return if missing); set `editingId`; fill date, amount (`Number(row.amount).toFixed(2)`), notes; set the category with `costForm.elements.category.value = row.category` and update `costCard.dataset.cat` (a category outside the six selects nothing, so the required radio forces a choice); switch `#cost-form-title` to `data-i18n="form.editTitle"` and `#cost-submit` to `data-i18n="form.save"`; show `#cost-cancel`; call `syncDateShortcuts()` and `applyTranslations()`; re-render the list; `costCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' })`; focus the amount field and select its text.
- [ ] **Step 4: `stopEdit()`**: clear `editingId`; `costForm.reset()`; remove `costCard.dataset.cat`; `setCostDate(0)`; restore `form.title` and `form.submit`; hide Cancel; `applyTranslations()`; re-render the list.
- [ ] **Step 5: Submit.** When `editingId` is set, run `supabase.from('costs').update({ amount, category, date, notes }).eq('id', editingId)` instead of the insert. Do not send `user_id`. On success: `stopEdit()`, `fetchCosts()`, `showToast(t('toast.updated'), { ms: 3000 })`. On error: show it in `#cost-message` and stay in edit mode. The add path is unchanged.
- [ ] **Step 6: Leaving edit mode.** `#cost-cancel` click, Escape while focus is inside `costForm`, deleting the row being edited, and sign-out (in `handleSession` when there is no user) all call `stopEdit()`. If a re-render finds that `editingId` is no longer in `costsCache`, call `stopEdit()`.
- [ ] **Step 7: Language change** keeps edit mode: the `onLangChange` callback already re-renders the picker with the current selection; confirm the title and button stay "Edit"/"Save".
- [ ] **Step 8: Strings.**

  | key | en | es |
  |---|---|---|
  | `form.editTitle` | Edit Expense | Editar gasto |
  | `form.save` | Save Changes | Guardar cambios |
  | `form.cancel` | Cancel | Cancelar |
  | `history.editAria` | Edit {cat} expense of {amount} | Editar gasto de {cat} por {amount} |
  | `toast.updated` | Expense updated. | Gasto actualizado. |

- [ ] **Step 9: CSS.** `.btn-secondary { margin-top: 0.5rem; background: transparent; }` with hover `background: var(--ground)` (it must not be chartreuse: one stamp per view). `.cost-item[aria-current="true"] { background: var(--ground); }`.
- [ ] **Step 10: Run the three global commands.** Expected: pass.
- [ ] **Step 11: Manual check.** Edit a row: the form fills, the card's top rule takes the category colour, Save updates the same row (the row count does not change) and the toast shows. Cancel and Escape restore an empty form dated today. Edit a row, then delete that row: the form leaves edit mode. Edit, switch language: still editing. Add still works after an edit.
- [ ] **Step 12: Commit** "Add editing of an existing expense through the add form".

---

### Task 9: Today, This month, All time (F15)

**Files:**
- Modify: `index.html` (`#stats-grid`), `js/app.js` (`renderCosts` stats block), `js/i18n.js`, `css/style.css`

**Interfaces:**
- Consumes: `computeStats(...).todayCents`.
- Produces: new id `stat-today`. Order in the DOM: Today, This month, All time.

- [ ] **Step 1: Markup.** Three `.stat-card` blocks in that order with ids `stat-today`, `stat-month`, `stat-total`. The third also has class `stat-all`.
- [ ] **Step 2: Render** `todayCents` into `#stat-today`.
- [ ] **Step 3: Strings.** New `stats.today` = `Today` / `Hoy`. Change `stats.total` to `All time` / `Histórico`.
- [ ] **Step 4: CSS.** `.stats-grid` becomes three equal columns. Inside `@media (max-width: 760px)`: two columns; `.stat-all` spans both (`grid-column: 1 / -1`), loses its left border and padding, gets `margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--ink-2)`, and its `.amount` is `1.25rem`.
- [ ] **Step 5: Run the three global commands.** Expected: pass.
- [ ] **Step 6: Manual check.** Add an expense dated today: Today, This month and All time all rise by it. Add one dated yesterday: Today does not change. At 375px no figure overflows with `$12,345.67` in each (temporarily hard-code to test, then revert).
- [ ] **Step 7: Commit** "Show today's spend next to this month and all time".

---

### Task 10: Chart period, this month or all time (F16)

**Files:**
- Modify: `js/expenses.js`, `tests/expenses.test.mjs`, `index.html` (`.card-chart`), `js/app.js` (`renderChart`), `js/i18n.js`, `css/style.css`

**Interfaces:**
- Produces: `periodItems(items, period: 'month' | 'all', todayISO: string): items` (`'month'` keeps rows whose `monthKey(date)` equals `monthKey(todayISO)`). Module state `let chartPeriod = 'month'` in `app.js`. New id `chart-period`.

- [ ] **Step 1: Add the failing test** to `tests/expenses.test.mjs` (import `periodItems`):
```js
test('periodItems', () => {
  assert.deepEqual(ids(periodItems(rows, 'month', '2026-11-09')), ['a', 'b', 'c']);
  assert.deepEqual(ids(periodItems(rows, 'all', '2026-11-09')), ['a', 'b', 'c', 'd']);
  assert.deepEqual(ids(periodItems(rows, 'month', '2026-12-01')), []);
});
```
- [ ] **Step 2: Run** `node --test tests/*.test.mjs`. Expected: FAIL, `periodItems` is not exported.
- [ ] **Step 3: Implement `periodItems`.**
- [ ] **Step 4: Markup.** Wrap the chart card's `<h2>` in `<div class="card-head">` and add beside it `<div id="chart-period" class="date-shortcuts" role="group" data-i18n-aria="chart.periodAria">` holding two `.chip-btn` buttons with `data-period="month"` (`aria-pressed="true"`, key `chart.month`) and `data-period="all"` (`aria-pressed="false"`, key `chart.all`).
- [ ] **Step 5: Behaviour.** A click on a `[data-period]` button sets `chartPeriod`, updates both `aria-pressed` values and calls `renderChart()`. `renderChart` builds its breakdown from `periodItems(costsCache, chartPeriod, localISO(0))`. When the period is `month` and its total is 0 but `costsCache` is not empty, the empty text is `t('chart.emptyMonth')`.
- [ ] **Step 6: Strings.**

  | key | en | es |
  |---|---|---|
  | `chart.month` | This month | Este mes |
  | `chart.all` | All time | Histórico |
  | `chart.periodAria` | Chart period | Periodo del gráfico |
  | `chart.emptyMonth` | Nothing spent this month yet. | Aún no hay gastos este mes. |

- [ ] **Step 7: CSS.** `.card-head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }` and `.card-head h2 { margin-bottom: 0; }`.
- [ ] **Step 8: Run the three global commands.** Expected: pass.
- [ ] **Step 9: Manual check.** The donut centre equals the "This month" stat by default and the "All time" stat after switching. The toggle is reachable and operable by keyboard.
- [ ] **Step 10: Commit** "Let the category chart switch between this month and all time".

---

### Task 11: CSV export (F17)

**Files:**
- Modify: `js/expenses.js`, `tests/expenses.test.mjs`, `index.html`, `js/app.js`, `js/i18n.js`, `css/style.css`

**Interfaces:**
- Produces: `toCsv(items): string`. Starts with a UTF-8 BOM (`﻿`), header `date,category,amount,notes`, one line per item, `\r\n` after every line including the last. `category` is the stored value. `amount` is two decimals without `$`. A field containing `"`, `,`, `\r` or `\n` is wrapped in quotes with `"` doubled. A notes value starting with `=`, `+`, `-` or `@` gets a leading `'` (spreadsheet formula guard). `null` notes become empty. New id `export-csv`.

- [ ] **Step 1: Add the failing tests** (import `toCsv`):
```js
test('toCsv', () => {
  const csv = toCsv([
    { date: '2026-11-09', category: 'Food & Dining', amount: '12.5', notes: 'a "b", c' },
    { date: '2026-11-08', category: 'Other', amount: 3, notes: '=SUM(A1)' },
    { date: '2026-11-07', category: 'Meat', amount: '1.00', notes: null },
    { date: '2026-11-06', category: 'Meat', amount: '2.00', notes: 'two\nlines' }
  ]);
  assert.equal(csv,
    '﻿date,category,amount,notes\r\n' +
    '2026-11-09,Food & Dining,12.50,"a ""b"", c"\r\n' +
    "2026-11-08,Other,3.00,'=SUM(A1)\r\n" +
    '2026-11-07,Meat,1.00,\r\n' +
    '2026-11-06,Meat,2.00,"two\nlines"\r\n');
  assert.equal(toCsv([]), '﻿date,category,amount,notes\r\n');
});
```
- [ ] **Step 2: Run** `node --test tests/*.test.mjs`. Expected: FAIL, `toCsv` is not exported.
- [ ] **Step 3: Implement `toCsv`.**
- [ ] **Step 4: Button.** Wrap `#history-summary` in `<div class="summary-row">` and add `<button type="button" id="export-csv" class="text-link link-btn hidden" data-i18n="history.export">`. It is visible exactly when the summary is.
- [ ] **Step 5: Download.** `renderCosts` keeps the last filtered list in a module variable. The click handler builds a `Blob` (`type: 'text/csv;charset=utf-8'`) from `toCsv(thatList)`, creates an object URL, clicks a temporary `<a download="daily-costs-YYYY-MM-DD.csv">` (date from `localISO(0)`), then revokes the URL.
- [ ] **Step 6: Strings.** `history.export` = `Export CSV` / `Exportar CSV`.
- [ ] **Step 7: CSS.** `.summary-row { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; margin-bottom: 0.5rem; }` and remove the bottom margin from `.history-summary`.
- [ ] **Step 8: Run the three global commands.** Expected: pass.
- [ ] **Step 9: Manual check.** Filter to one category and export: the file has only those rows, opens in a spreadsheet with accents intact, and a note with a comma stays in one cell.
- [ ] **Step 10: Commit** "Add CSV export of the filtered expense list".

---

### Task 12: Pin the Supabase client and add a Content Security Policy (F9)

**Files:**
- Modify: `js/supabaseClient.js`, `index.html`, `js/app.js`, `css/style.css`, `tests/check.mjs`

A wrong policy makes the page blank. The browser check in Step 7 is mandatory for this task; if you cannot run it, stop after Step 5 and report that Step 6 and 7 are pending.

- [ ] **Step 1: Add the failing guards** to `tests/check.mjs`:
  - add `[/style="/, 'inline style attribute']` to the `forbidden` list
  - read `js/supabaseClient.js` and fail unless it matches `/supabase-js@\d+\.\d+\.\d+\/\+esm/`
  - fail unless `index.html` contains `http-equiv="Content-Security-Policy"`
- [ ] **Step 2: Run** `node tests/check.mjs`. Expected: exit 1 on the inline style attribute.
- [ ] **Step 3: Remove inline styles.** The picker and the legend set `style="--cat:..."`. Delete those attributes (both elements already have `data-cat`). In CSS replace the five `.cost-item[data-cat=...]` rules with six global rules placed **after** the `.cost-item` rule: `[data-cat="Meat"] { --cat: var(--cat-meat); }` and so on for `Food & Dining` (`--cat-food`), `Transport`, `Utilities`, `Entertainment` (`--cat-fun`), `Other`. Keep `--cat: var(--cat-other)` as the default on `.cost-item`, and change `.cat-ico` to `background: var(--cat, var(--cat-other))`. The `color` field of `CATEGORIES` stays: the donut arcs use it in an SVG `stroke` attribute, which CSP does not restrict.
- [ ] **Step 4: Pin.** Change the import URL to `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm` (2.119.0 was the latest release on 2026-11-09; if you choose a newer one, confirm it with `npm view @supabase/supabase-js version`). Delete the stale first comment line of the file.
- [ ] **Step 5: Run the three global commands.** Expected: `check.mjs` now fails only on the missing CSP.
- [ ] **Step 6: Add the policy** as the first element after `<meta charset>` in `index.html`, on one line:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src https://pbivydommrnxxerkdjva.supabase.co wss://pbivydommrnxxerkdjva.supabase.co; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'">
```
  The host in `connect-src` must equal `SUPABASE_URL` in `js/supabaseClient.js`.
- [ ] **Step 7: Mandatory browser check.** Serve locally (`npx serve` or `python -m http.server 8000`), open the page with DevTools Console open. Expected: zero "Content Security Policy" messages while you load the page, sign in, add, edit, delete, undo, export CSV, switch language and sign out. Fonts load (headings are Archivo, not the system font). Category chips and legend rows still show their colours.
- [ ] **Step 8: Commit** "Pin the Supabase client version and add a Content Security Policy".

---

### Task 13: Database hardening (F10)

**Files:**
- Create: `migrations/2026-11-09-harden-costs.sql`
- Modify: `schema.sql`, `index.html` (amount and notes inputs), `README.md` (setup section)

- [ ] **Step 1: Write the migration** for existing projects:
```sql
-- Run once in the Supabase SQL editor. Safe to re-run.
drop policy if exists "Users can update their own costs" on public.costs;
create policy "Users can update their own costs"
  on public.costs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.costs drop constraint if exists costs_amount_positive;
alter table public.costs add constraint costs_amount_positive check (amount > 0) not valid;

alter table public.costs drop constraint if exists costs_notes_length;
alter table public.costs add constraint costs_notes_length check (notes is null or char_length(notes) <= 500) not valid;

create index if not exists costs_user_date_idx on public.costs (user_id, date desc);
```
  `not valid` means existing rows are not checked, so the migration cannot fail on old data; new and updated rows are checked.
- [ ] **Step 2: Bring `schema.sql` in line** for fresh installs: `check (amount > 0)` on `amount`, `check (notes is null or char_length(notes) <= 500)` on `notes`, the `with check` clause on the update policy, and the index.
- [ ] **Step 3: Match the form.** `#cost-amount`: `min="0.01" max="99999999.99"`. `#cost-notes`: `maxlength="500"`.
- [ ] **Step 4: README.** In "Set Up Supabase" add one line: existing projects run the files in `migrations/` in date order.
- [ ] **Step 5: Run the three global commands.** Expected: pass.
- [ ] **Step 6: USER ACTION (report it, do not do it):** run `migrations/2026-11-09-harden-costs.sql` in the Supabase SQL editor. Until then the client limits apply but the database does not enforce them.
- [ ] **Step 7: Commit** "Harden the costs table: update check, amount and notes limits, index".

---

### Task 14: Favicon, theme colour, web manifest (F18)

**Files:**
- Create: `icon.svg`, `manifest.webmanifest`
- Modify: `index.html` (`<head>`), `.github/workflows/ci.yml` (deploy copy step)

- [ ] **Step 1: `icon.svg`:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#12261f"/><rect x="13" y="19" width="38" height="27" rx="3" fill="#c8f23a"/><path d="M14 22l18 14 18-14" fill="none" stroke="#12261f" stroke-width="3" stroke-linejoin="round"/></svg>
```
- [ ] **Step 2: `manifest.webmanifest`:** `name` "Daily Cost Tracker", `short_name` "Daily Costs", `start_url` ".", `scope` ".", `display` "standalone", `background_color` "#eef1ec", `theme_color` "#12261f", `icons` one entry `{ "src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }`.
- [ ] **Step 3: Head tags:** `<link rel="icon" href="icon.svg" type="image/svg+xml">`, `<link rel="manifest" href="manifest.webmanifest">`, `<meta name="theme-color" content="#12261f">`.
- [ ] **Step 4: Deploy step.** The Pages job copies an explicit list. Change it to `mkdir _site && cp -r index.html icon.svg manifest.webmanifest css js _site/`. Without this both files 404 in production.
- [ ] **Step 5: Run the three global commands.** Expected: pass.
- [ ] **Step 6: Manual check.** The tab shows the envelope icon; DevTools Application, Manifest shows no errors; no CSP message for the manifest or icon.
- [ ] **Step 7: Commit** "Add favicon, theme colour and web manifest".

Not in scope: a service worker (offline caching of an authenticated app needs its own design) and a PNG `apple-touch-icon` (iOS ignores SVG there; needs an image asset from the user).

---

### Task 15: Documentation (F19)

**Files:**
- Modify: `DESIGN.md`, `README.md`, `PRODUCT.md`, `CHANGELOG.md`

- [ ] **Step 1: `DESIGN.md`.** Correct what no longer matches the code: wrap is 1280px; the work area is three columns (form, chart, history), two below 1020px, one below 760px; category chip with icon instead of "dot"; Sign Out lives in the profile menu (remove `button-signout` and the "Sign Out" button text); row actions are icon buttons (remove `button-danger`, add `icon-btn`); three stats; chart period chips; secondary (Cancel) button. Keep the named rules unchanged.
- [ ] **Step 2: `README.md`.** Rewrite "Features" to list what exists: edit, undo delete, day grouping, chart with period, CSV export, EN/ES, three stats. Add a "Tests" section with the three commands from Global Constraints.
- [ ] **Step 3: `PRODUCT.md`.** Update "Positioning" and "Operating Context" for three figures, edit, export.
- [ ] **Step 4: `CHANGELOG.md`.** Under `[Unreleased]`, add entries grouped as Added (edit, Today figure, chart period, CSV export, favicon and manifest, unit tests), Changed (passwords may contain symbols, icon row actions, translated auth errors), Fixed (F1 to F6 in plain words), Security (pinned client, CSP, database policy and limits). Name the USER ACTION (run the migration) and the USER NOTE (Supabase minimum password length).
- [ ] **Step 5: Run the three global commands.** Expected: pass.
- [ ] **Step 6: Commit** "Update design, product and readme docs and the changelog".

---

## Done means

- `node tests/check.mjs` and `node --test tests/*.test.mjs` pass locally and in CI.
- `js/app.js` contains no `onclick=`, `alert(`, `window.deleteCost` or `style="`, and its only `.toFixed(` is the one that fills the amount field in `startEdit`.
- Every manual check is either run and reported with its result, or reported as not run.
- The USER ACTION (running the migration) and the USER NOTE (Supabase minimum password length) are listed in the final report.
