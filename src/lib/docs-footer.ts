import { findNeighbour, type Item, type Root } from 'fumadocs-core/page-tree';
import type { InferPageType } from 'fumadocs-core/source';
import type { source } from '@/lib/source';
import { type DocsConfig, replaceBrandName } from '@/lib/docs-config';

type DocsPage = InferPageType<typeof source>;

export type DocsFooterItem = {
  name: string;
  url: string;
  description?: string;
};

export type DocsFooterItems = {
  previous?: DocsFooterItem;
  next?: DocsFooterItem;
};

function toFooterItem(item: Item, config: DocsConfig): DocsFooterItem {
  const name =
    typeof item.name === 'string' ? replaceBrandName(item.name, config) : '';
  const description =
    typeof item.description === 'string'
      ? replaceBrandName(item.description, config)
      : undefined;

  return {
    name,
    url: item.url,
    description,
  };
}

export function getDocsFooterItems(
  page: DocsPage,
  pageTree: Root,
  config: DocsConfig
): DocsFooterItems | undefined {
  const neighbours = findNeighbour(pageTree, page.url);
  if (!neighbours.previous && !neighbours.next) return undefined;

  return {
    previous: neighbours.previous
      ? toFooterItem(neighbours.previous, config)
      : undefined,
    next: neighbours.next ? toFooterItem(neighbours.next, config) : undefined,
  };
}
