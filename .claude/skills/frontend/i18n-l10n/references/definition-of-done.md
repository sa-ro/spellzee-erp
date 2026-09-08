# Definition of Done — Internationalization & Localization

An i18n/l10n feature cannot be marked "done" until every item below is checked.

## 1. Setup & Library
- [ ] Existing project's i18n library convention detected and followed (or next-intl/react-i18next used for a new precedent)
- [ ] Only one i18n system is active in the app — no parallel hand-rolled catalog

## 2. Strings & Keys
- [ ] No hardcoded user-facing strings — all routed through the i18n mechanism
- [ ] Keys represent full sentences/phrases; no runtime string concatenation for grammar
- [ ] Pluralization uses ICU MessageFormat `plural`, not manual count branching
- [ ] Interpolation used for dynamic values, not string-building

## 3. Formatting
- [ ] Dates/times formatted via `Intl.DateTimeFormat` (or the library's wrapper), never manual string construction
- [ ] Numbers/currency formatted via `Intl.NumberFormat` with the correct locale and currency code
- [ ] Dates/timestamps stored and transmitted as UTC/ISO 8601; locale formatting applied only at display

## 4. Routing & SEO
- [ ] Locale is present in the URL and is the source of truth after initial detection
- [ ] `hreflang`/`alternates.languages` set on publicly indexable multi-locale pages, with an `x-default` fallback

## 5. Server/Client Boundary & Performance
- [ ] Server Components resolve translations server-side, not from a client-shipped full catalog
- [ ] Message catalogs are namespaced and lazy-loaded per route/feature, not one monolithic bundle

## 6. RTL & Layout
- [ ] Logical CSS properties used for spacing/positioning (no hardcoded `left`/`right` where directionality matters)
- [ ] `dir` attribute set correctly for RTL locales; directional iconography mirrored

## 7. Sorting & Locale Correctness
- [ ] User-facing sorted lists use `Intl.Collator`, not default `.sort()`
- [ ] Missing translation keys fall back through an explicit chain — never render blank or a raw key

## 8. Accessibility
- [ ] `lang` attribute correct on `<html>` and on any inline foreign-language text

## 9. EdTech-Specific
- [ ] Course/lesson content translation goes through the CMS content-locale system, not the UI string catalog
- [ ] Timed-assessment deadlines are UTC-anchored on the server and displayed converted to each student's timezone

## 10. Fonts & Testing
- [ ] Font strategy accounts for the active locale's script (non-Latin scripts render correctly, not via silent system-font fallback)
- [ ] Pseudo-localization (or real translations) tested for layout truncation/overflow before release

## 11. Translation Workflow
- [ ] New/changed strings extracted via tooling and synced to the translation process — not manually hand-edited JSON in production workflow

## Sign-off
Only mark "i18n-l10n: done" once all sections are checked.
