---
name: search-discovery
description: Use this skill whenever the user is building search UI, filters, faceted browsing, or course/content discovery — instant search-as-you-type, catalog filtering, autocomplete, or "no results" handling. Trigger for phrases like "add search", "instant search", "filter these courses", "faceted search", "autocomplete", "search is slow", "no results found", "Algolia", "Meilisearch", "typo tolerance", or any request involving search UX or catalog discovery. Also trigger for Definition of Done review on a search/discovery feature.
---

# Search & Discovery Skill

Defines search and catalog-discovery UX — instant search, filters/facets, autocomplete, and result-state handling — for course/content discovery, distinct from a generic API list-fetching concern already owned by `api-integration`.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `algoliasearch`/`react-instantsearch`, `meilisearch`/`@meilisearch/instant-meilisearch`, `@elastic/*`, or a custom backend-search integration. Follow whatever is already established.

**New project / no precedent?**
- Default to a **managed search service** (Algolia or Meilisearch) once search needs go beyond basic filtering — typo tolerance, ranking, faceting, and sub-100ms instant search are hard to replicate well with a plain database query. For simple exact-match filtering over a small dataset, a backend query (per `api-integration`) is sufficient and a dedicated search service is unneeded complexity.

## When to use this
- Building instant/as-you-type search for course/content discovery
- Building filter/facet UI (category, level, price, language) for a catalog
- Building autocomplete/typeahead suggestions
- Handling zero-result states and search-result ranking relevance
- Reviewing a PR or Definition of Done for a search/discovery feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Managed search service once needs exceed basic filtering** — never a hand-rolled full-text ranking implementation
2. **Search input is debounced**, consistent with the shared debounce discipline across `api-integration`/`form-handling-validation`
3. **Every keystroke-triggered request is cancelable** — a stale response for an earlier query must never overwrite a newer one
4. **Zero-result states are designed, not a blank list** — suggest alternate spelling, broader filters, or related content
5. **Filters/facets reflect actual available results**, not static options that can produce a zero-result dead end
6. **Search and filter state live in the URL** — shareable, bookmarkable, back-button-correct
7. **Search input and results are keyboard-navigable and screen-reader-announced** — cross-references `accessibility`
8. **Search relevance/ranking is tuned deliberately** (boost fields, typo tolerance settings), not left at raw defaults
9. **Search analytics are instrumented** — queries, zero-result queries, and click-through are tracked to improve relevance over time
10. **Locale-aware search** — cross-references `i18n-l10n` for multi-language content and query normalization
11. **Search index updates stay in sync with content changes** — no stale/deleted content appearing in results

## Workflow

1. **Step 0 first, always**: confirm whether a managed search service is warranted, or a backend filter query suffices.
2. Debounce and cancel in-flight search requests before building result rendering.
3. Design zero-result and loading states before wiring the real index.
4. Sync search/filter state to the URL.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs search/discovery UX and relevance. For general list-fetching/pagination of a non-search catalog view, see `api-integration`. For debounce/cancellation discipline shared across the app, this skill applies the same principle already established there.
- Grounded in official Algolia, Meilisearch, and W3C ARIA combobox/search-pattern documentation — see `references/sources.md`.
