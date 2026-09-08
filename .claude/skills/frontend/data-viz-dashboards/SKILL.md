---
name: data-viz-dashboards
description: Use this skill whenever the user is building charts, analytics dashboards, or large data tables — teacher/admin progress dashboards, cohort performance charts, large sortable/filterable student lists, or KPI summary views. Trigger for phrases like "build a dashboard", "add a chart", "show student progress", "analytics view", "sortable table", "the table is slow with lots of rows", "Recharts", "TanStack Table", or any request involving charting libraries, large-dataset tables, or admin/teacher-facing analytics UI. Also trigger for Definition of Done review on a dashboard/data-viz feature.
---

# Data Visualization & Dashboards Skill

Defines how charts, large data tables, and admin/teacher analytics dashboards are built — library choice, large-dataset table performance, chart accessibility, and real-data-vs-loading-state discipline — for the teacher/admin-facing side of the EdTech product.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `recharts`, `visx`, `nivo`, `@tanstack/react-table`, `ag-grid-react`. Follow whatever is already established.

**New project / no precedent?**
- Default to **Recharts** for standard charts (line/bar/pie, composable React API, good-enough performance for typical dashboard data volumes). Reach for **visx** only when a chart needs bespoke/non-standard visualization Recharts can't express.
- Default to **TanStack Table** for data tables (headless, full control over rendering/virtualization) — reach for **AG Grid** only when the requirement genuinely needs its heavier feature set (Excel-like editing, pivoting).

## When to use this
- Building any chart (progress trends, cohort comparison, completion rates)
- Building a large sortable/filterable/paginated data table (student lists, submission logs)
- Building a teacher/admin dashboard combining multiple charts/KPI tiles
- Diagnosing a slow-rendering table or chart with a large dataset
- Reviewing a PR or Definition of Done for a dashboard/data-viz feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Project-detected charting/table library; Recharts + TanStack Table as the default**
2. **Large tables are virtualized**, never rendering thousands of DOM rows at once
3. **Server-side pagination/filtering/sorting for genuinely large datasets** — client-side only for small, fully-loaded sets
4. **Charts have a real loading, empty, and error state** — never a chart silently rendering with zero/undefined data
5. **Color is never the only signal** — cross-references `accessibility`'s color-contrast/non-color-dependent rule
6. **Charts have accessible data alternatives** — a table view or text summary for screen reader users
7. **Aggregation/computation happens server-side for large datasets**, not by shipping raw rows to the client to reduce
8. **Dashboard data-fetching follows `api-integration`'s caching/staleness rules**, not ad hoc polling
9. **Sensitive student data in a dashboard respects the same access-control boundary as the API** — cross-references `auth-session-flows`
10. **Chart/table interactions (drill-down, filter) update the URL** where shareable/bookmarkable state matters
11. **Number/date formatting in dashboards uses `Intl`**, consistent with `i18n-l10n`
12. **Dashboard performance is budgeted** — a heavy admin view doesn't block on every chart rendering synchronously

## Workflow

1. **Step 0 first, always**: detect existing charting/table library, or set Recharts + TanStack Table as the standard.
2. For any dataset beyond a small fixed size, decide server-side vs. client-side pagination/aggregation before building the UI.
3. Build loading/empty/error states for every chart and table before wiring real data.
4. Add an accessible data alternative for any chart conveying meaningful information.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs chart/table rendering and dashboard composition. For the data-fetching/caching layer feeding these views, see `api-integration` and `state-management`. For chart color accessibility, see `accessibility` and the `dataviz` design skill for visual/palette guidance. For access control on sensitive dashboard data, see `auth-session-flows`.
- Grounded in official Recharts, TanStack Table, and W3C WAI chart-accessibility documentation — see `references/sources.md`.
