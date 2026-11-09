# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Category buttons:** the category dropdown in the add-expense form is now six icon buttons (keyboard accessible, still required).
- **Date shortcuts:** "Today" and "Yesterday" buttons next to the date field.
- **Show/hide password** toggle on every password field.
- **Undo toast** after deleting an expense (replaces the browser confirmation); Undo restores the same row.
- **History grouped by day** with a daily subtotal (Today, Yesterday, dates) and sticky day headers.
- **Filter summary:** count and total for the current search and category filter.
- **Spanish translation and language switcher (EN | ES)**, remembered in the browser. Texts live in `js/i18n.js`; CI checks both languages have the same keys. Supabase's own error messages remain in English.
- **Category icons** in a colour chip in the history list and chart legend, plus the **spend-by-category donut chart**.
- **Edit an expense:** a pencil icon on each row loads it into the add form, which then offers Save and Cancel (Escape also cancels).
- **Today figure** beside This month and All time.
- **Chart period:** the category chart switches between this month (default) and all time.
- **CSV export** of the filtered expense list.
- **Favicon, theme colour and web manifest.**
- **Unit tests** for the money, date, validation and expense logic, run in CI (`node --test`).

### Changed
- The amount field is focused again after saving, ready for the next expense.
- The date field now defaults to the user's local today (it could show tomorrow in the evening before).
- **Passwords** may now contain symbols. The rule stays 4 to 16 characters with at least one letter and one number; sign-in no longer checks the format.
- **Row actions** are icon buttons (pencil, bin) instead of a "Delete" text button.
- **Sign-in and password errors** are shown in the selected language.
- **Category search** matches the translated category name.
- **Money** is summed in cents and shown with thousands separators.
- **Accessibility:** the auth tabs, profile menu, messages and the toast work with the keyboard and screen readers. On phones the history list scrolls with the page.

### Fixed
- **Totals and chart were wrong beyond 1,000 expenses;** expenses are now loaded in pages.
- **Double-clicking a submit button** could create duplicate entries; buttons are now disabled while their request runs.
- **Pressing Escape** anywhere moved focus to the profile button.
- **A slow load** could repaint the list after sign-out, and every token refresh reloaded all expenses.
- **A failed delete** showed a browser alert; it now shows a message in the toast.

### Security
- The Supabase client is pinned to an exact version.
- A Content Security Policy is added; no inline styles or handlers remain.
- **Database migration** `migrations/2026-11-09-harden-costs.sql`: the update policy gets a `with check`, amounts must be above zero, notes are limited to 500 characters, and an index is added.
- The password-reset link error no longer shows Supabase setup instructions to end users.

### Action needed from the project owner
- **Required:** in the Supabase SQL editor, run the pre-check query at the top of `migrations/2026-11-09-harden-costs.sql`, then run that file.
- **Optional:** Supabase has its own minimum password length setting (Authentication settings). If it is above 4, the server refuses passwords of 4 or 5 characters.

## [1.3.2] - 2026-11-06

### Changed
- **CD:** deploy now runs from the CI/CD workflow and waits for the checks (job `deploy` needs `check`). Requires Settings > Pages > Source = GitHub Actions. Only `index.html`, `css/` and `js/` are published.

## [1.3.1] - 2026-11-06

### Added
- **CI:** GitHub Actions workflow (`.github/workflows/ci.yml`) runs JS syntax checks and `tests/check.mjs` (every id used by `app.js` exists in `index.html`, no duplicate ids) on every push and pull request.

### Changed
- Account info and password reset are now separate pages.

## [1.3.0] - 2026-11-06

### Added
- **Profile menu:** round profile icon (email initial) in the top right with Account, Reset password and Sign Out. Sign Out moved into this menu.
- **Account page:** shows email, member-since date and last sign-in; "Back to expenses" returns to the dashboard.
- **In-app password reset:** current password is re-verified, new password is validated (4-16 letters and numbers, must differ from current and match confirmation), and other devices are signed out on success.
- "Email me a reset link" fallback on the account page for a forgotten current password.

## [1.2.0] - 2026-11-06

### Changed
- **Full visual redesign ("cash envelope" look)** across sign in/up, forgot password, set new password and the dashboard:
  - Deep green header band with the two totals, a six-colour category strip, and a single chartreuse primary action.
  - Archivo typeface (tabular numerals, wider cut for totals and the sign-in heading).
  - Each expense row shows its category colour; the Add Expense card gets a top bar in the selected category's colour.
  - Mobile: filter bar stacks on narrow screens, larger Delete tap targets on touch devices.
  - Page structure: `<h1>` brand heading, `<h2>` card titles; signed-in email shown on hover/title.
  - Behaviour, element ids and copy are unchanged; `js/app.js` only adds a `data-cat` attribute on rows and the card tint.

### Added
- `PRODUCT.md`, `DESIGN.md` and `.impeccable/` design context files, plus `.gitignore` entries for local tooling state.

## [1.1.3] - 2026-11-06

### Fixed
- **Password Reset Link Logged User In:**
  - Registered `onAuthStateChange` at load so the `PASSWORD_RECOVERY` event is no longer missed.
  - Added `recoveryMode` so the recovery session doesn't open the dashboard; the "Set New Password" form shows instead.
  - User is signed out after updating the password and must sign in with the new one.

## [1.1.2] - 2026-11-01

### Added
- **Documentation:**
  - Added Troubleshooting section in `README.md` covering Supabase email rate limits and how to manage them.

## [1.1.1] - 2026-11-01

### Fixed
- **Password Reset Error Handling:**
  - Added URL hash error parsing (`error_code`, `otp_expired`) in `initSession` to catch invalid or expired reset links and gracefully show an informative error message while returning to the login view.

## [1.1.0] - 2026-11-01

### Added
- **Password Reset Feature:**
  - Added "Forgot password?" link on the sign-in screen.
  - Added password reset email request view (`supabase.auth.resetPasswordForEmail`).
  - Added "Set New Password" view asking for new password and confirmation with validation.
  - Added explicit PKCE `token_hash` verification in `initSession` (`supabase.auth.verifyOtp`) for robust email link handling.
- **Documentation:**
  - Added Supabase URL Configuration and Redirect URLs setup guide in `README.md` for GitHub Pages deployment.

---

## [1.0.0] - 2026-10-31

### Added
- **Initial Release:**
  - Daily Cost Tracker web application.
  - Supabase authentication (Sign In / Sign Up) with email validation and password policy.
  - PostgreSQL database schema with Row Level Security (RLS) policies (`schema.sql`).
  - Expense logging, filtering by search and category, summary stats (Total spent & Monthly spent).
  - GitHub Pages deployment support.


