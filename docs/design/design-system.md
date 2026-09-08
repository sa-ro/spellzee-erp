# Spellzee ERP — Design System

> **STATUS: TEMPLATE.** Every value below is a `TBD` placeholder awaiting the Figma
> source. The **structure** is decided; the **values** are not. Do not treat any
> number, hex or font name here as a decision — nothing has been extracted yet.
>
> When the Figma link arrives: connect the Figma MCP (`get_design_context`,
> `get_variable_defs`, `get_screenshot`), extract the real tokens, and replace the
> `TBD` values in place. The token *names* should survive that swap — that is the
> point of filling them in now.

## Overview

Spellzee ERP is an **internal operations console**, not a marketing surface. That single
fact drives every decision below, and it is the reason this template does not simply
inherit a marketing design system.

Coordinators live in this product for a full working day. The screens are dense tables,
filter bars, allocation grids and forms. A design system tuned for a landing page —
96px section rhythm, 32px card padding, 16px body text — puts four rows on screen where
the job needs forty.

So the density baseline is deliberately tight, and generous whitespace is the exception
rather than the default.

**Key characteristics** *(to confirm against Figma)*:

- Canvas: `TBD` — light and dark both required; staff work long sessions.
- Brand accent: `TBD` — used scarcely, reserved for primary actions.
- Base font size: `TBD` (target 13–14px, not 16px — this is a data tool).
- Base unit: `TBD` (target 4px).
- Density: **compact by default**, comfortable as an opt-in user preference.

### What this system must carry that a marketing system does not

1. **Tables as a first-class component** — sort, resize, sticky headers, row selection,
   bulk actions, empty and loading states.
2. **Sixteen session statuses**, visually distinguishable and colourblind-safe. See
   Session Status Palette below — this is the hardest colour problem in the product.
3. **Dark mode**, not optional.
4. **Full form validation states** — the console is mostly forms.
5. **Governance surfaces** — maker–checker approval, audit trail, override banners.
   `/CLAUDE.md`'s north star is *nothing important happens invisibly*; the UI has to
   show that.

---

## Colors

> Fill from Figma variables (`get_variable_defs`). Keep the token names.

### Brand & Accent

| Token | Value | Use |
|---|---|---|
| `{colors.primary}` | `TBD` | Primary buttons, active nav, focus ring |
| `{colors.primary-hover}` | `TBD` | Hover |
| `{colors.primary-active}` | `TBD` | Press |
| `{colors.primary-subtle}` | `TBD` | Selected row tint, active tab background |
| `{colors.primary-disabled}` | `TBD` | Disabled primary |

### Surface — light

| Token | Value | Use |
|---|---|---|
| `{colors.canvas}` | `TBD` | Page floor |
| `{colors.surface}` | `TBD` | Cards, panels, table background |
| `{colors.surface-raised}` | `TBD` | Modals, dropdowns, popovers |
| `{colors.surface-sunken}` | `TBD` | Table header, toolbar, filter bar |
| `{colors.surface-hover}` | `TBD` | Row and menu-item hover |
| `{colors.surface-selected}` | `TBD` | Selected row — must survive alongside zebra striping |
| `{colors.surface-stripe}` | `TBD` | Zebra striping; very low contrast against `surface` |

### Surface — dark

Same token names under a `dark` theme. Not a filter over the light palette: dark surfaces
need their own contrast ladder, and inverted text needs a slightly warm off-white rather
than pure `#fff` to avoid halation on large dark areas.

| Token | Value |
|---|---|
| `{colors.dark.canvas}` | `TBD` |
| `{colors.dark.surface}` | `TBD` |
| `{colors.dark.surface-raised}` | `TBD` |
| `{colors.dark.surface-sunken}` | `TBD` |
| `{colors.dark.surface-hover}` | `TBD` |
| `{colors.dark.surface-selected}` | `TBD` |
| `{colors.dark.surface-stripe}` | `TBD` |

### Border

