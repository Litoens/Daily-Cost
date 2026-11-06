# Changelog

All notable changes to this project will be documented in this file.

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


