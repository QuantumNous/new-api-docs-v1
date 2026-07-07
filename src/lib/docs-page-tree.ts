import { type DocsConfig, replaceBrandName } from '@/lib/docs-config';

export function replacePageTreeBrand<T>(node: T, config: DocsConfig): T {
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
