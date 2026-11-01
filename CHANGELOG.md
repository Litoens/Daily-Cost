# Changelog

All notable changes to this project will be documented in this file.

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
