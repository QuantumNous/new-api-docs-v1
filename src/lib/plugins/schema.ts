import { z } from 'zod';

// Display contracts from qn-platform's public /api/v1/plugins endpoints.
export const pluginIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/);
const localizedText = z.record(z.string(), z.string());
const description = localizedText.nullable().default(null);

const usageField = z.discriminatedUnion('kind', [
  z.object({
    key: z.string(),
    kind: z.literal('number'),
    unit: z.enum(['second', 'count', 'token', 'credit']),
    unitLabel: localizedText.optional(),
    description,
  }),
  z.object({ key: z.string(), kind: z.literal('boolean'), description }),
  z.object({
    key: z.string(),
    kind: z.literal('enum'),
    values: z.array(z.string()),
    enumLabels: z.record(z.string(), localizedText).optional(),
    description,
  }),
]);
const usageExample = z.object({
  label: z.string(),
  facts: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});
const usageProfile = z.object({
  models: z.array(z.string()),
  schema: z.array(usageField),
  examples: z.array(usageExample).default([]),
});

export const pluginViewSchema = z.object({
  key: pluginIdSchema,
  name: z.string(),
  kind: z.string(),
  latest: pluginIdSchema,
  sortPriority: z.number().default(0),
  website: z.string().nullable().default(null),
  iconUrl: z.string().nullable().default(null),
  icon: z.string().nullable().default(null),
  description,
  models: z.array(z.string()),
  channelTypes: z.array(z.number().int()).default([]),
  sourceUrl: z.string(),
  installUrl: z.string(),
});

export const pluginCatalogSchema = z.object({
  source: z.object({
    owner: z.string(),
    repo: z.string(),
    url: z.string(),
    indexUrl: z.string(),
  }),
  fetchedAt: z.string(),
  plugins: z.array(pluginViewSchema),
});

export const pluginDetailSchema = pluginViewSchema.extend({
  versions: z.array(pluginIdSchema),
  usageSchema: z.array(usageField).default([]),
  usageExamples: z.array(usageExample).default([]),
  usageProfiles: z.array(usageProfile).default([]),
  routes: z
    .array(
      z.object({
        method: z.string(),
        path: z.string(),
        type: z.enum(['submit', 'query', 'dynamic']),
        action: z.string().nullable().default(null),
        models: z.array(z.string()).optional(),
      })
    )
    .default([]),
  protocols: z
    .array(
      z.object({
        name: z.string(),
        supports: z.array(z.string()),
        models: z.array(z.string()),
        operations: z.array(
          z.object({
            operation: z.string(),
            method: z.string(),
            path: z.string(),
            modes: z.boolean(),
          })
        ),
      })
    )
    .default([]),
});

export const pluginChangelogSchema = z.object({
  changelogVersion: z.literal(1),
  plugin: pluginIdSchema,
  version: pluginIdSchema,
  locale: z.string(),
  sourceUrl: z.string(),
  sections: z.array(
    z.object({
      category: z.enum([
        'Added',
        'Changed',
        'Deprecated',
        'Removed',
        'Fixed',
        'Security',
        'Migration',
      ]),
      entries: z.array(
        z.array(
          z.object({
            text: z.string(),
            code: z.boolean().optional(),
            strong: z.boolean().optional(),
            emphasis: z.boolean().optional(),
            href: z.string().optional(),
          })
        )
      ),
    })
  ),
});

export type LocalizedText = z.infer<typeof localizedText>;
export type PluginView = z.infer<typeof pluginViewSchema>;
export type PluginCatalog = z.infer<typeof pluginCatalogSchema>;
export type PluginDetail = z.infer<typeof pluginDetailSchema>;
export type PluginChangelog = z.infer<typeof pluginChangelogSchema>;
export type UsageField = z.infer<typeof usageField>;
export type UsageProfile = z.infer<typeof usageProfile>;
export type ChangelogRun =
  PluginChangelog['sections'][number]['entries'][number][number];
