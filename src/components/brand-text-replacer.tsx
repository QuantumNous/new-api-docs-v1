'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

import { API_BASE_URL_PLACEHOLDER } from '@/lib/docs-config';

const DEFAULT_BRAND_NAME = 'TokenFactory';
const BRAND_PLACEHOLDER = '__brandName__';
const LEGACY_BRAND_PLACEHOLDER = '{{brandName}}';
const SKIP_TAGS = new Set(['code', 'pre', 'script', 'style', 'textarea']);

export function BrandTextReplacer({
  brandName,
  apiBaseUrl,
  children,
}: {
  brandName: string;
  apiBaseUrl?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      setReady(true);
      return;
    }

    const brandWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = node.nodeValue;
        const parentTag = node.parentElement?.tagName.toLowerCase();

        if (parentTag && SKIP_TAGS.has(parentTag)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (
          !value?.includes(DEFAULT_BRAND_NAME) &&
          !value?.includes(BRAND_PLACEHOLDER) &&
          !value?.includes(LEGACY_BRAND_PLACEHOLDER)
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const brandNodes: Text[] = [];
    while (brandWalker.nextNode()) {
      brandNodes.push(brandWalker.currentNode as Text);
    }

    for (const node of brandNodes) {
      node.nodeValue =
        node.nodeValue
          ?.replaceAll(BRAND_PLACEHOLDER, brandName)
          .replaceAll(LEGACY_BRAND_PLACEHOLDER, brandName)
          .replaceAll(DEFAULT_BRAND_NAME, brandName) ?? null;
    }

    if (apiBaseUrl) {
      const apiBaseWalker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            return node.nodeValue?.includes(API_BASE_URL_PLACEHOLDER)
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          },
        }
      );

      const apiBaseNodes: Text[] = [];
      while (apiBaseWalker.nextNode()) {
        apiBaseNodes.push(apiBaseWalker.currentNode as Text);
      }

      for (const node of apiBaseNodes) {
        node.nodeValue =
          node.nodeValue?.replaceAll(API_BASE_URL_PLACEHOLDER, apiBaseUrl) ??
          null;
      }
    }

    setReady(true);
  }, [apiBaseUrl, brandName]);

  return (
    <div
      ref={ref}
      className="contents"
      style={{ visibility: ready ? undefined : 'hidden' }}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}
