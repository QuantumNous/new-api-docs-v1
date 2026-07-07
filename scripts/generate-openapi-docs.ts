import { generateFiles, type OperationOutput } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { mkdir, readFile, access } from 'node:fs/promises';

// Type for OpenAPI operation object
interface OperationObject {
  tags?: string[];
  operationId?: string;
  description?: string;
  summary?: string;
  [key: string]: unknown;
}

interface PathItemObject {
  description?: string;
  [key: string]: unknown;
}

function sanitizeDocsSegment(input: string): string {
  // Keep names close to Apifox (for sidebar), but ensure Windows-safe.
  return input
    .trim()
    .replace(/[<>:"/\\|?*]+/g, '-') // illegal chars
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '') // no trailing dots
    .trim()
    .slice(0, 120);
}

function slugifyAscii(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s;
}

function hash32(input: string): string {
  // djb2
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  // unsigned
  return (h >>> 0).toString(16);
}

type TagSlugOverrides = Record<string, string>;

async function loadTagSlugOverrides(): Promise<TagSlugOverrides> {
  const p = './scripts/config/tag-slug-overrides.json';
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw) as TagSlugOverrides;
  } catch {
    return {};
  }
}

type AiModelSidebarConfig = {
  pages: string[];
  videosPages: string[];
  imagesPages: string[];
  imagesOpenaiPages: string[];
};

async function loadAiModelSidebarConfig(): Promise<AiModelSidebarConfig> {
  const p = './scripts/config/ai-model-sidebar.json';
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw) as AiModelSidebarConfig;
  } catch {
    return {
      pages: [
        'chat',
        'completions',
        'images',
        'videos',
        'models',
        'moderations',
        'unimplemented',
      ],
      videosPages: ['createvideogeneration', 'getvideogeneration'],
      imagesPages: ['openai', 'gemini'],
      imagesOpenaiPages: [
        'post-v1-images-generations',
        'post-v1-images-edits',
      ],
    };
  }
}

function deriveSlugFromTagSegment(
  rawSegment: string,
  overrides: TagSlugOverrides
): string {
  const segment = rawSegment.trim();

  // Override has highest priority
  if (overrides[segment]) return overrides[segment];

  // If it contains an English hint in parentheses like 音频（Audio）
  const m = segment.match(/（([^）]+)）/);
  if (m) {
    const inside = m[1].trim();
    if (/[a-z]/i.test(inside)) {
      const slug = slugifyAscii(inside);
      if (slug) return slug;
    }
  }

  // Heuristics for common variants
  if (/openai/i.test(segment)) return 'openai';
  if (/gemini/i.test(segment)) return 'gemini';
  if (/claude/i.test(segment)) return 'claude';
  if (/qwen/i.test(segment) || /通义千问/.test(segment)) return 'qwen';
  if (/sora/i.test(segment)) return 'sora';
  if (/kling/i.test(segment) || /可灵/.test(segment)) return 'kling';
  if (/jimeng/i.test(segment) || /即梦/.test(segment)) return 'jimeng';

  const slug = slugifyAscii(segment);
  if (slug) return slug;

  // Fallback: stable hash slug for non-ascii segments
  return `tag-${hash32(segment)}`;
}

function tagToSlugPath(
  tag: string,
  overrides: TagSlugOverrides
): {
  slugPath: string;
  metaByDir: Array<{ dir: string; title: string }>;
} {
  const parts = tag
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  const metaByDir: Array<{ dir: string; title: string }> = [];
  const slugParts: string[] = [];

  for (const part of parts.length > 0 ? parts : ['default']) {
    const title = sanitizeDocsSegment(part);
    const slug = sanitizeDocsSegment(deriveSlugFromTagSegment(part, overrides));
    slugParts.push(slug);
    metaByDir.push({ dir: slugParts.join('/'), title });
  }

  return { slugPath: slugParts.join('/'), metaByDir };
}

/**
 * Convert camelCase to kebab-case
 * e.g., "createMessage" -> "create-message"
 *       "createChatCompletion" -> "create-chat-completion"
 *       "listModelsGemini" -> "list-models-gemini"
 */
function camelToKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

async function walkJsonFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string) {
    let entries: Array<{ name: string; isDirectory: boolean; isFile: boolean }>;
    try {
      entries = (await readdir(current, { withFileTypes: true })) as any;
    } catch {
      return;
    }

    for (const e of entries as any) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile() && e.name.toLowerCase().endsWith('.json')) {
        const rel = path.relative(process.cwd(), full);
        // Ensure stable cross-platform path in generated MDX
        out.push(rel.split(path.sep).join('/'));
      }
    }
  }
  await walk(dir);
  return out;
}

async function getSchemaInputs(
  kind: 'aiModel' | 'management'
): Promise<string[]> {
  const generatedDir =
    kind === 'aiModel'
      ? './openapi/generated/ai-model'
      : './openapi/generated/management';
  const generated = await walkJsonFiles(generatedDir);
  if (generated.length === 0) {
    throw new Error(
      `No generated OpenAPI files found in ${generatedDir}. Please run: bun run generate:openapi`
    );
  }
  return generated;
}

async function writeMetaJson(dir: string, meta: Record<string, unknown>) {
  const metaPath = path.join(dir, 'meta.json');
  await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
}

