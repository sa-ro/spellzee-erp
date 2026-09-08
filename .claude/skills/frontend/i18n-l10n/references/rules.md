# Internationalization & Localization Rules

## Rule 1: Project-Detected Library, next-intl as the App Router Default
- **Existing project**: check `package.json` for `next-intl`, `i18next`/`react-i18next`, `react-intl`/`formatjs`, or a bespoke catalog loader, and follow whatever is already established.
- **New project / no precedent**: default to **next-intl** for Next.js App Router (native Server Component message resolution, no client-bundle catalog required by default, built-in locale routing). Default to **react-i18next** for a non-Next.js React app.
- Never run two i18n systems in one app (e.g. next-intl for pages and a hand-rolled catalog for a widget) — this is how missing-key bugs and drift happen.

## Rule 2: Full Sentences as Keys, Never String Concatenation
- Translation keys represent whole sentences or phrases, never fragments joined at runtime (`t('you.have') + count + t('items')`) — word order, gendered nouns, and grammar rules differ across languages and concatenation breaks silently in most target locales.
- Use interpolation placeholders inside a single message (`t('cart.itemCount', { count })`), not string-building.

## Rule 3: ICU MessageFormat for Pluralization
- Pluralization uses the library's ICU MessageFormat `plural` syntax (`{count, plural, one {# item} other {# items}}`), never a manual `count === 1 ? 'item' : 'items'` branch — many languages (Arabic, Russian, Tamil) have plural categories that don't map to English's singular/plural binary.
- The same applies to `select`/gendered message variants where the target locale requires them.

## Rule 4: `Intl` APIs for All Date, Number, and Currency Display
- Dates render via `Intl.DateTimeFormat` (or the i18n library's wrapper around it, e.g. next-intl's `useFormatter`), numbers via `Intl.NumberFormat`, currency via `Intl.NumberFormat` with `style: 'currency'` — never manual string formatting (`date.getMonth() + '/' + date.getDate()`) that hardcodes a locale's conventions.
- Numeric grouping/decimal separators are locale-dependent even within one country's user base — never assume one separator convention is universal.

## Rule 5: UTC/ISO 8601 in Transit and Storage, Locale Formatting Only at Display
- All dates and timestamps are stored and transmitted as UTC/ISO 8601 (consistent with `api-integration`'s and `form-handling-validation`'s date rules) — locale-specific formatting happens exclusively at the final display step via `Intl.DateTimeFormat`, never baked into stored or transmitted data.

## Rule 6: Locale Segment in the URL
- The active locale is part of the route (`/[locale]/courses/...`), not only client-side state (context/cookie) — a locale must be linkable, bookmarkable, and crawlable. Middleware handles locale detection/redirect on first visit (`Accept-Language`, then a persisted user preference), but the URL remains the source of truth afterward.

## Rule 7: Server Components Resolve Translations Server-Side
- Server Components receive translated strings via the request's resolved locale (e.g. next-intl's server-side `getTranslations`), not by shipping the full message catalog to the client and looking it up in the browser.
- Client Components that need translations receive only the specific namespace/messages they use, passed down or loaded via the library's client provider scoped to that namespace — never the entire app's catalog.

## Rule 8: Namespace and Lazy-Load Message Catalogs
- Message catalogs are split by feature/route namespace (`common.json`, `courses.json`, `assessment.json`), not one monolithic `en.json` covering the whole app — each page/route loads only the namespaces it needs.
- This is the i18n-specific application of `performance-optimization`'s code-splitting discipline: a student on the dashboard shouldn't download the checkout-flow's translation strings.

## Rule 9: RTL via Logical CSS Properties
- Layout spacing and positioning use logical properties (`margin-inline-start`, `padding-block`, `inset-inline-end`) instead of physical ones (`margin-left`, `padding-top` used directionally, `right`) so RTL locales (Urdu-medium content, Arabic) flip correctly without a parallel RTL stylesheet.
- The `dir` attribute is set on `<html>` (or a scoped container) based on the active locale's directionality, and iconography/directional affordances (back arrows, progress bars) are mirrored appropriately — text-only mirroring is not sufficient.

