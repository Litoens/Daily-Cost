# Daily Cost Tracker

A secure, modern daily cost tracking web application powered by **Supabase** (PostgreSQL database + Authentication) and hosted for free on **GitHub Pages**.

---

## Features
- **Secure Authentication:** Sign up (with email validation and password requirements: 4–16 characters with letters & numbers), log in, and log out with secure session management and dynamic descriptive UI.
- **Private Data Storage:** PostgreSQL backend secured with Row Level Security (RLS) so users can only access their own expenses.
- **Daily Expense Logging:** Record daily costs (e.g. November 30, $20 on Meat) with category selection, dates, and notes.
- **Dashboard & Summary:** Real-time calculation of total spent and current month expenses, plus filtering and search capabilities.
- **Free Hosting:** Ready to be hosted on GitHub Pages.

---

## Setup & Deployment Guide

### 1. Set Up Supabase (Database & Auth)
1. Create a free account at [Supabase](https://supabase.com).
2. Create a new project.
3. Go to the **SQL Editor** in your Supabase dashboard and run the SQL script found in `schema.sql` to create the `costs` table and set up RLS security policies.
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
