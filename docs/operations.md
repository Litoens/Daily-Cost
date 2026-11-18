# Operations runbook

How the app runs, how to roll it back, and how to protect the data.

## Architecture

- **Frontend:** static files (HTML, CSS, vanilla JS). No build step. Served by GitHub Pages at `https://litoens.github.io/Daily-Cost/`.
- **Backend:** Supabase. Postgres for data, Supabase Auth for sign-in. The browser talks to Supabase directly with the public anon key.
- **Security model:** Row Level Security on `costs` and `income`. Each user only sees their own rows.
- **Offline shell:** `sw.js` caches the app shell. It never caches Supabase data.
- **No servers of our own.** Nothing to patch or restart.

## Deploy pipeline

Defined in `.github/workflows/ci.yml`. GitHub Pages build type is **GitHub Actions** (not "deploy from a branch").

1. A pull request runs the checks (job `check`, plus the `e2e` accessibility job). Nothing deploys.
2. After merge, a push to `main` runs the checks again.
3. If the checks pass, the `deploy` job copies the site files to `_site/` and publishes them with `actions/deploy-pages`.
4. The `smoke` job then curls the live URL (with retries) and fails if it is not HTTP 200 with the app title.
5. Check the run in the **Actions** tab. The deployed URL is shown on the `deploy` job.

Database changes are not part of this pipeline. They are applied by hand (see below).

## Rollback

### Option 1: revert on main (preferred)

Use this when a bad change reached `main`.

1. Find the bad commit or merged pull request.
2. Create a branch and revert it: `git revert <sha>` (for a merge commit: `git revert -m 1 <merge-sha>`).
3. Open a pull request, wait for `check` to pass, merge.
4. The push to `main` redeploys the reverted code automatically.
5. If the bad change touched a cached file, the revert must also bump the cache version in `sw.js`. Otherwise browsers may keep the old cached files. Use a new version number, not the old one.

If it is an emergency, an admin can bypass branch protection. Prefer the pull request when you can.

### Option 2: re-run an earlier deploy

Use this for a quick fix while you prepare a proper revert.

1. Go to **Actions** and open the **CI/CD** workflow.
2. Pick the last run on `main` that was green and deployed a good version.
3. Click **Re-run all jobs**.
4. The `deploy` job publishes that run's commit again.

Caveats:
- A re-run uses the commit of that run, so it overrides the newer version until the next push to `main`.
- Concurrent or newer runs can overwrite it. Do the revert in Option 1 straight after, or the next merge will redeploy the bad code.

### Database changes

A code rollback does not undo a migration. Migrations are written to be additive and safe to re-run. If a migration itself is the problem, write a new migration that fixes it. For data loss, see Backup and restore.

## Backup and restore

### What Supabase gives you

- **Free tier:** no automatic backups you can rely on for restore. Do not count on them.
- **Pro tier and up:** daily backups, with a limited retention window. Point-in-time recovery is a paid add-on.
- Check **Database > Backups** in the dashboard to see what your plan includes.
- Free projects are paused after a period of inactivity. Restore them from the dashboard before they are deleted.

So on the free tier, take your own backups.

### Take a backup with pg_dump

1. Install the PostgreSQL client tools (`pg_dump`, `psql`).
2. In the Supabase dashboard, go to **Connect** and copy the connection string. Use the **session pooler** string if your network has no IPv6. Put your database password in it.
3. Dump the app data:
   ```bash
   pg_dump "<connection-string>" --schema=public --no-owner --no-privileges -Fc -f backup-YYYY-MM-DD.dump
   ```
   This saves the `public` schema (the `costs` and `income` tables and their data).
4. Also dump the users if you want accounts kept: add `--schema=auth`. Restoring `auth` into another project can be tricky, so test it first.
5. Store the file somewhere private and off your machine. It contains user data. Never commit it.

Do this on a schedule (for example weekly) and before every risky migration.

### Restore

1. Create a new Supabase project, or use an empty database. Do not restore over live data without a second backup.
2. Run `schema.sql` in the SQL editor, or restore from the dump directly.
3. Restore data:
   ```bash
   pg_restore --no-owner --no-privileges --data-only --schema=public -d "<connection-string>" backup-YYYY-MM-DD.dump
   ```
