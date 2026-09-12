# new-api-docs-v1

A Next.js documentation site for New API.

## Development

Run the development server:

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
