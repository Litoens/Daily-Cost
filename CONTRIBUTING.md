# Contributing

Thanks for helping. This is a small app: vanilla JavaScript, no build step, no `package.json`.

## Branch and pull request flow

`main` is protected. You cannot push to it directly.

1. Create a branch from `main` (for example `fix-chart-label`).
2. Make your change and commit it.
3. Push the branch and open a pull request into `main`.
4. The status check `check` must pass before the pull request can be merged.
5. Merging to `main` deploys the site automatically.

Fill in the pull request template. Keep pull requests small and focused.

## Run the checks locally

You need Node 22 or newer. Run these from the project root. They are the same checks CI runs.

```bash
for f in js/*.js tests/*.mjs; do node --check "$f"; done
npx --yes eslint@9 .
node tests/check.mjs
node --test --experimental-test-coverage tests/*.test.mjs
node tests/budget.mjs
```

What they do:
- `node --check` checks JavaScript syntax.
- `npx --yes eslint@9 .` runs ESLint with the flat config in the repo.
- `tests/check.mjs` checks the HTML wiring and that both languages have the same texts.
- The unit tests use Node's built-in test runner and print a coverage report.
- `tests/budget.mjs` checks the size budget of the site files.

The accessibility smoke test (Playwright + axe, on the sign-in page) lives in `tests/e2e/` and runs in CI as the `e2e` job. To run it locally:

```bash
npm install --no-save --no-package-lock --prefix tests/e2e playwright@1.49.1 @axe-core/playwright@4.10.1
npx --yes playwright@1.49.1 install chromium   # or skip this and set PW_CHANNEL=chrome to use your installed Chrome
node tests/e2e/smoke.mjs
```

If a command here and `ci.yml` ever differ, `ci.yml` is right.

## Add a database migration

The database is changed by hand in the Supabase SQL editor. Every change needs both a migration and an updated schema.

1. Create `migrations/YYYY-MM-DD-short-name.sql`, using today's date.
2. Start the file with a header comment. Say it is safe to re-run, and add a pre-check query for old rows that could break the new rules. See `migrations/2026-11-09-harden-costs.sql` for an example.
3. Write the SQL so it can run twice (`if not exists`, `drop ... if exists`, and so on).
4. Update `schema.sql` so a brand new project gets the same result.
5. Say in the pull request that a migration must be applied, and apply it to production after merging. See [docs/operations.md](docs/operations.md).

## Bump the service worker cache version

`sw.js` caches the app shell. Requests are network-first, so online users always get the latest files; the cache is the offline copy. When you change or add a cached file (HTML, CSS, JS, icons, manifest), bump `CACHE_VERSION` in `sw.js` (for example `v1` to `v2`) and add new files to `SHELL` in the same pull request. `tests/check.mjs` fails if a JS module is missing from `SHELL`.

The service worker never caches Supabase data. You do not need to bump it for database-only changes.

## Release

Releases are tagged from `main`.

1. Add the new version to `CHANGELOG.md` and merge that in a pull request.
2. Update your local `main`: `git checkout main && git pull`.
3. Tag and push:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
4. Pushing a `v*` tag runs the release workflow, which creates a GitHub Release.

## Security

Do not report vulnerabilities in issues. See [SECURITY.md](SECURITY.md).
