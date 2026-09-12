import { docs } from '@/.source';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { openapiPlugin } from 'fumadocs-openapi/server';
import { i18n } from '@/lib/i18n';

export const source = loader({
  baseUrl: '/docs',
  i18n,
  source: docs.toFumadocsSource(),
  plugins: [
    lucideIconsPlugin(),
    openapiPlugin(), // Add badges to API pages in the page tree
  ],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [
    page.locale ?? i18n.defaultLanguage,
    ...page.slugs,
    'image.png',
  ];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
