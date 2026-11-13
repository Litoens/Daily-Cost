# Daily Cost Tracker

A secure, modern daily cost tracking web application powered by **Supabase** (PostgreSQL database + Authentication) and hosted for free on **GitHub Pages**.

---

## Features
- **Secure Authentication:** Sign up (with email validation and password requirements: 4–16 characters with at least one letter and one number; symbols allowed), log in, and log out with secure session management and dynamic descriptive UI.
- **Private Data Storage:** PostgreSQL backend secured with Row Level Security (RLS) so users can only access their own expenses.
- **Daily Expense Logging:** Record daily costs (e.g. November 30, $20 on Meat) with category, date and notes. Edit an expense later with the pencil icon on its row (Save or Cancel in the same form), or delete it and undo the delete.
- **Dashboard & Summary:** Three figures (Today, This Month, All time), a category chart you can switch between this month and all time, and a history grouped by day with a daily subtotal.
- **Search, Filter & Export:** Search by category or notes, filter by category, and export the filtered list as a CSV file.
- **English and Spanish:** Switch language (EN | ES) at any time; the choice is remembered in the browser.
- **Free Hosting:** Ready to be hosted on GitHub Pages.

---

## Tests

There is no build step and no `package.json`; the tests use only Node's built-in test runner (Node 22 or newer). Run these from the project root, the same commands CI runs:

```bash
for f in js/*.js tests/*.mjs; do node --check "$f"; done
node tests/check.mjs
node --test tests/*.test.mjs
```

The first checks JavaScript syntax, the second checks the HTML wiring and that both languages have the same texts, the third runs the unit tests.

---

## Setup & Deployment Guide

### 1. Set Up Supabase (Database & Auth)
1. Create a free account at [Supabase](https://supabase.com).
2. Create a new project.
3. Go to the **SQL Editor** in your Supabase dashboard and run the SQL script found in `schema.sql` to create the `costs` and `income` tables and set up RLS security policies.
   - Existing projects: also run the files in `migrations/` in date order. Each migration file starts with a comment describing a check to run first.
4. Go to **Settings > API** in your Supabase dashboard and copy:
   - **Project URL**
   - **anon / public key**
5. **Configure Auth Redirect URLs:**
   - Go to **Authentication > URL Configuration** in your Supabase dashboard.
   - Set **Site URL** to your production URL (e.g., `https://litoens.github.io/Daily-Cost/`) or `http://localhost:8000` during local testing.
   - Under **Redirect URLs**, add your allowed app URLs (e.g., `https://litoens.github.io/Daily-Cost/` and `http://localhost:8000/` or `http://localhost:3000/`). This ensures password reset email links redirect to your live app correctly.

### 2. Configure Your App
Open `js/supabaseClient.js` and replace the placeholder values with your actual Supabase credentials:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Test Locally
You can test the app locally using any static file server, for example:
- **Python:** `python3 -m http.server 8000`
- **Node.js:** `npx serve`
Then open `http://localhost:8000` in your browser.

### 4. Push to GitHub & Deploy to GitHub Pages
1. Initialize git and commit your changes:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Daily Cost Tracker with Supabase"
   ```
2. Create a new repository on GitHub.
3. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
4. Enable GitHub Pages:
   - Go to your GitHub repository **Settings > Pages**.
   - Under **Build and deployment**, select `Deploy from a branch`.
   - Choose branch `main` and folder `/ (root)`, then click **Save**.
5. Your application will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`!

---

## Troubleshooting

### Email Rate Limits ("Exceeded Rate Limit")
Supabase has built-in email rate limits to prevent abuse (especially on the free tier), which can trigger an error if you request password reset emails too frequently for the same address.
- **Solution:** Wait for the cooldown period (usually 1 hour) or adjust the rate limits in your Supabase Dashboard under **Authentication > Rate Limits**. Alternatively, use a different test email address while developing.
