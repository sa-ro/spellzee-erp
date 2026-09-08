# References & Sources

## Official Documentation
- **next-intl official docs** — App Router-native i18n, Server Component message resolution, locale routing/middleware: https://next-intl.dev
- **i18next / react-i18next official docs** — catalog structure, namespaces, lazy loading, interpolation: https://www.i18next.com
- **FormatJS / ICU MessageFormat specification** — `plural`/`select` syntax used for pluralization and gendered messages: https://formatjs.io/docs/core-concepts/icu-syntax/
- **ECMA-402 (`Intl`) specification** — `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.Collator`, `Intl.PluralRules` behavior: https://tc39.es/ecma402/
- **W3C Internationalization (i18n) Activity** — RTL/logical CSS properties, `lang`/`dir` attribute guidance: https://www.w3.org/International/
- **WHATWG/Google — `hreflang` and locale URL structure guidance** — alternate-language link annotations for SEO: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/hreflang

## Widely-Recognized Community Standards
- **MDN — CSS Logical Properties** — reference for `margin-inline`, `padding-block`, and RTL-safe layout: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values
- **Mozilla L10n / Pontoon documentation on pseudo-localization** — rationale and practice for pseudo-localization testing: https://mozilla-l10n.github.io/localizer-documentation/tools/pontoon/
- **Crowdin / Lokalise documentation** — representative translation management system (TMS) workflows for extraction/sync tooling: https://crowdin.com/docs, https://docs.lokalise.com

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
