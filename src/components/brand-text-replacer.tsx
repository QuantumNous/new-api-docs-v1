'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

const DEFAULT_BRAND_NAME = 'TokenFactory';
const BRAND_PLACEHOLDER = '__brandName__';
const LEGACY_BRAND_PLACEHOLDER = '{{brandName}}';
const SKIP_TAGS = new Set(['code', 'pre', 'script', 'style', 'textarea']);

export function BrandTextReplacer({
  brandName,
  children,
}: {
  brandName: string;
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

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
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

    const nodes: Text[] = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode as Text);
    }

    for (const node of nodes) {
      node.nodeValue =
        node.nodeValue
          ?.replaceAll(BRAND_PLACEHOLDER, brandName)
          .replaceAll(LEGACY_BRAND_PLACEHOLDER, brandName)
          .replaceAll(DEFAULT_BRAND_NAME, brandName) ?? null;
    }
    setReady(true);
  }, [brandName]);

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