async function ensureFileFromTemplate(destPath: string, templatePath: string) {
  try {
    await access(destPath);
    return;
  } catch {
    // continue
  }

  await mkdir(path.dirname(destPath), { recursive: true });
  const content = await readFile(templatePath, 'utf8');
  await writeFile(destPath, content, 'utf8');
}

async function generate() {
  const slugOverrides = await loadTagSlugOverrides();
  const aiModelSidebar = await loadAiModelSidebarConfig();

  // Clean old generated docs (all locales) to keep the output absolutely clean
  const locales = ['zh', 'en', 'ja'];
  await Promise.all(
    locales.flatMap((locale) => [
      rm(`./content/docs/${locale}/api/ai-model`, {
        recursive: true,
        force: true,
      }),
      rm(`./content/docs/${locale}/api/management`, {
        recursive: true,
        force: true,
      }),
    ])
  );

  // Ensure /zh/docs/api root can be fully restored even if deleted
  await mkdir('./content/docs/zh/api', { recursive: true });
  await ensureFileFromTemplate(
    './content/docs/zh/api/meta.json',
    './scripts/templates/zh-api-meta.json'
  );
  await ensureFileFromTemplate(
    './content/docs/zh/api/index.mdx',
    './scripts/templates/zh-api-index.mdx'
  );

  // Generate AI Model API docs with custom path control
  const aiModelMeta = new Map<string, string>(); // dir -> title
  await generateFiles({
    input: createOpenAPI({ input: await getSchemaInputs('aiModel') }),
    output: './content/docs/zh/api/ai-model',
    per: 'custom',
    includeDescription: true,
    addGeneratedComment: true,
    toPages(builder) {
      const items = builder.extract();

      for (const op of items.operations) {
        const extracted = builder.fromExtractedOperation(op);
        if (!extracted) continue;

        const pathItem = extracted.pathItem as unknown as PathItemObject;
        const operation = extracted.operation as unknown as OperationObject;
        const { displayName } = extracted;

        const tag = operation.tags?.[0] || 'default';
        const { slugPath, metaByDir } = tagToSlugPath(tag, slugOverrides);
        for (const m of metaByDir) aiModelMeta.set(m.dir, m.title);
        const operationId =
          operation.operationId ||
          `${op.path.replace(/\//g, '-').replace(/^-/, '')}-${op.method}`;
        // Convert camelCase operationId to kebab-case for consistent file naming
        const fileName = camelToKebab(operationId);

        const entry: OperationOutput = {
          type: 'operation',
          schemaId: builder.id,
          item: op,
          path: `${slugPath}/${fileName}.mdx`,
          info: {
            title: displayName,
            description: operation.description || pathItem.description,
          },
        };

        builder.create(entry);
      }
    },
  });
  console.log('✅ AI Model API docs generated!');

  // Root folder display name (sidebar) - keep consistent with Apifox docs wording
  await writeMetaJson('./content/docs/zh/api/ai-model', {
    title: 'AI 模型接口',
    pages: aiModelSidebar.pages,
  });
  for (const [dir, title] of aiModelMeta.entries()) {
    const meta: Record<string, unknown> = { title };
    if (dir === 'videos') {
      meta.pages = aiModelSidebar.videosPages;
    }
    if (dir === 'images') {
      meta.pages = aiModelSidebar.imagesPages;
    }
    if (dir === 'images/openai') {
      meta.pages = aiModelSidebar.imagesOpenaiPages;
    }
    await writeMetaJson(`./content/docs/zh/api/ai-model/${dir}`, meta);
  }

  // Generate Management API docs with custom path control
  const managementMeta = new Map<string, string>(); // dir -> title
  await generateFiles({
    input: createOpenAPI({ input: await getSchemaInputs('management') }),
    output: './content/docs/zh/api/management',
    per: 'custom',
    includeDescription: true,
    addGeneratedComment: true,
    toPages(builder) {
      const items = builder.extract();

      for (const op of items.operations) {
        const extracted = builder.fromExtractedOperation(op);
        if (!extracted) continue;

        const pathItem = extracted.pathItem as unknown as PathItemObject;
        const operation = extracted.operation as unknown as OperationObject;
        const { displayName } = extracted;

        const tag = operation.tags?.[0] || 'default';
        const { slugPath, metaByDir } = tagToSlugPath(tag, slugOverrides);
        for (const m of metaByDir) managementMeta.set(m.dir, m.title);
        // Convert route path to simple file name
        const fileName = op.path
          .replace(/^\/api\//, '')
          .replace(/\/+$/, '')
          .replace(/\//g, '-')
          .replace(/[{}]/g, '')
          .replace(/^-/, '');

        const entry: OperationOutput = {
          type: 'operation',
          schemaId: builder.id,
          item: op,
          path: `${slugPath}/${fileName}-${op.method}.mdx`,
          info: {
            title: displayName,
            description: operation.description || pathItem.description,
          },
        };

        builder.create(entry);
      }
    },
  });
  console.log('✅ Management API docs generated!');

  await writeMetaJson('./content/docs/zh/api/management', {
    title: '管理接口',
  });
  for (const [dir, title] of managementMeta.entries()) {
    await writeMetaJson(`./content/docs/zh/api/management/${dir}`, { title });
  }

  // Add management auth guide page (Apifox has a dedicated doc page in backend management)
  await ensureFileFromTemplate(
    './content/docs/zh/api/management/auth.mdx',
    './scripts/templates/zh-management-auth.mdx'
  );
}

generate()
  .then(() => console.log('✅ All done!'))
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });
