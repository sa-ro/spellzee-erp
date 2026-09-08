# Definition of Done — Search & Discovery

## 1. Setup
- [ ] A managed search service is used only where warranted (typo tolerance/ranking/faceting genuinely needed); a plain backend filter query used otherwise

## 2. Request Discipline
- [ ] Search input debounced
- [ ] Each new query cancels the previous in-flight request — no stale-result flashing

## 3. Result States
- [ ] Zero-result state is designed with next-step suggestions, not a blank area
- [ ] Loading state distinguishable from "no query" and "zero results"

## 4. Filters
- [ ] Facet options reflect actual available results for the current query/filter combination

## 5. Shareability
- [ ] Query and filter state reflected in the URL — shareable and back-button-correct

## 6. Accessibility
- [ ] Search input/autocomplete follows the ARIA combobox keyboard pattern
- [ ] Result count changes announced via an appropriately non-disruptive live region

## 7. Relevance & Sync
- [ ] Ranking/relevance configured deliberately for the content model, not left at raw defaults
- [ ] Search queries and zero-result queries are tracked for analytics
- [ ] Search index syncs with content changes promptly (published/unpublished/deleted state reflected)

## 8. Locale
- [ ] Multi-language content and query normalization handled correctly per `i18n-l10n`

## Sign-off
Only mark "search-discovery: done" once all sections are checked.