4. Rows need matching users in `auth.users` (foreign key `user_id`). If the users are not in the target project, restore `auth` too, or the restore of `costs` and `income` fails.
5. Check row counts against the old database. Sign in and check the app.
6. If you restored to a new project, update the URL and key in `js/supabaseClient.js`, the `connect-src` in the CSP in `index.html`, and the Auth redirect URLs.

Test a restore at least once. A backup you have not restored is a guess.

## Apply migrations safely

1. Read the header comment of the migration file. Run its pre-check query first in the SQL editor.
2. If the pre-check returns rows, fix or delete them first.
3. Take a backup (see above) for anything that changes or drops data.
4. Paste the file into the **SQL Editor** and run it. Files are safe to re-run.
5. Test in the app: sign in, add, edit and delete an expense.
6. Apply migrations in date order. Apply a migration before merging code that depends on it, unless the code works without it. The order matters.
7. Make sure `schema.sql` already includes the change.

---

## Not set up yet

Nothing below is configured. These are how-tos for later.

### Frontend error tracking (Sentry)

1. Create a Sentry project of type Browser JavaScript and copy the DSN.
2. Vendor the Sentry browser bundle into `js/vendor/` (the same way supabase-js is vendored), and load it with a script tag before the app scripts. Call `Sentry.init({ dsn: "..." })`.
3. Update the CSP in `index.html`: add the Sentry ingest host to `connect-src` (for example `https://*.ingest.sentry.io`). Without this the browser blocks the reports.
4. Add the new file to the service worker cache list and bump the cache version in `sw.js`.
5. Do not send user data. Keep amounts, notes and emails out of events. Check the size budget in `tests/budget.mjs`.

### Uptime monitoring

1. Create a free account at UptimeRobot or Better Stack.
2. Add an HTTP(s) monitor for `https://litoens.github.io/Daily-Cost/` with a 5-minute interval.
3. Optionally add a keyword check for text that appears on the page.
4. Add email or push alerts.
5. This only covers GitHub Pages. To watch Supabase, add a second monitor on your project URL's `/auth/v1/health` path.

### Separate dev and prod Supabase projects

1. Create a second Supabase project for development. Run `schema.sql` and the files in `migrations/` on it.
2. Set Auth redirect URLs on it for `http://localhost:8000/`.
3. Swap `SUPABASE_URL` and the key in `js/supabaseClient.js` locally when developing. Do not commit the dev values.
4. The CSP `connect-src` in `index.html` names the prod project. Allow the dev project URL too while developing, or the browser blocks the requests. Do not leave the dev host in the deployed CSP.
5. Better long term: read the URL and key from a small untracked config file, so the swap does not risk a commit.

### Automated DB migrations from CI

1. Install the Supabase CLI. Run `supabase init` and `supabase link --project-ref <ref>`.
2. The CLI expects `supabase/migrations/` with files named `<timestamp>_name.sql` (for example `20261113000000_income.sql`). The current `migrations/YYYY-MM-DD-name.sql` layout does not match, so the files need renaming or moving.
3. The old migrations were already applied by hand. Mark them as applied with `supabase migration repair --status applied <version>` before the first push, or the CLI tries to run them again.
4. Add GitHub secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, and the project ref.
5. Add a workflow step on push to `main`, after `check`, that runs `supabase db push`. Use a protected GitHub environment with a required reviewer so migrations are not applied unseen.
6. Keep taking backups. A bad migration will run automatically.

### PR preview deploys

GitHub Pages has no per-PR previews.

1. Use Cloudflare Pages or Netlify: connect the repository, set the output directory to the repo root (no build command), and enable deploy previews. Each pull request gets its own URL.
2. Add the preview URLs to Supabase **Authentication > URL Configuration > Redirect URLs**, using a wildcard pattern for the preview domain (for example `https://*-yourproject.pages.dev/**`). Without it, password reset links will not return to the preview.
3. The CSP does not need to change for Supabase, since the API host stays the same.
4. Previews would use the production database unless you also set up a dev project (see above). Be careful with test data.