| Token | Value | Use |
|---|---|---|
| `{colors.border}` | `TBD` | Default 1px border |
| `{colors.border-strong}` | `TBD` | Emphasised dividers, table outer edge |
| `{colors.border-subtle}` | `TBD` | Table cell gridlines — the lightest line in the system |
| `{colors.border-focus}` | `TBD` | Focus ring; must pass 3:1 against adjacent surfaces |

### Text

| Token | Value | Use |
|---|---|---|
| `{colors.text}` | `TBD` | Primary text and table cells |
| `{colors.text-secondary}` | `TBD` | Labels, column headers |
| `{colors.text-muted}` | `TBD` | Timestamps, helper text, placeholders |
| `{colors.text-disabled}` | `TBD` | Disabled — must still be legible, not invisible |
| `{colors.text-on-primary}` | `TBD` | Text on brand fill |
| `{colors.text-link}` | `TBD` | Inline links |

### Semantic

| Token | Fill | Text | Border | Use |
|---|---|---|---|---|
| `{colors.success}` | `TBD` | `TBD` | `TBD` | Completed, approved, healthy |
| `{colors.warning}` | `TBD` | `TBD` | `TBD` | SLA approaching, needs attention |
| `{colors.danger}` | `TBD` | `TBD` | `TBD` | SLA breached, validation error, stalled |
| `{colors.info}` | `TBD` | `TBD` | `TBD` | Pending, informational |
| `{colors.neutral}` | `TBD` | `TBD` | `TBD` | Inactive, archived, not applicable |

Each semantic colour needs **three** values — a subtle fill for badge backgrounds, a text
colour readable on that fill, and a border. One hex per semantic is not enough for a
product that shows status in tables.

---

## Session Status Palette

The hardest colour problem here, and the one most likely to be got wrong.

`/CLAUDE.md` defines **sixteen** session outcomes. They appear side by side in dense
tables, so they must be distinguishable at a glance, at small size, and by users with
colour vision deficiency. Sixteen distinct hues is not achievable — the answer is
**colour grouped by meaning, plus a shape or icon that carries the distinction**.

Proposed grouping *(confirm against Figma; the grouping is the design decision, the
hexes are not yet extracted)*:

| Group | Statuses | Token |
|---|---|---|
| **Neutral / planned** | scheduled, reminded | `{status.planned}` = `TBD` |
| **Active** | live | `{status.live}` = `TBD` |
| **Positive** | completed, attended, compensation completed | `{status.positive}` = `TBD` |
| **Partial** | partial, late | `{status.partial}` = `TBD` |
| **Student-caused** | absent, late cancellation, student-side technical | `{status.student-fault}` = `TBD` |
| **Spellzee-caused** | teacher absent, teacher-side technical, Spellzee cancellation | `{status.our-fault}` = `TBD` |
| **Protected / rescheduled** | parent advance cancellation, rescheduled | `{status.protected}` = `TBD` |
| **Owed** | compensation required | `{status.owed}` = `TBD` |
| **Void** | cancelled / no-show | `{status.void}` = `TBD` |

**Rules that hold regardless of the hexes:**

- **Never colour alone.** Every status badge carries a label; icons distinguish statuses
  within a group. A colourblind coordinator must read the table without guessing.
- **The two fault groups must be clearly different**, because they carry different
  entitlement consequences — Spellzee-side failure protects the credit and triggers
  compensation; student-side follows a separate policy. If they look alike, the UI
  hides a financial distinction.
- **`compensation required` must stand out.** It is an obligation the business owes and
  it ages; it should read as an outstanding item, not a neutral state.

### Provisioning states

Separate from session status. From the Merithub integration's four-state machine:

| Token | State | Value |
|---|---|---|
| `{provisioning.pending}` | allocated locally, not yet upstream | `TBD` |
| `{provisioning.in-progress}` | worker attempting | `TBD` |
| `{provisioning.provisioned}` | upstream class exists | `TBD` |
| `{provisioning.stalled}` | attempt cap reached, needs a human | `TBD` |

`stalled` is a **product surface**, not a log line — it needs a screen, an owner and a
retry action. Give it visual weight accordingly.

---

## Typography

> Fill from Figma text styles. Sizes must be verified at real table density before
> being accepted.

### Font family

