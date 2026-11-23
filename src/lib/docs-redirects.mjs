import movedPages from './docs-redirects.json' with { type: 'json' };
import movedAssets from './docs-asset-redirects.json' with { type: 'json' };

const documents = new Map(Object.entries(movedPages));
const assets = new Map(Object.entries(movedAssets));

/** Look up published legacy paths, including percent-encoded directory names. */
export function resolveDocRedirect(pathname) {
  let path;
  try {
    path = decodeURI(pathname).replace(/\/$/, '');
  } catch {
    return undefined;
  }

  // Documentation without a locale used English.
  if (path.startsWith('/docs/')) path = `/en${path}`;

  const direct = documents.get(path) ?? assets.get(path);
  if (direct) return direct;

  if (/^\/(en|zh|ja)\/llms\.mdx\//.test(path)) {
    return documents
      .get(path.replace('/llms.mdx/', '/docs/'))
      ?.replace('/docs/', '/llms.mdx/');
  }

  if (/^\/(en|zh|ja)\/docs\/.+\.mdx$/.test(path)) {
    const destination = documents.get(path.slice(0, -4));
    if (destination) return `${destination}.mdx`;
  }
}

/** Enumerate the HTML and Markdown addresses of migrated documents. */
export function docsRedirects() {
  return Object.entries(movedPages).flatMap(([source, destination]) => {
    const redirects = [{ source, destination, permanent: true }];
    if (/^\/(en|zh|ja)\/docs\//.test(source)) {
      redirects.push(
        {
          source: source.replace('/docs/', '/llms.mdx/'),
          destination: destination.replace('/docs/', '/llms.mdx/'),
          permanent: true,
        },
        {
          source: `${source}.mdx`,
          destination: `${destination}.mdx`,
          permanent: true,
        }
      );
    }
    return redirects;
  });
}

/** List screenshot migrations for HTTP regression checks. */
export function assetRedirects() {
  return Object.entries(movedAssets).map(([source, destination]) => ({
    source,
    destination,
    permanent: true,
  }));
}
