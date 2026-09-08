# Data Visualization & Dashboards Rules

## Rule 1: Project-Detected Library, Recharts + TanStack Table as the Default
- Check for existing charting/table libraries and follow them. For a new precedent: Recharts for standard chart types (composable, sufficient performance for typical dashboard volumes); visx only for genuinely custom visualizations Recharts can't express. TanStack Table (headless) for data tables by default; AG Grid only when the requirement needs its heavier feature set (cell editing, pivot tables).

## Rule 2: Large Tables Are Virtualized
- A table rendering more rows than comfortably fit on screen (hundreds+) uses row virtualization (TanStack Virtual, or AG Grid's built-in virtualization) so only visible rows are in the DOM at once — rendering thousands of `<tr>` elements directly causes severe scroll jank and slow initial render, especially on the lower-end devices this product's teacher/admin users may also use.

## Rule 3: Server-Side Pagination/Filtering/Sorting for Large Datasets
- For a dataset that isn't small and fully manageable client-side (a school's full student roster, a semester's submission log), pagination, filtering, and sorting are performed server-side (the API returns only the requested page/filtered slice) — client-side pagination that first loads the entire dataset into the browser doesn't scale and wastes bandwidth on data the user never sees. Reserve client-side table operations for genuinely small, already-fully-loaded datasets (e.g. a single class's 30 students).

## Rule 4: Charts Have Real Loading, Empty, and Error States
- Every chart explicitly handles: data still loading (a skeleton/placeholder shaped like the eventual chart, not a blank area), no data available (a designed empty state with context — "No submissions yet" — not an empty/broken-looking chart canvas), and a fetch error (a retry affordance, not a chart silently rendering with zero/undefined values that looks like real data showing "0").

## Rule 5: Color Is Never the Only Signal
- Any chart encoding meaningful distinctions by color (a pass/fail bar chart, a status pie chart) also encodes the distinction through a second channel — pattern, label, icon, or position — so the chart remains interpretable for colorblind users, consistent with `accessibility`'s general non-color-dependent-signal rule. Use the palette guidance from the `dataviz` design skill for the actual color choices.

## Rule 6: Charts Have Accessible Data Alternatives
- Any chart conveying information meaningful to interpreting the dashboard (not purely decorative) has an accessible alternative — a toggleable data table view, a text summary of the key figures, or an `aria-label`/`role="img"` description summarizing the trend — so a screen reader user isn't excluded from information sighted users get from the visual chart alone.

## Rule 7: Aggregation Happens Server-Side for Large Datasets
- Computed aggregates (average completion rate per cohort, pass-rate trends over time) are computed server-side/in the data layer and returned as the values to display — never by shipping thousands of raw rows to the client and reducing them in a `useMemo` on every render, which duplicates the server's ability to do this once, efficiently, at the database layer.

## Rule 8: Dashboard Data-Fetching Follows `api-integration`'s Caching Rules
- Dashboard data (charts, tables) is fetched and cached using the project's established data-fetching layer (RTK Query, or equivalent) per `api-integration`'s caching/invalidation/staleness conventions — not a bespoke `setInterval` polling loop or ad hoc `fetch` call reinventing caching and refetch-on-focus behavior the existing layer already provides.

## Rule 9: Sensitive Dashboard Data Respects the Same Access Boundary as the API
- A dashboard showing student-level data (grades, personal progress, submission content) is gated by the same role/permission check as the underlying API per `auth-session-flows`'s server-enforcement rule — a teacher must only see data for their own students/courses, enforced server-side, not filtered client-side from a broader dataset the client was never authorized to receive in the first place.

## Rule 10: Interactive State Updates the URL Where Shareable
- Filter selections, date-range choices, and drill-down state that a user would reasonably want to bookmark or share (a specific cohort's filtered view, a specific date range) are reflected in the URL (query params) rather than held only in ephemeral component state — an admin should be able to share a link to "this exact filtered view" with a colleague.

## Rule 11: Number/Date Formatting Uses `Intl`
- Dashboard values (percentages, counts, dates, currency if relevant to a revenue dashboard) are formatted via `Intl.NumberFormat`/`Intl.DateTimeFormat` consistent with `i18n-l10n`'s formatting rule — not manually string-formatted, and not left unlocalized for admin users in a non-English-primary locale.

## Rule 12: Dashboard Performance Is Budgeted
- A dashboard combining multiple charts/tables doesn't block the page on synchronously rendering every widget — heavy individual widgets (a complex chart, a large table) are code-split/lazy-loaded and can show their own loading state independently, so one slow widget doesn't delay the whole dashboard's initial paint. Cross-references `performance-optimization`'s code-splitting discipline applied to dashboard composition specifically.
