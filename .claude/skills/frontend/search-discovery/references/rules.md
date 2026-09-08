# Search & Discovery Rules

## Rule 1: Managed Search Service Once Needs Exceed Basic Filtering
- Once search requires typo tolerance, relevance ranking, faceting across multiple dimensions, or sub-100ms instant results, use a managed search service (Algolia, Meilisearch) rather than a hand-rolled `LIKE '%query%'` database query or a custom ranking implementation — these are genuinely hard problems already solved well by dedicated tools. For simple exact/prefix filtering over a small, fully-loaded dataset, a plain backend query per `api-integration` is sufficient and a search service is unneeded complexity.

## Rule 2: Search Input Is Debounced
- The search input debounces before firing a query (typically 200-300ms, faster than a general async-validation debounce since instant search feels expected to be fast) — consistent with the shared debounce discipline established across `api-integration`, `form-handling-validation`, and `performance-optimization`. Never fire a request on every single keystroke.

## Rule 3: Every Search Request Is Cancelable
- Each new query cancels the previous in-flight one (via `AbortController` or the search client's built-in request cancellation) — without this, a fast typist can see an earlier, slower-resolving query's results flash in after a newer query's results, showing results for a stale search term. This is the search-specific application of `api-integration`'s cancellation rule.

## Rule 4: Zero-Result States Are Designed
- A search returning no results shows a designed empty state — not a blank results area indistinguishable from "still loading" or "no query entered yet." The empty state suggests next steps where possible: a spelling correction ("Did you mean...?"), a prompt to broaden filters, or related/popular content — a dead-end blank screen loses the user at the exact moment they need the most help.

## Rule 5: Filters Reflect Actual Available Results
- Facet/filter options (category counts, available levels/languages) reflect what's actually available given the current query and other active filters — not a static list of every possible option regardless of whether selecting it would produce zero results. A search service's facet-count feature (returning result counts per facet value) is used to keep this accurate, rather than a filter UI that lets users combine filters into a guaranteed dead end without warning.

## Rule 6: Search and Filter State Lives in the URL
- The active query string and selected filters are reflected in the URL's query parameters — a user must be able to share a link to "courses filtered by Tamil, beginner level" or use the browser back button to return to a previous search state, not lose all context on navigation or refresh.

## Rule 7: Search Input and Results Are Keyboard-Navigable
- The search input and any autocomplete/suggestion dropdown follow the ARIA combobox pattern (arrow-key navigation through suggestions, `Enter` to select, `Escape` to dismiss, correct `aria-activedescendant`/`aria-expanded` state) — cross-references `accessibility`. Results updating live are announced appropriately (e.g. a polite live region reporting result count) without being disruptively verbose on every keystroke.

## Rule 8: Search Relevance Is Tuned Deliberately
- Ranking/relevance settings (which fields are searchable, field weighting/boosting — e.g. a course title should outrank a match only in its long description, typo-tolerance thresholds) are configured deliberately based on the actual content model, not left at the search service's raw defaults, which are a reasonable starting point but rarely optimal for a specific catalog's structure.

## Rule 9: Search Analytics Are Instrumented
- Search queries, zero-result queries specifically, and result click-through are tracked (via the search service's built-in analytics or the app's own event tracking) — a zero-result query log is one of the highest-value signals for improving a catalog's content/synonyms/relevance tuning over time, and is worthless if not captured.

## Rule 10: Locale-Aware Search
- Search handles multi-language content and query normalization correctly for the active locale (diacritic-insensitive matching, correct tokenization for non-space-delimited or agglutinative scripts where relevant) — cross-references `i18n-l10n`. A search index serving multiple locales' content is configured to rank same-locale results appropriately rather than mixing all languages' content with no locale preference.

## Rule 11: Search Index Stays in Sync with Content Changes
- The search index is kept in sync with the actual content state (a newly published course appears in search promptly; an unpublished/deleted course stops appearing) via an event-driven sync (webhook/queue on content change) rather than an infrequent full-reindex batch job as the only update mechanism — stale search results showing deleted or unpublished content is both confusing and, for unpublished/private content, a data-exposure concern.
