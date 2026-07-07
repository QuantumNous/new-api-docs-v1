import { getPageImage, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { Feedback } from '@/components/feedback';
import { LLMCopyButton, ViewOptions } from '@/components/page-actions';
import { onRateAction } from '@/lib/github';
import { BrandTextReplacer } from '@/components/brand-text-replacer';
import {
  getApiBaseUrl,
  getDocsConfig,
  replaceBrandName,
} from '@/lib/docs-config';
import { getDocsFooterItems } from '@/lib/docs-footer';
import { replacePageTreeBrand } from '@/lib/docs-page-tree';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GitHub repository info for source links
const owner = 'fyinfor';
const repo = 'token-factory-docs';
const branch = 'main';

export default async function Page(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { slug, lang } = await props.params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();
  const docsConfig = await getDocsConfig();

  const MDX = page.data.body as any;
  const lastModified = page.data.lastModified;
  const title = replaceBrandName(page.data.title, docsConfig);
  const description = page.data.description
    ? replaceBrandName(page.data.description, docsConfig)
    : undefined;
  const pageTree = replacePageTreeBrand(source.pageTree[lang], docsConfig);
  const footerItems = getDocsFooterItems(page, pageTree, docsConfig);

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      lastUpdate={lastModified ? new Date(lastModified) : undefined}
      footer={footerItems ? { items: footerItems } : undefined}
      tableOfContent={{
        style: 'clerk',
        // Disable TOC in 'full' mode (OpenAPI page) to enable two-column layout
        enabled: !page.data.full,
      }}
    >
      <DocsTitle>{title}</DocsTitle>
      <DocsDescription className="mb-2">{description}</DocsDescription>
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
        <BrandTextReplacer
          brandName={docsConfig.brandName}
          apiBaseUrl={getApiBaseUrl(docsConfig)}
        >
          <MDX
            components={getMDXComponents({
              a: createRelativeLink(source, page) as any,
            })}
          />
        </BrandTextReplacer>
      </DocsBody>
      <Feedback lang={lang} onRateAction={onRateAction} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { slug, lang } = await props.params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();
  const docsConfig = await getDocsConfig();

  return {
    title: replaceBrandName(page.data.title, docsConfig),
    description: page.data.description
      ? replaceBrandName(page.data.description, docsConfig)
      : undefined,
    openGraph: { images: getPageImage(page).url },
  };
}