| Role | Family | Fallback stack |
|---|---|---|
| UI / body | `TBD` | `TBD` |
| Numeric / tabular | `TBD` | must support `font-variant-numeric: tabular-nums` |
| Mono | `TBD` | IDs, JSON payloads, audit diffs |

**Tabular numerals are required.** Session counts, entitlement balances and IDs sit in
columns; proportional digits make them ragged and hard to scan. If the chosen UI font
lacks a tabular variant, a separate numeric face is needed.

### Scale

Target a 13–14px base, not 16px. A landing page reads; this product scans.

| Token | Size | Weight | Line height | Use |
|---|---|---|---|---|
| `{type.display}` | `TBD` | `TBD` | `TBD` | Page titles — rare |
| `{type.heading-lg}` | `TBD` | `TBD` | `TBD` | Section headings |
| `{type.heading-md}` | `TBD` | `TBD` | `TBD` | Card and panel titles |
| `{type.heading-sm}` | `TBD` | `TBD` | `TBD` | Group labels |
| `{type.body}` | `TBD` | `TBD` | `TBD` | **Default — table cells, form values** |
| `{type.body-sm}` | `TBD` | `TBD` | `TBD` | Helper text, timestamps |
| `{type.label}` | `TBD` | `TBD` | `TBD` | Form labels, column headers |
| `{type.caption}` | `TBD` | `TBD` | `TBD` | Badges, fine print |
| `{type.mono}` | `TBD` | `TBD` | `TBD` | IDs, audit values |
| `{type.numeric}` | `TBD` | `TBD` | `TBD` | Tabular figures |

---

## Spacing

Base unit `TBD` (target 4px). Two scales, because a filter bar and a settings page have
different jobs.

### Compact — the default

| Token | Value | Use |
|---|---|---|
| `{space.0}` … `{space.6}` | `TBD` | 0 / 2 / 4 / 8 / 12 / 16 / 24 target progression |
| `{space.cell-x}` | `TBD` | Table cell horizontal padding |
| `{space.cell-y}` | `TBD` | Table cell vertical padding |
| `{space.card}` | `TBD` | Card padding — target 12–16px, **not** 32px |
| `{space.section}` | `TBD` | Between sections — target 24–32px, **not** 96px |

### Comfortable — opt-in

A user-level density preference. Multiplies vertical padding only; horizontal rhythm and
type sizes stay fixed so column widths do not reflow between modes.

| Token | Value |
|---|---|
| `{space.comfortable-multiplier}` | `TBD` (target ~1.5×) |

---

## Layout

| Token | Value | Notes |
|---|---|---|
| `{layout.sidebar-width}` | `TBD` | Module navigation |
| `{layout.sidebar-collapsed}` | `TBD` | Icon-only |
| `{layout.topbar-height}` | `TBD` | Target ≤ 48px — vertical space is scarce |
| `{layout.content-max}` | `TBD` | **Tables should not be capped**; forms should |
| `{layout.drawer-width}` | `TBD` | Detail drawer over a list |
| `{layout.modal-width-sm/md/lg}` | `TBD` | |

Console layout is a fixed shell — sidebar plus topbar — with the content area scrolling
independently. Table headers stick; the toolbar sticks.

---

## Shape & Elevation

| Token | Value | Use |
|---|---|---|
| `{radius.sm}` | `TBD` | Badges, chips, checkboxes |
| `{radius.md}` | `TBD` | Buttons, inputs, dropdowns |
| `{radius.lg}` | `TBD` | Cards, panels |
| `{radius.full}` | `9999px` | Avatars, status dots |

| Token | Value | Use |
|---|---|---|
| `{shadow.none}` | — | Tables, inline content — borders do the work |
| `{shadow.sm}` | `TBD` | Dropdowns, popovers |
| `{shadow.md}` | `TBD` | Drawers, modals |
| `{shadow.focus}` | `TBD` | Focus ring |

Dense UI should lean on **borders, not shadows**. Shadows at table density create visual
noise; reserve them for genuinely floating layers.

---

## Components

Structure only. Each entry is filled in once the Figma source exists.

### Data table — the most important component in the product

