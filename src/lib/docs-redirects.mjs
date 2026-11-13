import movedPages from './docs-redirects.json' with { type: 'json' };

/** Keep HTML and Markdown clients on their respective document formats. */
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
