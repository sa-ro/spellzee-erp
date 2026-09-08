---
name: seo-metadata
description: Use this skill whenever the user is setting up metadata, Open Graph tags, structured data, sitemaps, or robots rules for a Next.js app — course/catalog pages needing discoverability, social share previews, or search-engine indexing. Trigger for phrases like "add SEO to this page", "generateMetadata", "Open Graph tags", "structured data", "sitemap.xml", "robots.txt", "why isn't this page indexed", "social share preview", or any request involving Next.js metadata API, JSON-LD, or search/social discoverability. Also trigger for Definition of Done review before a release of a publicly indexable page.
---

# SEO & Metadata Skill

Defines how Next.js App Router pages expose metadata for search engines and social platforms — `generateMetadata`, Open Graph/Twitter cards, JSON-LD structured data, sitemaps, and `robots` rules — so publicly indexable pages (course catalog, marketing pages) are actually discoverable.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check for an existing `app/sitemap.ts`, `app/robots.ts`, and how `generateMetadata` is currently structured (per-route vs. a shared metadata utility). Follow the established pattern.

**New project / no precedent?**
- Use the Next.js App Router **Metadata API** (`generateMetadata`, `app/sitemap.ts`, `app/robots.ts`) natively — this is the framework-native approach and should not be replaced with a manual `<head>`-injection library.

## When to use this
- Adding or reviewing metadata on any publicly indexable page (course pages, marketing pages, blog/help content)
- Setting up Open Graph/Twitter card previews for social sharing
- Adding structured data (JSON-LD) for rich search results (course listings, ratings, breadcrumbs)
- Building or reviewing `sitemap.xml`/`robots.txt`
- Diagnosing why a page isn't indexed or is showing a wrong preview
- Reviewing a PR or running Definition of Done before releasing a publicly indexable page

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Use the Next.js Metadata API natively** — `generateMetadata`, not manual `<head>` manipulation
2. **Every publicly indexable page has a unique, descriptive `title` and `description`** — never a shared default across all pages
3. **Dynamic routes generate metadata from the actual content**, not a static placeholder
4. **Open Graph and Twitter card tags are set on every shareable page**, with a real preview image
5. **Structured data (JSON-LD) matches Schema.org types relevant to EdTech** (`Course`, `Review`, `BreadcrumbList`)
6. **`robots` metadata is deliberate per page** — student dashboards and private content are excluded, marketing/catalog pages are included
7. **`sitemap.xml` is generated dynamically from actual routes/content**, not hand-maintained
8. **Canonical URLs are set explicitly**, especially for paginated or filter-parameter routes
9. **Locale-aware metadata** — cross-references `i18n-l10n`'s `hreflang` rule
10. **Metadata never leaks private/unpublished content** in title, description, or OG image
11. **Social preview images are validated at the required dimensions** and generated per-entity where relevant (per-course OG image, not one generic image site-wide)
12. **Metadata changes are verified with real tooling** (rich results test, social debuggers) before shipping, not assumed correct

## Workflow

1. **Step 0 first, always**: confirm existing metadata pattern, or use the native Metadata API as the standard.
2. For dynamic routes, generate metadata from the actual fetched entity (course title, description, image) inside `generateMetadata`.
3. Add Open Graph/Twitter tags and, where relevant, JSON-LD structured data.
4. Set `robots` deliberately — exclude private/authenticated-only routes.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs discoverability metadata. For the actual page performance (which also affects ranking), see `performance-optimization`. For locale-variant metadata/`hreflang`, see `i18n-l10n`.
- Grounded in official Next.js Metadata API, Schema.org, Open Graph protocol, and Google Search Central documentation — see `references/sources.md`.
