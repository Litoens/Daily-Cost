# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Existing: plain static HTML/CSS/JS (ES modules, no build step) on GitHub Pages, Supabase for auth and Postgres. Redesign stays within this stack. (Confirmed by the repository.)

## Users
*Inferred, not confirmed with the user.* One person logging their own everyday expenses (groceries, transport, bills) right after spending, on a phone or laptop. Each account sees only its own data.

## Product Purpose
Record a daily cost in a few seconds (date, amount, category, optional note), then see what has been spent in total and this month, with search and category filter to look back. Success: logging an expense is faster than forgetting it.

## Positioning
Single-purpose and private: one list, two numbers, no budgets, no charts, no sharing. Each user's rows are protected by Row Level Security.

## Operating Context
Sign in or sign up with email and a 4-16 character letters-and-numbers password. Forgot-password flow sends an email link that opens a Set New Password form, then returns to sign in. Dashboard: add-expense form, two summary figures, filterable history with delete.

## Capabilities and Constraints
- Categories (fixed): Meat & Groceries (stored "Meat"), Food & Dining, Transport, Utilities & Bills (stored "Utilities"), Entertainment, Other. Stored values must not change.
- Amounts displayed in dollars.
- Element ids and the module script in `index.html` are wired to `js/app.js`; markup may change, behavior must not.
- Redesign scope (inferred from "redo the whole page"): sign in/up, forgot password, set new password, and dashboard.

## Brand Commitments
Name "Daily Cost Tracker" / "Daily Costs". No logo or brand assets exist. No visual constraints stated by the user.

## Evidence on Hand
No testimonials, customers or metrics, and none should be invented.

## Product Principles
1. Entering an expense is the primary act; everything else supports it.
2. Show only what the user has actually spent; no invented advice or targets.
3. Stay private and calm: money data, no hype.
4. Keep working on a cheap phone and a plain static host.

## Accessibility & Inclusion
No specific standard stated; meet WCAG AA contrast and full keyboard use.
