---
name: i18n-l10n
description: Use this skill whenever the user is internationalizing or localizing a React/Next.js app — setting up a translation library, adding a new locale, handling pluralization/date/number/currency formatting, RTL layout, locale-based routing, or translating course/UI content for an EdTech product. Trigger for phrases like "add i18n", "support multiple languages", "translate this", "RTL support", "pluralization rules", "locale routing", "hreflang", "why is this string hardcoded", or any request involving next-intl, react-i18next, FormatJS, or Intl APIs. Also trigger for Definition of Done review on an i18n/l10n feature, and whenever another skill's "route through the i18n mechanism" rule needs to actually be implemented.
---

# Internationalization & Localization Skill

Defines how the app is internationalized (i18n — architecture that supports multiple locales) and localized (l10n — actual translated content for a given locale), using a project-detected library with **next-intl** as the App Router-native default, plus EdTech-specific rules for course-content translation, timezone-sensitive assessments, and Indic-script rendering.

## Step 0: Detect Project Context Before Applying Any Rule

**Always do this first.**

**Existing project?**
- Check `package.json` for `next-intl`, `react-i18next`/`i18next`, `react-intl`/`formatjs`, or a custom catalog setup. Follow whatever is already established — don't introduce a second i18n library.

**New project / no precedent?**
- Default to **next-intl** for Next.js App Router projects (native Server Component support, no client-bundle catalog by default). Default to **react-i18next** for non-Next.js React apps.

**This skill is the owner of "route through the i18n mechanism"** — `component-architecture`, `form-handling-validation`, and `documentation-storybook` all defer the actual mechanism to this skill; don't re-derive it per-feature.

## When to use this
- Setting up i18n from scratch, or adding a new supported locale
- Any hardcoded UI string a reviewer flags ("route through i18n")
- Pluralization, date/time/number/currency formatting
- RTL layout support (Urdu, Arabic learner content)
- Locale-based routing, `hreflang`, locale-specific metadata
- Translating course content vs. translating UI chrome (these are different problems)
- Timezone handling for globally-distributed students, especially for timed assessments
- Reviewing a PR or running Definition of Done for an i18n/l10n feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Project-detected library, next-intl as the App Router default** — never a second i18n system in one app
2. **Full sentences as translation keys, never string concatenation** — grammar varies by language
3. **ICU MessageFormat for pluralization** — never manual `if (count === 1)` branching
4. **`Intl.DateTimeFormat`/`Intl.NumberFormat` for all date/number/currency display** — never manual formatting
5. **UTC/ISO 8601 in transit and storage, locale formatting only at display** — consistent with `api-integration` and `form-handling-validation`
6. **Locale segment in the URL (`/[locale]/...`)** — locale is routable and linkable, not just client state
7. **Server Components receive translations via the request locale, not a client-shipped catalog**
8. **Namespace and lazy-load message catalogs** — never one giant JSON bundle sent to every page
9. **RTL via logical CSS properties** (`margin-inline`, `padding-block`) — never hardcoded `left`/`right`
10. **`Intl.Collator` for locale-aware sorting** — never default string `.sort()` on user-facing lists
11. **Explicit fallback locale chain** — a missing key never renders blank or a raw key string
12. **`lang` attribute set correctly** on `<html>` and on any inline foreign-language span
13. **Course/content translation is a CMS/data problem, distinct from UI-string translation** — don't conflate the two systems
14. **Timezone-aware display, UTC-anchored deadlines (EdTech-critical)** — a timed assessment deadline is never interpreted in the wrong timezone
15. **Font loading accounts for the active locale's script** — cross-references `performance-optimization`'s font-subsetting rule
16. **Pseudo-localization used in testing** to catch layout truncation before real translations exist
17. **`hreflang` and locale-specific metadata for SEO** on any publicly indexable, locale-varying page
18. **Translation extraction/sync is tooling-driven**, not manual copy-paste into JSON files
19. **Currency and pricing are locale- and region-aware**, not just number-formatted
20. **Locale-aware numeric/date input** stays consistent with `form-handling-validation`'s Rule 14

## Workflow

1. **Step 0 first, always**: detect existing i18n library, or set next-intl (Next.js) / react-i18next (non-Next.js) as the standard.
2. Add the new locale to the routing config and message catalog structure before writing any translated strings.
3. Replace hardcoded strings with keyed messages, using full-sentence keys and ICU plural/select syntax where needed.
4. For EdTech content (course material, quiz text): confirm whether this is a UI-string translation or a CMS content-translation concern before choosing where the string lives.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs the i18n architecture and l10n formatting rules. For the actual accessible markup around locale/language changes, see `accessibility`. For date/number handling inside forms specifically, see `form-handling-validation`. For font strategy per script, see `performance-optimization`.
- Grounded in official next-intl, i18next, FormatJS/ICU MessageFormat, ECMA-402 (`Intl`), W3C Internationalization, and WHATWG `hreflang` documentation — see `references/sources.md`.
