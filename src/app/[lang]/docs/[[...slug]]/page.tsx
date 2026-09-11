import { getPageImage, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound, redirect } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { Feedback } from '@/components/feedback';
import { LLMCopyButton, ViewOptions } from '@/components/page-actions';
import { onRateAction } from '@/lib/github';
import { i18n } from '@/lib/i18n';

// GitHub repository info for source links
const owner = 'QuantumNous';
const repo = 'new-api-docs-v1';
const branch = 'main';

export default async function Page(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { slug, lang } = await props.params;
  const page = source.getPage(slug, lang);
  if (
    !page &&
    lang !== 'zh' &&
    slug?.[0] === 'plugins' &&
    source.getPage(slug, 'zh')
  )
    redirect(`/${lang}/docs`);
  if (!page) notFound();

  const MDX = page.data.body as any;
  const lastModified = page.data.lastModified;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      lastUpdate={lastModified ? new Date(lastModified) : undefined}
      tableOfContent={{
        style: 'clerk',
        // Disable TOC in 'full' mode (OpenAPI page) to enable two-column layout
        enabled: !page.data.full,
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-2">
        {page.data.description}
      </DocsDescription>
      <div className="mb-6 flex flex-row flex-wrap items-center gap-2 border-b pb-6">
        <LLMCopyButton
          markdownUrl={`/${lang}/llms.mdx/${page.slugs.join('/')}`}
          lang={lang}
        />
        <ViewOptions
          markdownUrl={`/${lang}/llms.mdx/${page.slugs.join('/')}`}
          githubUrl={`https://github.com/${owner}/${repo}/blob/${branch}/content/docs/${page.path}`}
          lang={lang}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page) as any,
          })}
        />
      </DocsBody>
      <Feedback lang={lang} onRateAction={onRateAction} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const params = source.generateParams();
  // Pre-render fallbacks without adding untranslated pages to navigation or search.
  for (const page of source.getPages('zh')) {
    if (page.slugs[0] !== 'plugins') continue;
    for (const lang of i18n.languages) {
      if (lang !== 'zh' && !source.getPage(page.slugs, lang)) {
        params.push({ lang, slug: page.slugs });
      }
    }
  }
  return params;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { slug, lang } = await props.params;
  const page = source.getPage(slug, lang);
  // The page owns redirects for translations that are not available yet.
  if (
    !page &&
    lang !== 'zh' &&
    slug?.[0] === 'plugins' &&
    source.getPage(slug, 'zh')
  )
    return {};
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: { images: getPageImage(page).url },
  };
}
