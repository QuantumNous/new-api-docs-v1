# new-api-docs-v1

A Next.js documentation site for New API.

## Development

Run the development server:

```bash
make dev
```

Or with Bun directly:

```bash
bun install

bun dev
```

Open http://localhost:3000 with your browser to see the result.

## Build

Build the application for production:

```bash
bun run build
```

## SEO and canonical domain

The canonical documentation origin defaults to `https://docs.newapi.ai`, including
local builds and preview deployments. Set `SITE_URL` **before building** to choose
another canonical domain, for example `SITE_URL=https://docs.newapi.pro`.
Use a full HTTP(S) origin without a path, query, or fragment.

All page canonicals, language alternates, sharing metadata, structured data,
`sitemap.xml`, and `robots.txt` use that origin. When one build is served on both
domains, both use the same canonical origin to consolidate duplicate pages.
Official website links to `www.newapi.ai` and `www.newapi.pro` remain visible on
the homepage, quick start pages, and shared footer.

Moved document paths are recorded in `src/lib/docs-redirects.json`. Next.js
returns 308 redirects for HTML, `/llms.mdx/`, and `.mdx` URLs, preserving query
parameters and the requested format. Add an exact mapping when a page has an
equivalent replacement. Retired pages without a replacement return 404.

Language fallback is disabled. Navigation, search, sitemaps, and language
alternates contain pages with source files in the requested language. When
removing a translation, add its replacement to the redirect map if one exists.
From the `qn-platform` repository, run
`bun scripts/sync-docs-routes.ts ../new-api-docs-v1` to update the official
website's document allowlist and migration mappings.

Run the redirect checks with `bun run test:seo`. The SEO browser suite also
checks redirects over HTTP, query preservation, and sitemap exclusions.

SEO browser checks run against a production build:

```bash
bunx next build
bun run test:seo:browser
```

Use `PLUGIN_TEST_BROWSER_CHANNEL=chrome` for installed Chrome, as below.

## Plugin marketplace checks

```bash
bun run test:plugins
bunx next build # skips the changelog-writing prebuild hook
bunx playwright install chromium
bun run test:plugins:browser
```

Browser tests start the production server on port 3100 and mock catalog data.
To use an installed Chrome instead of downloading Chromium, run
`PLUGIN_TEST_BROWSER_CHANNEL=chrome bun run test:plugins:browser`.

The marketplace reads the matching official `.pro` or `.ai` site at request time;
building the docs does not fetch the plugin catalog. Installation URLs always
point to the official site. Local previews use `.ai`.

## Project Structure

| Path                          | Description                  |
| ----------------------------- | ---------------------------- |
| `src/app/[lang]/(home)`       | Landing page and home pages  |
| `src/app/[lang]/docs`         | Documentation pages (i18n)   |
| `src/app/api/search/route.ts` | Search API endpoint          |
| `content/docs/`               | Documentation content (MDX)  |
| `src/lib/source.ts`           | Content source configuration |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
