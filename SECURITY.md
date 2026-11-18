# Security Policy

## Supported version

Only the latest code on `main` is supported. That is what is deployed to GitHub Pages. Older tags get no fixes.

## Reporting a vulnerability

Do not open a public issue for a security problem.

Report it privately instead:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability** (GitHub private vulnerability reporting).
3. Describe what you found, how to reproduce it, and what it could affect.

You can expect a first reply within a few days. Once a fix is merged and deployed, the advisory can be published.

## In scope

- The web app in this repository (`index.html`, `js/`, `css/`, `sw.js`).
- The database schema and Row Level Security policies in `schema.sql` and `migrations/`. For example: reading, changing or deleting another user's expenses or income.
- The CI/CD workflows in `.github/workflows/`. For example: leaking secrets or letting a pull request deploy.

## Out of scope

- Vulnerabilities in Supabase, GitHub or GitHub Pages themselves. Report those to the vendor.
- Rate limits on Supabase Auth emails.
- Attacks that need a device or browser the user has already compromised.
- Automated scanner output with no working exploit.

## The Supabase key in the code is public

`js/supabaseClient.js` contains the Supabase project URL and the anon (publishable) key. This is by design. Every browser that opens the app receives them, so they cannot be secret.

The data is protected by Row Level Security on the `costs` and `income` tables, not by hiding the key. A report that only says "the anon key is visible" is not a vulnerability. A report showing that RLS lets one user reach another user's rows is.

Never commit a Supabase `service_role` key or a database password. Secret scanning with push protection is enabled on this repository.
