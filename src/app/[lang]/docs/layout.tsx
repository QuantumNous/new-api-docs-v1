import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions, getLinkItems } from '@/lib/layout.shared';
import { Footer } from '@/components/footer';
// AI feature temporarily disabled
// import { AISearchTrigger } from '@/components/search';
import 'katex/dist/katex.min.css';
import { notFound } from 'next/navigation';
import { i18n } from '@/lib/i18n';
import {
  type DocsConfig,
  getDocsConfig,
  replaceBrandName,
} from '@/lib/docs-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function replacePageTreeBrand<T>(node: T, config: DocsConfig): T {
  if (Array.isArray(node)) {
    return node.map((item) => replacePageTreeBrand(item, config)) as T;
  }

  if (!node || typeof node !== 'object') return node;
  if ('$$typeof' in node) return node;

  const sourceNode = node as Record<string, unknown>;
  const nextNode: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(sourceNode)) {
    if (typeof value === 'string') {
      nextNode[key] = replaceBrandName(value, config);
    } else if (value && typeof value === 'object') {
      nextNode[key] = replacePageTreeBrand(value, config);
    } else {
      nextNode[key] = value;
    }
  }

  return nextNode as T;
}

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;

  // Check if the language is valid, prevent invalid language codes (e.g. 'api') from causing errors
  if (!i18n.languages.includes(lang as (typeof i18n.languages)[number])) {
    notFound();
  }

  const docsConfig = await getDocsConfig();
  const base = baseOptions(lang, docsConfig);
  const pageTree = replacePageTreeBrand(source.pageTree[lang], docsConfig);

  return (
    <DocsLayout
      {...base}
      tabMode="top"
      tree={pageTree}
      links={getLinkItems(docsConfig).filter((item) => item.type === 'icon')}
      sidebar={{
        defaultOpenLevel: 0,
        tabs: {
          transform(option, node) {
            if (!node.icon) return option;

            return {
              ...option,
              icon: (
                <div className="max-md:bg-fd-primary/10 max-md:border-fd-primary/20 size-full rounded-lg max-md:border max-md:p-1.5 [&_svg]:size-full">
                  {node.icon}
                </div>
              ),
            };
          },
        },
      }}
    >
      {children}
      <Footer lang={lang} />
      {/* AI feature temporarily disabled */}
      {/* <AISearchTrigger /> */}
    </DocsLayout>
  );
}
