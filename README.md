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