## Rule 10: `Intl.Collator` for Locale-Aware Sorting
- User-facing sorted lists (student names, course titles) sort via `Intl.Collator` configured for the active locale, not JavaScript's default `.sort()` (which sorts by UTF-16 code unit and produces wrong ordering for accented characters and non-Latin scripts like Tamil or Devanagari).

## Rule 11: Explicit Fallback Locale Chain
- A missing translation key never renders blank, `undefined`, or the raw key string to the user — the library is configured with an explicit fallback chain (e.g. regional variant → base language → default locale), and missing-key events are logged/monitored in non-production environments to catch gaps before release.

## Rule 12: Correct `lang` Attribute Usage
- `<html lang="...">` reflects the active locale; any inline span of text in a different language than the surrounding page (a quoted phrase, a proper noun) gets its own `lang` attribute — this is both an accessibility requirement (screen readers switch pronunciation) and an SEO signal, cross-referencing the `accessibility` skill.

## Rule 13: Course Content Translation Is a Separate System from UI Translation
- Translating UI chrome (buttons, labels, error messages) uses the i18n library's message catalog. Translating actual course/lesson content (long-form text, video captions, quiz questions authored by instructors) is a CMS/content-versioning concern — it lives in the content data model with a `locale` field per content version, not shoehorned into the UI translation catalog.
- Don't route long-form instructor-authored content through `t()` calls meant for short UI strings — this doesn't scale and conflates two different translation workflows (engineering-owned vs. content-team-owned).

## Rule 14: Timezone-Aware Display, UTC-Anchored Deadlines (EdTech-Critical)
- Any deadline, timed-assessment window, or scheduled live session is stored and enforced in UTC on the server, and displayed to each student converted to their detected/selected local timezone via `Intl.DateTimeFormat` with a `timeZone` option — never displayed as a raw server-local time.
- This directly supports `form-handling-validation`'s Rule 18 (server-enforced timed-assessment expiry) — the server's enforcement clock and the student's displayed countdown must both derive from the same UTC deadline, not two independently computed times.

## Rule 15: Font Loading Accounts for the Active Locale's Script
- When the active locale requires a non-Latin script (Tamil, Devanagari, Arabic), the font-loading strategy serves the correct subsetted font for that script rather than falling back to a system font that may render poorly or not at all — cross-references `performance-optimization`'s font-subsetting rule, which this skill triggers based on locale rather than assuming one script for the whole app.

## Rule 16: Pseudo-Localization in Testing
- Before real translations exist for a new locale/string, pseudo-localization (e.g. `[Ṽäřǐåb̂l̂ë Ëx̂ǎm̂p̂l̂ë!!!]`, expanded ~30-50% in length) is used in a test/staging build to catch UI truncation, overflow, and hardcoded-width layout bugs early — don't wait for real translations to discover that a button label overflows in German or Tamil.

## Rule 17: `hreflang` and Locale-Specific Metadata for SEO
- Any publicly indexable page available in multiple locales sets `hreflang` alternate links (or Next.js App Router's `alternates.languages` in `generateMetadata`) pointing to each locale's URL, plus an `x-default` fallback — cross-references SEO/metadata concerns; don't ship a multi-locale marketing/course-catalog page without this.

## Rule 18: Translation Extraction/Sync Is Tooling-Driven
- New or changed source strings are extracted via the library's CLI/build-time tooling (not manually copy-pasted into JSON files) and synced with a translation management system (e.g. Crowdin, Lokalise) or a defined handoff process to translators — manual JSON editing by engineers is acceptable only for placeholder/dev-locale strings, never as the production translation workflow.

## Rule 19: Currency and Pricing Are Locale- and Region-Aware
- Prices display via `Intl.NumberFormat` with the correct `currency` code for the user's region, not just their language locale (a Tamil-speaking user in India and a Tamil-speaking user elsewhere may see different currencies) — currency and language are configured as independent, not coupled, settings.

## Rule 20: Locale-Aware Numeric/Date Input Stays Consistent with Forms
- Numeric and date input fields follow `form-handling-validation`'s Rule 14 exactly (transmit UTC/ISO 8601 and `valueAsNumber`, display in locale format) — this skill doesn't redefine that behavior, only supplies the `Intl` formatting layer it depends on.