| Token | Value |
|---|---|
| `{table.row-height-compact}` | `TBD` (target 32–36px) |
| `{table.row-height-comfortable}` | `TBD` |
| `{table.header-height}` | `TBD` |
| `{table.border}` | `{colors.border-subtle}` |

States: default · hover · **selected** · focus-within · disabled · error.
Selected must remain visible over a striped row and over hover.

Required parts: sticky header · sortable column with direction indicator · resizable
columns · row selection checkbox · bulk-action bar on selection · pagination footer ·
empty state · loading skeleton · error state · optional sticky first column.

### Buttons

`primary` · `secondary` · `ghost` · `danger` · `icon`.
Sizes `sm` / `md`; heights `TBD` (target 28px / 32px — not 40px).
States: default · hover · active · disabled · loading.

### Forms

`text-input` · `select` · `combobox` (needed for teacher and student search) ·
`date-picker` · `time-picker` · `textarea` · `checkbox` · `radio` · `toggle` ·
`search-input`.

States: default · hover · **focus** · **error** · **success** · disabled · read-only.
Every field needs a label, optional helper text, and an error slot that does not shift
layout when it appears.

### Status & feedback

`status-badge` (per the palette above) · `toast` · `inline-alert` · `banner` ·
`progress` · `skeleton` · `empty-state` · `tooltip`.

### Navigation & structure

`sidebar-nav` · `topbar` · `breadcrumb` · `tabs` · `filter-bar` · `filter-chip` ·
`pagination` · `drawer` · `modal` · `dropdown-menu` · `command-palette`.

### Governance — specific to this product

These have no equivalent in a marketing system and are not optional here:

- **`approval-request-card`** — maker–checker. Shows requester, action, old and new
  value, reason, and approve/reject. The requester must not see an enabled approve
  button on their own request.
- **`audit-trail-entry`** — who, what, why, old value, new value, when.
- **`override-banner`** — an authorised override was used; states who and why.
- **`stall-queue-row`** — what failed, since when, last error, retry action.
- **`policy-placeholder-badge`** — marks a value coming from a **placeholder** policy row
  awaiting a business decision. Staff must be able to tell a real threshold from a
  stand-in, or a placeholder silently becomes fact.
- **`entitlement-ledger-row`** — entry type, delta, reason, actor, policy version.
  Read-only by design: corrections are new rows, never edits.

---

## Accessibility

Non-negotiable, and independent of whatever values arrive from Figma:

- **Contrast** — 4.5:1 for body text, 3:1 for large text and UI boundaries. Verify
  status badge text against its own fill, not against the canvas.
- **Never colour alone.** Status carries a label; icons distinguish within a colour group.
- **Focus visible** on every interactive element, including table rows and cells.
- **Keyboard-complete** — the console must be operable without a mouse. Coordinators
  work at speed; arrow-key table navigation and shortcuts matter.
- **Touch targets** 44×44 where the console is used on tablets.

---

## Open — decide before `/ui-feature` runs

Recorded here so they are not settled by accident:

1. **Component library, data grid, query layer.** `/CLAUDE.md` calls this a deliberate
   day-one decision — retrofitting a table abstraction across forty screens is a real
   cost. Still open (see `docs/open-decisions.md`).
2. **Token format** — CSS custom properties, Tailwind config, or a theme object. Follows
   from (1).
3. **Is there an existing Spellzee brand?** If the company has brand colours and fonts,
   those come first and this template inherits them. If not, the palette is designed for
   the console rather than borrowed from a marketing site.
4. **Density default** — compact or comfortable out of the box.
5. **Dark mode** — system-following, manual toggle, or both.

## How to fill this in

1. Connect the Figma MCP: `claude mcp add figma-dev-mode-mcp-server --transport sse http://127.0.0.1:3845/sse`
   (needs the Figma desktop app with Dev Mode MCP enabled).
2. `get_variable_defs` → colour and spacing tokens.
3. `get_design_context` on representative frames → component specs.
4. Replace `TBD` in place, keeping token names.
5. Anything Figma does not cover — dark mode, the sixteen status colours, table states —
   is designed here and flagged as designed rather than extracted.
6. Verify contrast before accepting any value, especially status badges.
