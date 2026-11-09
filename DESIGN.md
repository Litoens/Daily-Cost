---
name: Daily Cost Tracker
description: A cash-envelope ledger. Deep green ink, one chartreuse action, six colour-coded category envelopes.
colors:
  ink: "#12261f"
  ink-raised: "#1c3a30"
  on-ink: "#eaf1ec"
  on-ink-muted: "#a9c0b4"
  ground: "#eef1ec"
  surface: "#ffffff"
  text-muted: "#4a5c54"
  line: "#cdd6cf"
  accent: "#c8f23a"
  accent-hover: "#b6e01f"
  focus: "#1c6dd0"
  danger: "#b3261e"
  danger-bg: "#fbe4e1"
  ok: "#176b3a"
  ok-bg: "#dcf1e2"
  cat-meat: "#e4572e"
  cat-food: "#f2a900"
  cat-transport: "#2e86de"
  cat-utilities: "#7b5ea7"
  cat-fun: "#e0407b"
  cat-other: "#6b7a74"
typography:
  display:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(1.5rem, 3.4vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 800
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  sm: "4px"
  swatch: "2px"
  chip: "6px"
  pill: "999px"
spacing:
  xs: "0.35rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1.25rem"
  button-secondary-hover:
    backgroundColor: "{colors.ground}"
  icon-btn:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "0"
  icon-btn-hover:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
  icon-btn-danger-hover:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
  category-chip:
    backgroundColor: "{colors.cat-other}"
    textColor: "#ffffff"
    rounded: "{rounded.chip}"
  chip-btn:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.2rem 0.6rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 0.8rem"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "1.25rem"
  message-error:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "0.65rem 0.8rem"
---

# Design System: Daily Cost Tracker

## Overview

**Creative North Star: "The Cash Envelope"**

Money is filed, not decorated. Six categories are six coloured envelopes; the colour is the filing system and appears only where a row or form needs to say which envelope it belongs to. Everything else is deep envelope-green ink on a cool pale ground, flat and hairline-ruled, with exactly one loud thing per screen: the chartreuse action.

The dashboard is an ink band (name, language switch, profile menu, three large figures: Today, This Month, All time) closed by a six-segment category strip, over a three-column working area: add-expense form, category chart, history. Auth is a single centred card carrying the same strip across its top edge. Density is calm and compact; this is a tool used in seconds, right after spending.

**Key Characteristics:**
- Ink-green shell, pale ground, white working cards.
- One chartreuse primary action; six category hues used only as chips, a strip, and the form's top rule.
- Archivo throughout, tabular numerals everywhere, widened (112%) for the big figures and card titles.
- Flat and hairline-ruled; 4px corners; soft shadows only on the add card, the auth card, the profile menu and the toast.

## Colors

A restrained green-neutral palette with one acid accent and a six-hue category set kept strictly separate from the UI chrome.

### Primary
- **Envelope Ink** (`ink`, #12261f): the top band, body text, button text, hover border on fields, caret.
- **Chartreuse Stamp** (`accent`, #c8f23a): the one primary button per view (Sign In, Add Expense or Save, Send Reset Link, Update Password), text-selection highlight, text-link hover, the profile button, menu-item hover, the toast's Undo button and the active language on the band. Hover darkens to `accent-hover`.

### Secondary (category envelopes)
- **Tomato** (`cat-meat`, #e4572e): Meat & Groceries.
- **Amber** (`cat-food`, #f2a900): Food & Dining.
- **Blue** (`cat-transport`, #2e86de): Transport.
- **Violet** (`cat-utilities`, #7b5ea7): Utilities & Bills.
- **Pink** (`cat-fun`, #e0407b): Entertainment.
- **Slate** (`cat-other`, #6b7a74): Other and the unselected default.

### Neutral
- **Pale Ground** (`ground`, #eef1ec): page background, row hover.
- **Paper** (`surface`, #ffffff): cards and fields.
- **Raised Ink** (`ink-raised`, #1c3a30): hairlines and hover fill on the ink band.
- **On-Ink / On-Ink Muted** (`on-ink` #eaf1ec, `on-ink-muted` #a9c0b4): text on the band; muted for stat labels and email.
- **Muted Text** (`text-muted`, #4a5c54): secondary copy, dates, notes.
- **Hairline** (`line`, #cdd6cf): card borders, row dividers, tab rule.
- **Focus Blue** (`focus`, #1c6dd0): focus outline and field focus ring only.
- **Danger / OK** (`danger` #b3261e on `danger-bg` #fbe4e1; `ok` #176b3a on `ok-bg` #dcf1e2): messages and the hover of the bin icon button.

### Named Rules
**The Envelope Rule.** Category hues mark category and nothing else: a dot, the strip, the form's top rule. Never a button, link, or status colour.
**The One Stamp Rule.** Chartreuse belongs to the single primary action of a view; it is never used as a background field or decoration.

## Typography

**Display Font:** Archivo (variable width and weight; fallback system-ui, Segoe UI, sans-serif)
**Body Font:** Archivo, same family
**Label/Mono Font:** none; numerals are tabular via `font-variant-numeric: tabular-nums` on body.

**Character:** One grotesque family doing all the work, widened and heavy for money figures, plain for everything else.

### Hierarchy
- **Display** (800, clamp(1.75rem, 5vw, 2.75rem), 1.1, width 112%): the Today, This Month and All time figures (the third drops to 1.25rem below 760px).
- **Headline** (800, 1.6rem, width 112%): auth card titles. Dashboard name is 800 at 1.25rem.
- **Title** (700, 1.0625rem): card headings (Expense History, chart); the add-card heading is 800 at 1.375rem; row amounts are 800 at the same size.
- **Body** (400, 1rem, 1.5): inputs and general copy; auth description 0.9375rem in muted text.
- **Label** (600, 0.8125rem): field labels, stat captions, day headers, notes.

### Named Rules
**The Tabular Rule.** Every number sits in tabular figures so amounts align down the list.

## Layout

A 1280px centred `wrap` with 1.25rem side padding. Stats are a three-column grid (Today, This Month, All time) divided by hairlines. The work area is a three-column grid, 1.5rem gap, top-aligned: add-expense form (300-360px), category chart (260-300px), history (fluid). Below 1020px it becomes two columns (form and chart) with the history spanning the full row beneath; below 760px it is one column, the stats become two columns with All time on its own row, and the history list stops scrolling inside itself so it scrolls with the page. At 480px and below the filter bar stacks and the email truncates to 9rem. Spacing rhythm is rem-based: 0.35 / 0.75 / 1.1 / 1.25 / 1.5 / 2. Above 760px the history scrolls inside a 30rem list.

## Elevation & Depth

Flat by default; depth comes from white cards on the pale ground and hairline borders. The only shadows are soft, low, ink-tinted drops under the add card, the auth card, the profile menu and the toast.

### Shadow Vocabulary
- **Card Lift** (`box-shadow: 0 18px 36px -16px rgba(18, 38, 31, 0.5)`): add card; the auth card uses `0 10px 24px -12px rgba(18, 38, 31, 0.28)`, the profile menu `0 12px 28px -12px rgba(18, 38, 31, 0.45)`, the toast `0 14px 30px -12px rgba(18, 38, 31, 0.6)`.
- **Field Focus Ring** (`box-shadow: 0 0 0 3px rgba(28, 109, 208, 0.28)`): focused fields.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat; no shadow on history cards, rows, or buttons.

## Shapes

One corner: 4px on cards, fields, buttons, messages (6px on category chips, fully round on the small chip buttons). Hairline 1px borders, except the add card, which has a 2px ink border. Two category-coloured rules: the 6px top border of the add card (follows the selected category) and the 6px six-segment strip on the band's lower edge and auth card top.

## Components

### Buttons
- **Shape:** 4px radius, 1px ink border, weight 700.
- **Primary:** chartreuse fill, ink text, full width, 0.75rem 1.25rem padding; hover `accent-hover`; active nudges 1px down.
- **Secondary (Cancel):** same shape as primary but transparent; shown under the primary button while editing an expense; hover fills `ground`.
- **Icon button (`icon-btn`):** borderless 2.25rem square, muted icon, 4px radius; hover fills `ground`. The bin variant hovers to `danger-bg` with red icon. 44px on coarse pointers.
- **Chip button (`chip-btn`):** small pill with a 1px border, used for the date shortcuts and the chart period switch; the pressed one fills ink.

### Inputs / Fields
- **Style:** white, 1px border #8fa196, 4px radius, 0.65rem 0.8rem padding. Hover border goes ink.
- **Focus:** border and 3px ring in focus blue.

### Cards / Containers
White, 1px hairline, 4px radius, 1.25rem padding. The add card carries the category top rule and card lift.

### Navigation
Auth Sign In / Sign Up tabs: transparent, muted text, 3px bottom rule that turns ink when active. Sign Out lives in the profile menu (round profile button on the band; the menu also holds Account and Reset password). Text links are bold ink with chartreuse hover fill.

### Expense Row
Category chip (1.75rem square, 6px radius, solid category colour with a white outline icon; ink icon on amber) plus bold category name, muted notes indented beneath, right-aligned heavy amount, then pencil and bin icon buttons. Rows sit under sticky day headers with a daily subtotal. Hover fills `ground`; the row being edited keeps that fill.

### Messages
Error and success strips with tinted fill and matching text, 4px radius.

## Do's and Don'ts

### Do:
- **Do** use the six category hues only as chips, the strip, and the add card's top rule.
- **Do** keep chartreuse for the single primary action of a view.
- **Do** set every figure in tabular numerals; widen (112%) only large figures and card titles.
- **Do** keep surfaces flat with 1px `line` borders and 4px corners.
- **Do** keep a 3px focus-blue outline on all interactive elements.

### Don't:
- **Don't** return to white-cards-and-indigo-buttons SaaS styling or Inter (the old look, an anti-reference).
- **Don't** colour buttons, links, or messages with category hues.
- **Don't** add shadows to rows, buttons, or history cards.
