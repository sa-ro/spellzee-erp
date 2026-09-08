# SEO & Metadata Rules

## Rule 1: Use the Next.js Metadata API Natively
- Metadata is set via the static `metadata` export or `generateMetadata` function per route — never via manually injecting `<title>`/`<meta>` tags into a component body or reaching for a third-party head-management library, which fights the framework's built-in streaming/de-duplication behavior.

## Rule 2: Every Page Has a Unique, Descriptive Title and Description
- Publicly indexable pages never share one default `title`/`description` across the whole site — a course page's title includes the course name; a lesson page's title includes the lesson name. Use a `title.template` in the root layout so each page contributes its specific segment while keeping a consistent site-name suffix.
- Descriptions are written for humans reading a search result (what the page actually offers), not keyword-stuffed.

## Rule 3: Dynamic Routes Generate Metadata from Real Content
- `generateMetadata` for a dynamic route (`/courses/[slug]`) fetches the actual entity and derives title/description/image from it — never a static placeholder ("Course Details") left in place for every course.
- If the entity fetch fails (deleted/not-found course), `generateMetadata` returns appropriate not-found metadata rather than throwing an unhandled error into the metadata phase.

## Rule 4: Open Graph and Twitter Cards Set on Every Shareable Page
- Every publicly shareable page sets `openGraph` (title, description, `images`, `type`) and `twitter` card metadata — a page shared without these renders a broken or generic preview on WhatsApp/Twitter/LinkedIn, which measurably hurts click-through for course-catalog sharing.
- The OG image is a real, entity-specific image (a course's cover image) where one exists, not a single generic site-wide banner reused everywhere.

## Rule 5: Structured Data (JSON-LD) Uses Relevant Schema.org Types
- Course/catalog pages include JSON-LD structured data using the appropriate Schema.org type (`Course`, `AggregateRating`/`Review` where ratings exist, `BreadcrumbList` for navigation context) — this is what enables rich search results (star ratings, breadcrumbs) rather than a plain blue link.
- Structured data values must match the visible on-page content exactly — mismatched/inflated structured data violates search engine guidelines and risks manual penalty.

## Rule 6: `robots` Metadata Is Deliberate Per Page
- Public marketing/catalog pages default to indexable. Authenticated-only pages (student dashboard, in-progress lesson views, account settings) explicitly set `robots: { index: false, follow: false }` — don't rely on authentication alone to keep private routes out of search results; a route that's technically reachable can still be crawled/cached.
- This is a deliberate per-route decision, not a blanket site-wide setting in either direction.

## Rule 7: `sitemap.xml` Generated Dynamically from Actual Content
- `app/sitemap.ts` builds the sitemap by querying actual published routes/entities (published courses, live marketing pages) at build/request time — never a hand-maintained static list that drifts as content is added or unpublished.
- Unpublished/draft/deleted content is excluded from the generated sitemap automatically as part of the same query that would exclude it from public listing pages.

## Rule 8: Canonical URLs Set Explicitly
- Pages reachable via multiple URL variants (query parameters for filtering/sorting, trailing slash variants, a paginated list) set an explicit `alternates.canonical` pointing to the preferred URL — without this, search engines may index near-duplicate URLs as separate pages and dilute ranking signal.

## Rule 9: Locale-Aware Metadata
- Metadata (title, description, OG tags) is generated per active locale, and `alternates.languages` is set per `i18n-l10n`'s `hreflang` rule — a multi-locale page's metadata is not left in one language regardless of the viewed locale.

## Rule 10: Metadata Never Leaks Private/Unpublished Content
- `generateMetadata` for any route checks the same authorization/publish-status logic the page itself uses before deriving title/description/OG image from entity data — an unpublished course or a private draft must not have its title/description/thumbnail exposed via metadata even if the page body itself correctly blocks access, since metadata can be fetched independently by crawlers and link-preview bots.

## Rule 11: Social Preview Images Validated at Required Dimensions
- OG images meet the platform-recommended dimensions (commonly 1200×630 for a `summary_large_image`/OG card) and are actual rendered images (static asset or an `opengraph-image` route generating one per entity), not an arbitrarily-sized content screenshot that gets cropped unpredictably by different platforms.
- Per-entity OG images (per-course cover art) are preferred over one generic site-wide image wherever the entity has a meaningful visual.

## Rule 12: Metadata Verified with Real Tooling Before Shipping
- Before marking an SEO-relevant change done, metadata is verified with actual tooling — Google's Rich Results Test for structured data, and a social platform's link-preview debugger for OG tags — rather than assumed correct from reading the code. Structured data and OG tags fail silently (no error, just a missing rich result or broken preview) if malformed.
