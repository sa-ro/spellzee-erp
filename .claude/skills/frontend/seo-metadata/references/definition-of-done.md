# Definition of Done — SEO & Metadata

## 1. Setup
- [ ] Native Next.js Metadata API used (`generateMetadata`/static `metadata` export) — no manual `<head>` manipulation

## 2. Titles & Descriptions
- [ ] Page has a unique, descriptive `title` and `description` — not a shared site-wide default
- [ ] Dynamic route metadata derives from the actual fetched entity, not a static placeholder

## 3. Social Sharing
- [ ] `openGraph` and `twitter` metadata set with a real, entity-specific preview image where applicable
- [ ] OG image meets required dimensions and is verified with a social platform's link debugger

## 4. Structured Data
- [ ] JSON-LD present using the correct Schema.org type where applicable (`Course`, `Review`, `BreadcrumbList`)
- [ ] Structured data values match visible on-page content exactly
- [ ] Verified with Google's Rich Results Test

## 5. Indexing Control
- [ ] `robots` metadata deliberately set per route (indexable for public pages, `noindex` for authenticated-only pages)
- [ ] `sitemap.xml` generated dynamically from actual published content, excludes drafts/unpublished
- [ ] Canonical URL set explicitly for any page reachable via multiple URL variants

## 6. Privacy & Locale
- [ ] Metadata generation respects the same authorization/publish-status check as the page body — no leaking private content via title/description/OG image
- [ ] Metadata generated per active locale with `alternates.languages` set per `i18n-l10n`

## Sign-off
Only mark "seo-metadata: done" once all sections are checked.
