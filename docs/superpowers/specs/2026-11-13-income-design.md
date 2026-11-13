# Income tracking: design

Date: 2026-11-13. Branch: to be cut from `category-details`.

## Intent

Today Daily Costs only records money going out. The owner gets one salary a month and sometimes a small extra payment. They want to record those, and when they open the app they want to see at a glance **how much they earned vs. how much they spent this month**, and what is left.

## Goals

- Record income entries (amount, date, source, optional note) next to expenses.
- The top band shows, for the current calendar month: **Earned**, **Spent**, **Left** (earned minus spent).
- Income entries can be listed, searched, filtered, edited, deleted (with Undo) and exported to CSV, the same way expenses can today.
- English and Spanish, like the rest of the app.

## Non-goals

- Budgets, savings goals, recurring or automatic salary entries.
- Income charts beyond the three totals (no income donut, no trend chart).
- Multiple currencies.
- Changing how expenses are entered, charted or listed.

## Anti-goals (would be a failure even if it works)

- The expense flow gets slower or more cluttered. Adding an expense must stay as quick as now: the form opens in Expense mode.
- Income amounts leak into the "Where it goes" donut or its totals.
- Breaking the "plain static host, no build step" setup (`PRODUCT.md`).
- Any change that lets one user see another's income (RLS must cover the new data).

## Decided with the owner

Layout chosen from browser mockups (A's layout with B's switch). Mockup: `.superpowers/brainstorm/580-1794577707/content/income-layout-v2.html`.

1. **Top band** shows three boxes: `Earned · <Month>`, `Spent · <Month>`, `Left`. These **replace** the current Today / This month / All time boxes. The owner accepted that Today and All time are no longer shown at the top.
2. **Left** is earned minus spent for the current month. Positive is shown in the accent/positive style, negative in the danger style, with an explicit sign (`+$1,137.60` / `-$84.20`).
3. **One add form** with an **Expense / Income** switch at the top. Expense mode is unchanged. Income mode swaps the six category chips for income sources, and the title and button read "Add Income".
4. **The donut** ("Where it goes") stays expenses only.
5. **Income list:** clicking the **Earned** box opens the existing side details panel showing income entries, with the same search, amount/date filters, edit, delete with Undo and CSV export. It works like clicking a donut slice does today.

## Builder's calls (made by Claude, not confirmed by the owner)

- **Sources:** two fixed values, stored as `Salary` and `Extra`, shown as "Salary" / "Extra income" (ES: "Sueldo" / "Ingreso extra"). They are a fixed list like the expense categories, with their own icons and one positive (green) colour.
- **Storage:** a **separate `public.income` table**, not a `kind` column on `costs`. Reason: every existing expense calculation (stats, donut, details, CSV) reads `costs` and would otherwise need a kind filter everywhere. A miss would mix income into spending. The separate table leaves expense code and data untouched. Shape mirrors `costs`: `id uuid pk default gen_random_uuid()`, `user_id uuid not null references auth.users on delete cascade`, `amount numeric(10,2) not null check (amount > 0)`, `source text not null check (source in ('Salary','Extra'))`, `date date not null default current_date`, `notes text check (null or ≤500 chars)`, `created_at timestamptz default now()`. RLS enabled with the same four `auth.uid() = user_id` policies (update with `using` + `with check`) and an index on `(user_id, date desc)`.
- **Migration:** a new file `migrations/2026-11-13-income.sql` (safe to re-run), and `schema.sql` updated so a fresh setup includes the table. **The owner must run the migration in the Supabase SQL editor** before the deployed app can use income. Until they do, the app must still work for expenses: a failed income fetch shows Earned and Left as "-" with no crash.
- **Data loading:** income is fetched alongside costs with the same paging helper (`fetchAllPages`) and the same stale-response guard, into its own cache.
- **Switch behaviour:** the switch is a two-option segmented control (radio semantics, keyboard accessible). Switching clears the selected category/source but keeps amount, date and notes. After adding, the form stays in the mode it was in. Editing an income row puts the form in Income mode, and while editing the switch is locked so a row can't change table.
- **Earned box as a button:** the Earned box becomes a real `<button>` (with `aria-pressed` and `aria-controls="history-panel"`). Clicking it again or using the panel's close button closes the panel. Opening income closes any open expense category, and the reverse.
- **Period for the income panel:** follows the donut's period chips (today / week / month / all) like the expense panel does, and the custom date filters override it, as today.
- **Income rows in the list:** amount shown with a leading `+` in the positive colour. The day subtotal and summary count only income.
- **CSV:** income export uses header `date,source,amount,notes`, file name `daily-income-YYYY-MM-DD.csv`, and the same BOM and formula-injection guard as `toCsv`.
- **Pure logic** (month totals for earned/spent/left, income CSV) goes in the flat no-DOM modules (`js/expenses.js` or a new `js/income.js`) with Node tests, following the existing pattern. `tests/check.mjs` keeps passing (every id `app.js` looks up exists in `index.html`).
- `.superpowers/` is added to `.gitignore`.

## Constraints

- Static ES modules, no build step, GitHub Pages. Supabase JS client pinned as now. CSP unchanged (same Supabase origin).
- Keep the existing visual language (`css/style.css` tokens, the ink band, the accent green). Works at phone width.
- Money handled in cents via `js/money.js`, as now.

## Left to the builder

Exact copy beyond the labels above, the icons for Salary/Extra, CSS details of the segmented switch and the clickable Earned box, and the test cases.

## How we'll check it

Run the existing Node tests and `tests/check.mjs`, then open the app locally (static server, per README), run the migration on Supabase, and check by eye: add a salary and an extra, see Earned/Spent/Left update, open the income list, edit, delete with Undo, export CSV, switch to ES, and check phone width.
