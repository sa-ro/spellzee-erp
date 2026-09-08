# Definition of Done — Data Visualization & Dashboards

## 1. Setup
- [ ] Existing charting/table library convention detected and followed, or Recharts + TanStack Table used for a new precedent

## 2. Table Performance
- [ ] Large tables are virtualized, not rendering all rows into the DOM
- [ ] Pagination/filtering/sorting is server-side for genuinely large datasets

## 3. Chart States
- [ ] Loading, empty, and error states explicitly handled for every chart — no silent zero-looking-real render
- [ ] Aggregates computed server-side, not reduced client-side from raw rows

## 4. Accessibility
- [ ] Color is never the sole signal — a second channel (pattern/label/icon) present
- [ ] Every meaningful chart has an accessible data alternative (table view, text summary, or descriptive label)

## 5. Data & Access
- [ ] Dashboard fetching uses the project's established data layer (caching/staleness), not ad hoc polling
- [ ] Sensitive student-level data is access-controlled server-side, matching the API's authorization boundary

## 6. UX & Performance
- [ ] Shareable/bookmarkable filter and drill-down state reflected in the URL
- [ ] Numbers/dates formatted via `Intl`, consistent with `i18n-l10n`
- [ ] Heavy widgets code-split/lazy-loaded so one slow chart doesn't block the whole dashboard's paint

## Sign-off
Only mark "data-viz-dashboards: done" once all sections are checked.
