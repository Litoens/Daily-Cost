---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["css/style.css","js/app.js"]
---

# Surface: Daily Cost Tracker (sign in, reset password, dashboard)

Mode: Operate. Visitor: one person logging personal expenses, quickly. Task: add an expense, read two totals, find/delete past rows. Redesign: old indigo/Inter look is the anti-reference; function, ids and copy preserved.

Assumptions (user declined the question dialog; unattended): scope is all screens; categories and behavior untouched; no new features.

## Direction contract

THESIS: A cash-envelope system. Six categories are six colored envelopes; colour is the filing system, not decoration. Refuses the white-cards-and-indigo-buttons SaaS default.
OWN-WORLD: Deep envelope-green ink shell (#12261F) over a cool pale ground (#EEF1EC); chartreuse (#C8F23A) for the one primary action; six category hues (tomato, amber, blue, violet, pink, slate) used only as tabs/dots; Archivo, tabular numerals; flat, hairline-ruled, 4px radius, soft low shadow only on the add card.
STORY: Visitor sees what they have spent, logs the next expense without thinking, trusts the list.
FIRST VIEWPORT: Ink-green top bar (name left, email + Sign Out right) with a six-segment category strip along its lower edge; below it two large tabular figures (Total, This month) on the ink band; then add-expense form left and history right, form fields visible without scrolling at 1440x900. Primary action (Add Expense, chartreuse) sits at the foot of the form. Auth: single column card centered on the ground, same six-segment strip across its top edge.
FORM: assigned candidate 3 of my list (cash-envelope system); seed: 3ac837e0d3434a12.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
