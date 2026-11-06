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
    fontSize: "clamp(1.75rem, 5vw, 2.75rem)"
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
  button-signout:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sm}"
    padding: "0.45rem 0.9rem"
  button-danger:
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "0.3rem 0.7rem"
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

The dashboard is an ink band (name, account, two large figures) closed by a six-segment category strip, over a two-column working area: add-expense form left, history right. Auth is a single centred card carrying the same strip across its top edge. Density is calm and compact; this is a tool used in seconds, right after spending.

**Key Characteristics:**
- Ink-green shell, pale ground, white working cards.
- One chartreuse primary action; six category hues used only as dots, a strip, and the form's top rule.
- Archivo throughout, tabular numerals everywhere, widened (112%) for the big figures and card titles.
- Flat and hairline-ruled; 4px corners; a single soft shadow on the add card and the auth card.

## Colors

A restrained green-neutral palette with one acid accent and a six-hue category set kept strictly separate from the UI chrome.

### Primary
- **Envelope Ink** (`ink`, #12261f): the top band, body text, button text, hover border on fields, caret.
- **Chartreuse Stamp** (`accent`, #c8f23a): the one primary button per view (Sign In, Add Expense, Send Reset Link, Update Password), text-selection highlight, text-link hover. Hover darkens to `accent-hover`.

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
- **Danger / OK** (`danger` #b3261e on `danger-bg` #fbe4e1; `ok` #176b3a on `ok-bg` #dcf1e2): messages and the Delete action.

### Named Rules
**The Envelope Rule.** Category hues mark category and nothing else: a dot, the strip, the form's top rule. Never a button, link, or status colour.
**The One Stamp Rule.** Chartreuse belongs to the single primary action of a view; it is never used as a background field or decoration.

## Typography

**Display Font:** Archivo (variable width and weight; fallback system-ui, Segoe UI, sans-serif)
**Body Font:** Archivo, same family
**Label/Mono Font:** none; numerals are tabular via `font-variant-numeric: tabular-nums` on body.

**Character:** One grotesque family doing all the work, widened and heavy for money figures, plain for everything else.

### Hierarchy
- **Display** (800, clamp(1.75rem, 5vw, 2.75rem), 1.1, width 112%): the Total and This Month figures.
- **Headline** (800, 1.6rem, width 112%): auth card titles. Dashboard name is 800 at 1.25rem.
- **Title** (700, 1.0625rem): card headings (Add Expense, Expense History); row amounts are 800 at the same size.
- **Body** (400, 1rem, 1.5): inputs and general copy; auth description 0.9375rem in muted text.
- **Label** (600, 0.8125rem): field labels, stat captions, dates, notes, Delete.

### Named Rules
**The Tabular Rule.** Every number sits in tabular figures so amounts align down the list.

## Layout

A 1100px centred `wrap` with 1.25rem side padding. Stats are a two-column grid divided by a hairline. The work area is a two-column grid (form column 280-340px, history fluid), 1.5rem gap, top-aligned. At 760px and below it collapses to one column; at 480px the filter bar stacks and the email truncates to 9rem. Spacing rhythm is rem-based: 0.35 / 0.75 / 1.1 / 1.25 / 1.5 / 2. History scrolls inside a 30rem list.

## Elevation & Depth

Flat by default; depth comes from white cards on the pale ground and hairline borders. The only shadows are one soft, low, ink-tinted drop under the add card and the auth card.

### Shadow Vocabulary
- **Card Lift** (`box-shadow: 0 10px 24px -14px rgba(18, 38, 31, 0.3)`): add card; the auth card uses `0 10px 24px -12px rgba(18, 38, 31, 0.28)`.
- **Field Focus Ring** (`box-shadow: 0 0 0 3px rgba(28, 109, 208, 0.28)`): focused fields.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat; no shadow on history cards, rows, or buttons.

## Shapes

One corner: 4px on cards, fields, buttons, messages (2px on category squares). Hairline 1px borders; two category-coloured rules: the 4px top border of the add card (follows the selected category) and the 6px six-segment strip on the band's lower edge and auth card top.

## Components

### Buttons
- **Shape:** 4px radius, 1px ink border, weight 700.
- **Primary:** chartreuse fill, ink text, full width, 0.75rem 1.25rem padding; hover `accent-hover`; active nudges 1px down.
- **Sign Out:** transparent on the band, on-ink text, muted border, hover fills `ink-raised`.
- **Delete:** borderless red text, 0.8125rem; hover fills `danger-bg`; 44px min height on coarse pointers.

### Inputs / Fields
- **Style:** white, 1px border #8fa196, 4px radius, 0.65rem 0.8rem padding. Hover border goes ink.
- **Focus:** border and 3px ring in focus blue.

### Cards / Containers
White, 1px hairline, 4px radius, 1.25rem padding. The add card carries the category top rule and card lift.

### Navigation
Auth Sign In / Sign Up tabs: transparent, muted text, 3px bottom rule that turns ink when active. Text links are bold ink with chartreuse hover fill.

### Expense Row
Category dot (0.7rem square, 2px radius) plus bold category name, muted date and notes indented beneath, right-aligned heavy amount, Delete. Hover fills `ground`.

### Messages
Error and success strips with tinted fill and matching text, 4px radius.

## Do's and Don'ts

### Do:
- **Do** use the six category hues only as dots, the strip, and the add card's top rule.
- **Do** keep chartreuse for the single primary action of a view.
- **Do** set every figure in tabular numerals; widen (112%) only large figures and card titles.
- **Do** keep surfaces flat with 1px `line` borders and 4px corners.
- **Do** keep a 3px focus-blue outline on all interactive elements.

### Don't:
- **Don't** return to white-cards-and-indigo-buttons SaaS styling or Inter (the old look, an anti-reference).
- **Don't** colour buttons, links, or messages with category hues.
- **Don't** add shadows to rows, buttons, or history cards.
