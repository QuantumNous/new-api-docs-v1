/**
 * Documentation Translation Script
 * Automatically translates Chinese markdown documents to English and Japanese using OpenAI API
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Configuration
// ============================================================================

const DOCS_DIR = path.join(process.cwd(), 'content', 'docs');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gemini-2.5-flash';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '2', 10);
const RETRY_BACKOFF = parseFloat(process.env.RETRY_BACKOFF || '2.0');
const MAX_WORKERS = parseInt(process.env.MAX_WORKERS || '3', 10);
// Optional: reasoning effort for reasoning models (e.g. low / medium / high). Omitted when empty.
const REASONING_EFFORT = (process.env.REASONING_EFFORT || '').trim();
// Per-request timeout in seconds (reasoning models on long docs can be slow).
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '600', 10);
// Stream responses (SSE). Keeps proxies (e.g. Cloudflare, 100s idle limit) from returning 524.
const STREAM = process.env.STREAM?.toLowerCase() === 'true';
// Documents longer than this (chars) are split at headings and translated chunk by chunk. 0 disables.
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '12000', 10);
// Retry when the translation drops headings/table rows/list items/components/code fences.
const STRICT_STRUCTURE =
  process.env.STRICT_STRUCTURE?.toLowerCase() !== 'false';
const FORCE_TRANSLATE = process.env.FORCE_TRANSLATE?.toLowerCase() === 'true';
const INCREMENTAL_TRANSLATE =
  process.env.INCREMENTAL_TRANSLATE?.toLowerCase() !== 'false';

const ALL_LANGUAGES = {
  en: { name: 'English', nativeName: '英文', dir: 'en' },
  ja: { name: 'Japanese', nativeName: '日文', dir: 'ja' },
} as const;

// Optional: TARGET_LANGS=en or TARGET_LANGS=ja to translate into a subset of languages.
const TARGET_LANG_CODES = (process.env.TARGET_LANGS || '')
  .split(',')
  .map((l) => l.trim())
  .filter(Boolean);
const TARGET_LANGUAGES = Object.fromEntries(
  Object.entries(ALL_LANGUAGES).filter(
    ([code]) =>
      TARGET_LANG_CODES.length === 0 || TARGET_LANG_CODES.includes(code)
  )
) as Partial<typeof ALL_LANGUAGES>;
const LANGUAGES = ALL_LANGUAGES;

const GLOSSARY = `
| 中文 | English | 说明 | Description |
|------|---------|------|-------------|
| 倍率 | Ratio | 用于计算价格的乘数因子 | Multiplier factor used for price calculation |
| 令牌 | Token | API访问凭证，也指模型处理的文本单元 | API access credentials or text units processed by models |
| 渠道 | Channel | API服务提供商的接入通道 | Access channel for API service providers |
| 分组 | Group | 用户或令牌的分类，影响价格倍率 | Classification of users or tokens, affecting price ratios |
| 额度 | Quota | 用户可用的服务额度 | Available service quota for users |
`;

// ============================================================================
// Type Definitions
// ============================================================================

type LanguageCode = keyof typeof LANGUAGES;

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
}

interface TranslationStats {
  total: number;
  translated: number;
  skipped: number;
  failed: number;
}

interface FileChange {
  oldContent: string;
  newContent: string;
  hasChanges: boolean;
}

interface TranslationResult {
  translated: number;
  skipped: number;
  failed: number;
}

// ============================================================================
// Validation (deferred)
// ============================================================================
// NOTE: Do not exit at import time. This file is also imported by tooling/scripts.
function assertOpenAIKey() {
  if (!OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }
}

// ============================================================================
// Translation Prompt Generation
// ============================================================================

const BASE_TRANSLATION_RULES = `
翻译要求：
1. 保持 Markdown 格式完整，包括标题、列表、代码块、链接等
2. 代码块内容不要翻译
3. 专业术语使用行业标准翻译
4. 保持技术准确性和专业性
5. 图片路径、链接路径保持不变（如果路径中包含中文目录，保持原样）
6. Front matter (YAML 头部) 中的内容需要翻译
7. 保持原文的语气和风格
8. 对于特殊的专有名词（如产品名 "New API"、"Cherry Studio" 等），保持不变
9. 如果文本中出现占位符（例如 @@FD_PROTECT_0@@），必须原样保留，不得翻译、改写、换行或添加空格`;

// ============================================================================
// MDX Protection (Prevent AI from translating API/OpenAPI paths)
// ============================================================================

const PROTECT_PREFIX = '@@FD_PROTECT_';
const PROTECT_SUFFIX = '@@';

function protectMdxSegments(input: string): {
  protectedText: string;
  restore: (translated: string) => string;
  tokens: string[];
} {
  const replacements: Array<{ token: string; value: string }> = [];
  let protectedText = input;

  function protectByRegex(re: RegExp) {
    protectedText = protectedText.replace(re, (match) => {
      const token = `${PROTECT_PREFIX}${replacements.length}${PROTECT_SUFFIX}`;
      replacements.push({ token, value: match });
      return token;
    });
  }

  // Protect the entire <APIPage ... /> component (it often contains OpenAPI JSON paths).
  protectByRegex(/<APIPage\b[\s\S]*?\/>/g);

  // Extra safety: protect any remaining OpenAPI generated JSON path outside APIPage.
  protectByRegex(/openapi\/generated\/[^\s"'<>)}\]]+?\.json/g);

  const tokens = replacements.map((r) => r.token);
  const restore = (translated: string) => {
    // Ensure model didn't drop/alter tokens. If it did, retry to avoid corrupting paths.
    for (const t of tokens) {
      if (!translated.includes(t)) {
        throw new Error(
          `Translation output is missing protected token: ${t}. Refusing to write corrupted content.`
        );
      }
    }
    let out = translated;
    for (const r of replacements) {
      out = out.split(r.token).join(r.value);
    }
    return out;
  };

  return { protectedText, restore, tokens };
}

function getPlainTextTranslationPrompt(
  targetLang: LanguageCode,
  text: string
): string {
  const { nativeName, dir } = LANGUAGES[targetLang];

  return `你是一个专业的技术文档翻译专家。请将以下中文短文本翻译为${nativeName}。
要求：
1. 只输出翻译后的纯文本，不要加引号，不要添加解释，不要换行（保持单行）。
2. 专业术语使用行业标准翻译；专有名词（如 "New API"）保持不变。
3. URL/路径保持不变；如果出现 /zh/ 路径前缀，请替换为 /${dir}/。

术语表（不要放在翻译内容中）：
${GLOSSARY}

原文：
${text}`;
}

function getTranslationPrompt(
  targetLang: LanguageCode,
  content: string
): string {
  const { nativeName, dir } = LANGUAGES[targetLang];

  return `你是一个专业的技术文档翻译专家。请将以下 Markdown 格式的技术文档从中文翻译为${nativeName}。
${BASE_TRANSLATION_RULES}
9. 路径中的语言代码需要替换：将 /zh/ 替换为 /${dir}/（例如：href="/zh/docs/guide" → href="/${dir}/docs/guide"）

术语表（不要放在翻译内容中）：
${GLOSSARY}

请直接返回翻译后的内容，不要添加任何解释或说明。
重要：不要在输出开头添加 \`\`\` 或 \`\`\`yaml 或 \`\`\`markdown 等代码块包裹符号，直接输出翻译后的原始内容即可。

原文：

${content}
`;
}

// ============================================================================
// OpenAI API Integration
// ============================================================================

async function callOpenAI(
  prompt: string,
  targetLang: LanguageCode
): Promise<string> {
  const body: Record<string, unknown> = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a professional technical documentation translator. Translate accurately while preserving Markdown formatting, code blocks, and technical terms.',
      },
      { role: 'user', content: prompt },
    ],
  };
  if (STREAM) {
    body.stream = true;
  }
  if (REASONING_EFFORT) {
    // Reasoning models generally reject custom temperature; use reasoning_effort instead.
    body.reasoning_effort = REASONING_EFFORT;
  } else {
    body.temperature = 0.3;
  }

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT * 1000),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 300);
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}${detail ? ` - ${detail}` : ''}`
    );
  }

  let content: string | undefined;
  let finishReason: string | undefined;
  if (STREAM) {
    ({ content, finishReason } = await readStream(response));
    content = content.trim();
  } else {
    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string };
        finish_reason?: string;
      }>;
    };
    const choice = data.choices?.[0];
    content = choice?.message?.content?.trim();
    finishReason = choice?.finish_reason;
  }
  if (!content) {
    throw new Error('API returned empty content');
  }
  if (finishReason === 'length') {
    throw new Error(
      'API output was truncated (finish_reason=length); refusing to write partial translation'
    );
  }
  return stripCodeFenceWrapper(content);
}

/** Collect an OpenAI-compatible SSE stream into the final text. */
async function readStream(
  response: Response
): Promise<{ content: string; finishReason?: string }> {
  if (!response.body) throw new Error('API returned no response body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let finishReason: string | undefined;

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    let chunk: {
      error?: { message?: string };
      choices?: Array<{
        delta?: { content?: string };
        finish_reason?: string | null;
      }>;
    };
    try {
      chunk = JSON.parse(payload);
    } catch {
      return;
    }
    if (chunk.error) {
      throw new Error(
        `API stream error: ${chunk.error.message ?? JSON.stringify(chunk.error)}`
      );
    }
    const choice = chunk.choices?.[0];
    if (choice?.delta?.content) content += choice.delta.content;
    if (choice?.finish_reason) finishReason = choice.finish_reason;
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      handleLine(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 1);
    }
  }
  buffer += decoder.decode();
  if (buffer) handleLine(buffer);
  if (!finishReason) {
    throw new Error(
      'API stream ended without finish_reason (connection dropped?)'
    );
  }
  return { content, finishReason };
}

/**
 * Split a long Markdown/MDX document at headings (outside code fences) into
 * chunks of roughly CHUNK_SIZE chars. Frontmatter stays in the first chunk.
 */
function splitIntoChunks(text: string): string[] {
  if (CHUNK_SIZE <= 0 || text.length <= CHUNK_SIZE) return [text];

  const lines = text.split('\n');
  const sections: string[][] = [[]];
  let inFence = false;
  let fenceMarker = '';
  let inFrontmatter = lines[0]?.trim() === '---';

  lines.forEach((line, i) => {
    if (inFrontmatter) {
      sections[sections.length - 1].push(line);
      if (i > 0 && line.trim() === '---') inFrontmatter = false;
      return;
    }
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (fence[1][0] === fenceMarker) {
        inFence = false;
      }
    }
    if (
      !inFence &&
      /^#{1,3}\s/.test(line) &&
      sections[sections.length - 1].length > 0
    ) {
      sections.push([]);
    }
    sections[sections.length - 1].push(line);
  });

  const chunks: string[] = [];
  let current = '';
  for (const sec of sections) {
    const part = sec.join('\n');
    if (current && current.length + part.length + 1 > CHUNK_SIZE) {
      chunks.push(current);
      current = part;
    } else {
      current = current ? `${current}\n${part}` : part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Some models wrap the whole answer in ```markdown ... ``` despite instructions.
 * Remove a single wrapping fence only when it encloses the entire output.
 */
function stripCodeFenceWrapper(text: string): string {
  const m = text.match(
    /^```(?:markdown|md|mdx|yaml)?[ \t]*\n([\s\S]*)\n```\s*$/
  );
  if (m && !m[1].includes('\n```')) {
    return m[1];
  }
  return text;
}

async function translateContent(
  content: string,
  targetLang: LanguageCode
): Promise<string> {
  const { nativeName } = LANGUAGES[targetLang];

  // Protect critical MDX segments (e.g. <APIPage document={...} />) so AI won't translate paths.
  const { protectedText, restore } = protectMdxSegments(content);
  const chunks = splitIntoChunks(protectedText);
  if (chunks.length > 1) {
    console.log(`   ✂ Split into ${chunks.length} chunks for ${nativeName}`);
  }

  const results: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const label =
      chunks.length > 1
        ? `${nativeName} chunk ${i + 1}/${chunks.length}`
        : nativeName;
    const translated = await translateChunkWithRetry(
      chunks[i],
      targetLang,
      label
    );
    // Output is trimmed; keep the chunk's original trailing blank lines so joins stay intact.
    const trailing =
      chunks.length > 1 ? (chunks[i].match(/\s*$/)?.[0] ?? '') : '';
    results.push(
      chunks.length > 1 ? translated.replace(/\s+$/, '') + trailing : translated
    );
  }

  // restore() verifies every protected token survived; it throws otherwise.
  return restore(results.join('\n'));
}

/** Count structural elements outside fenced code blocks. */
function structureCounts(text: string): Record<string, number> {
  const body = text.replace(/```[\s\S]*?```/g, '');
  return {
    headings: (body.match(/^#{1,6}\s/gm) ?? []).length,
    'table rows': (body.match(/^\|/gm) ?? []).length,
    'list items': (body.match(/^\s*(?:[-*]|\d+\.)\s/gm) ?? []).length,
    components: (body.match(/<[A-Z][A-Za-z]*\b/g) ?? []).length,
    'code fences': (text.match(/```/g) ?? []).length,
  };
}

/** Returns a description of the first structural difference, or null if none. */
function structureMismatch(source: string, translated: string): string | null {
  if (!STRICT_STRUCTURE) return null;
  const a = structureCounts(source);
  const b = structureCounts(translated);
  const diffs = Object.keys(a)
    .filter((k) => a[k] !== b[k])
    .map((k) => `${k} ${a[k]}→${b[k]}`);
  return diffs.length ? diffs.join(', ') : null;
}

async function translateChunkWithRetry(
  chunk: string,
  targetLang: LanguageCode,
  label: string
): Promise<string> {
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= MAX_RETRIES) {
    try {
      if (retryCount > 0) {
        console.log(`   ⟳ Retry ${retryCount}/${MAX_RETRIES} for ${label}...`);
      }
      const prompt = getTranslationPrompt(targetLang, chunk);
      const translated = await callOpenAI(prompt, targetLang);
      // Reject outputs that silently drop content (e.g. a whole <Accordion> or table row).
      const mismatch = structureMismatch(chunk, translated);
      if (mismatch) {
        throw new Error(
          `Translation output structure differs from source (${mismatch})`
        );
      }
      return translated;
    } catch (error) {
      lastError = error as Error;
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(RETRY_BACKOFF, retryCount - 1);
        console.log(
          `   ⚠ Translation failed (${label}): ${lastError.message}, retrying in ${delay.toFixed(1)}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      } else {
        console.error(
          `   ✗ Translation failed after ${MAX_RETRIES} retries (${label}): ${lastError.message}`
        );
        throw lastError;
      }
    }
  }

  throw lastError!;
}

async function translatePlainText(
  text: string,
  targetLang: LanguageCode
): Promise<string> {
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= MAX_RETRIES) {
    try {
      const prompt = getPlainTextTranslationPrompt(targetLang, text);
      return await callOpenAI(prompt, targetLang);
    } catch (error) {
      lastError = error as Error;
      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(RETRY_BACKOFF, retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      } else {
        throw lastError;
      }
    }
  }

  throw lastError!;
}

// ============================================================================
// Git Integration
// ============================================================================

function detectManualTranslations(): Set<string> {
  const manualTranslations = new Set<string>();

  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', {
      cwd: process.cwd(),
      encoding: 'utf-8',
    });

    const changedFiles = output.trim().split('\n').filter(Boolean);
    const languageDirs = Object.values(LANGUAGES).map((l) => `/${l.dir}/`);

    for (const filePath of changedFiles) {
      if (languageDirs.some((dir) => filePath.includes(dir))) {
        manualTranslations.add(path.join(process.cwd(), filePath));
      }
    }

    if (manualTranslations.size > 0) {
      console.log(
        `\n📝 Detected ${manualTranslations.size} manually translated file(s)`
      );
    }
  } catch (error) {
    console.log('ℹ Could not detect manual translations (not in git repo?)');
  }

  return manualTranslations;
}

function getFileChanges(filePath: string): FileChange {
  try {
    const relativePath = path.relative(process.cwd(), filePath);
    const oldContent = execSync(`git show HEAD:${relativePath}`, {
      cwd: process.cwd(),
      encoding: 'utf-8',
    });

    const newContent = fs.readFileSync(filePath, 'utf-8');

    return {
      oldContent,
      newContent,
      hasChanges: oldContent !== newContent,
    };
  } catch (error) {
    // File is new or not in git
    return {
      oldContent: '',
      newContent: fs.readFileSync(filePath, 'utf-8'),
      hasChanges: true,
    };
  }
}

// ============================================================================
// File System Operations
// ============================================================================

function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walkDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        if (/\.(md|mdx)$/i.test(entry.name)) {
          files.push(fullPath);
        } else if (entry.name === 'meta.json') {
          files.push(fullPath);
        }
      }
    }
  }

  walkDir(dir);
  return files;
}

// ============================================================================
// Translation Logic
// ============================================================================

async function translateToLanguage(
  content: string,
  langCode: string,
  langInfo: (typeof LANGUAGES)[LanguageCode],
  targetFile: string,
  prefix: string,
  isIncremental: boolean
): Promise<boolean> {
  const translationType = isIncremental ? 'Incremental' : 'Full';
  const emoji = isIncremental ? '🔄' : '🌐';

  console.log(
    `${prefix} ${emoji} ${translationType} translation to ${langInfo.nativeName}...`
  );

  try {
    const translatedContent = await translateContent(
      content,
      langCode as LanguageCode
    );

    ensureDirectoryExists(targetFile);
    fs.writeFileSync(
      targetFile,
      translatedContent.endsWith('\n')
        ? translatedContent
        : `${translatedContent}\n`,
      'utf-8'
    );

    const status = isIncremental ? 'Updated' : 'Saved';
    console.log(`${prefix} ✓ ${status} ${langInfo.nativeName} translation`);
    return true;
  } catch (error) {
    console.error(
      `${prefix} ✗ Failed to translate ${langInfo.nativeName}: ${(error as Error).message}`
    );
    return false;
  }
}

async function translateFile(
  sourceFile: string,
  fileIndex: number,
  totalFiles: number,
  manualTranslations: Set<string>
): Promise<TranslationResult> {
  const prefix = `[${fileIndex}/${totalFiles}]`;
  const result: TranslationResult = { translated: 0, skipped: 0, failed: 0 };

  console.log(
    `\n${prefix} 📄 Processing: ${path.relative(process.cwd(), sourceFile)}`
  );

  const isMetaJson = path.basename(sourceFile) === 'meta.json';

  // Read source file
  let content: string;
  try {
    content = fs.readFileSync(sourceFile, 'utf-8');
  } catch (error) {
    console.error(
      `${prefix} ✗ Failed to read file: ${(error as Error).message}`
    );
    result.failed = Object.keys(LANGUAGES).length;
    return result;
  }

  // Calculate relative path
  const zhDir = path.join(DOCS_DIR, 'zh');
  const relPath = path.relative(zhDir, sourceFile);

  if (relPath.startsWith('..')) {
    console.error(`${prefix} ✗ File is not in zh directory`);
    result.failed = Object.keys(LANGUAGES).length;
    return result;
  }

  // Check for file changes (incremental translation)
  let hasChanges = true;
  if (INCREMENTAL_TRANSLATE && !FORCE_TRANSLATE) {
    const fileChange = getFileChanges(sourceFile);
    hasChanges = fileChange.hasChanges;
  }

  // Check if any target translation is missing
  const missingTranslations: string[] = [];
  for (const [langCode, langInfo] of Object.entries(LANGUAGES)) {
    const targetFile = path.join(DOCS_DIR, langInfo.dir, relPath);
    if (!fs.existsSync(targetFile)) {
      missingTranslations.push(langInfo.nativeName);
    }
  }

  // Skip only if no changes AND all translations exist
  if (
    INCREMENTAL_TRANSLATE &&
    !hasChanges &&
    missingTranslations.length === 0 &&
    !FORCE_TRANSLATE
  ) {
    console.log(
      `${prefix} ⏭  No changes and all translations exist, skipping...`
    );
    result.skipped = Object.keys(LANGUAGES).length;
    return result;
  }

  // Log if we're filling missing translations
  if (missingTranslations.length > 0 && !hasChanges) {
    console.log(
      `${prefix} 📝 Filling missing translations: ${missingTranslations.join(', ')}`
    );
  }

  // Translate to each target language
  for (const [langCode, langInfo] of Object.entries(TARGET_LANGUAGES) as Array<
    [string, (typeof LANGUAGES)[LanguageCode]]
  >) {
    const targetFile = path.join(DOCS_DIR, langInfo.dir, relPath);

    // Check manual translation
    if (manualTranslations.has(targetFile)) {
      console.log(
        `${prefix} ⏭  Skipping ${langInfo.nativeName} (manual translation detected)`
      );
      result.skipped++;
      continue;
    }

    const targetExists = fs.existsSync(targetFile);

    // Skip if exists and not forcing
    if (targetExists && !FORCE_TRANSLATE && !INCREMENTAL_TRANSLATE) {
      console.log(
        `${prefix} ⏭  Skipping ${langInfo.nativeName} (already exists)`
      );
      result.skipped++;
      continue;
    }

    // Determine translation type
    const isIncremental = INCREMENTAL_TRANSLATE && targetExists && hasChanges;
    const shouldTranslate =
      FORCE_TRANSLATE || !targetExists || (INCREMENTAL_TRANSLATE && hasChanges);

    if (!shouldTranslate) {
      result.skipped++;
      continue;
    }

    if (FORCE_TRANSLATE && targetExists && !isIncremental) {
      console.log(
        `${prefix} 🔄 Force re-translating ${langInfo.nativeName}...`
      );
    }

    let success: boolean;

    if (isMetaJson) {
      // Safe JSON translation: only translate values, keep JSON structure untouched.
      try {
        const meta = JSON.parse(content) as Record<string, unknown>;
        const out: Record<string, unknown> = { ...meta };

        for (const key of ['title', 'description']) {
          const v = out[key];
          if (typeof v === 'string' && v.trim().length > 0) {
            out[key] = await translatePlainText(v, langCode as LanguageCode);
          }
        }

        // Translate sidebar separators like "---功能指南---"; keep page slugs untouched.
        if (Array.isArray(out.pages)) {
          const pages: unknown[] = [];
          for (const p of out.pages as unknown[]) {
            const sep = typeof p === 'string' ? p.match(/^---(.+)---$/) : null;
            if (sep && /[\u4e00-\u9fff]/.test(sep[1])) {
              const label = await translatePlainText(
                sep[1],
                langCode as LanguageCode
              );
              pages.push(`---${label.trim()}---`);
            } else {
              pages.push(p);
            }
          }
          out.pages = pages;
        }

        ensureDirectoryExists(targetFile);
        fs.writeFileSync(targetFile, JSON.stringify(out, null, 2), 'utf-8');
        console.log(`${prefix} ✓ Saved ${langInfo.nativeName} meta.json`);
        success = true;
      } catch (error) {
        console.error(
          `${prefix} ✗ Failed to translate meta.json (${langInfo.nativeName}): ${(error as Error).message}`
        );
        success = false;
      }
    } else {
      // Perform markdown translation
      success = await translateToLanguage(
        content,
        langCode,
        langInfo,
        targetFile,
        prefix,
        isIncremental
      );
    }

    if (success) {
      result.translated++;
    } else {
      result.failed++;
    }
  }

  return result;
}

// ============================================================================
// Concurrent Processing
// ============================================================================

async function processFiles(
  files: string[],
  manualTranslations: Set<string>
): Promise<TranslationStats> {
  const stats: TranslationStats = {
    total: files.length,
    translated: 0,
    skipped: 0,
    failed: 0,
  };

  if (MAX_WORKERS === 1) {
    console.log('\n🔄 Using sequential mode\n');

    for (let i = 0; i < files.length; i++) {
      const result = await translateFile(
        files[i],
        i + 1,
        files.length,
        manualTranslations
      );
      stats.translated += result.translated;
      stats.skipped += result.skipped;
      stats.failed += result.failed;
    }
  } else {
    console.log(`\n🚀 Using concurrent mode (${MAX_WORKERS} workers)\n`);

    const chunks: string[][] = [];
    for (let i = 0; i < files.length; i += MAX_WORKERS) {
      chunks.push(files.slice(i, i + MAX_WORKERS));
    }

    let processedCount = 0;

    for (const chunk of chunks) {
      const promises = chunk.map((file, idx) =>
        translateFile(
          file,
          processedCount + idx + 1,
          files.length,
          manualTranslations
        )
      );

      const results = await Promise.all(promises);

      for (const result of results) {
        stats.translated += result.translated;
        stats.skipped += result.skipped;
        stats.failed += result.failed;
      }

      processedCount += chunk.length;
    }
  }

  return stats;
}

// ============================================================================
// Main Function
// ============================================================================

async function translateDocs(specificPaths?: string[]) {
  assertOpenAIKey();
  console.log('═══════════════════════════════════════════════');
  console.log('🌐 Starting document translation...');
  console.log('═══════════════════════════════════════════════\n');

  const startTime = Date.now();
  const manualTranslations = detectManualTranslations();

  // Determine files to translate
  let filesToTranslate: string[];

  if (specificPaths && specificPaths.length > 0) {
    filesToTranslate = [];
    const languageDirs = Object.values(LANGUAGES).map((l) => `/${l.dir}/`);

    for (const inputPath of specificPaths) {
      const resolvedPath = path.resolve(inputPath);

      // Check if it's a translated directory (en/ja)
      if (languageDirs.some((dir) => resolvedPath.includes(dir))) {
        console.log(`⏭  Skipping translated path: ${resolvedPath}`);
        continue;
      }

      if (!fs.existsSync(resolvedPath)) {
        console.warn(`⚠ Path not found: ${resolvedPath}`);
        continue;
      }

      const stat = fs.statSync(resolvedPath);

      if (stat.isDirectory()) {
        // It's a directory - collect all markdown files
        console.log(`📁 Collecting files from directory: ${inputPath}`);
        const dirFiles = collectMarkdownFiles(resolvedPath);
        console.log(`   Found ${dirFiles.length} markdown file(s)`);
        filesToTranslate.push(...dirFiles);
      } else if (stat.isFile()) {
        // It's a file
        if (
          !/\.(md|mdx)$/i.test(resolvedPath) &&
          !/meta\.json$/i.test(resolvedPath)
        ) {
          console.warn(`⚠ Not a translatable file: ${resolvedPath}`);
          continue;
        }
        filesToTranslate.push(resolvedPath);
      }
    }
  } else {
    const zhDir = path.join(DOCS_DIR, 'zh');
    filesToTranslate = collectMarkdownFiles(zhDir);
  }

  if (filesToTranslate.length === 0) {
    console.log('ℹ No files to translate');
    return;
  }

  // Display configuration
  console.log(`\n📋 Configuration:`);
  console.log(`   Files: ${filesToTranslate.length}`);
  console.log(`   Model: ${OPENAI_MODEL}`);
  console.log(`   API: ${OPENAI_BASE_URL}`);
  console.log(
    `   Languages: ${Object.values(TARGET_LANGUAGES)
      .map((l) => l.nativeName)
      .join(', ')}`
  );
  console.log(
    `   Retry: Max ${MAX_RETRIES} times, delay ${RETRY_DELAY}s, backoff ${RETRY_BACKOFF}x`
  );
  console.log(`   Concurrency: ${MAX_WORKERS} worker(s)`);
  console.log(`   Reasoning effort: ${REASONING_EFFORT || '(not set)'}`);
  console.log(`   Request timeout: ${REQUEST_TIMEOUT}s`);
  console.log(`   Stream: ${STREAM}`);
  console.log(`   Strict structure check: ${STRICT_STRUCTURE}`);
  console.log(
    `   Chunk size: ${CHUNK_SIZE > 0 ? `${CHUNK_SIZE} chars` : 'disabled'}`
  );
  console.log(
    `   Incremental translate: ${INCREMENTAL_TRANSLATE ? 'Yes' : 'No'}`
  );
  console.log(`   Force translate: ${FORCE_TRANSLATE ? 'Yes' : 'No'}`);
  console.log(`   Manual translations: ${manualTranslations.size}`);

  // Process files
  const stats = await processFiles(filesToTranslate, manualTranslations);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Display results
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 Translation Statistics:');
  console.log(`   Total files: ${stats.total}`);
  console.log(`   Translations: ${stats.translated}`);
  console.log(`   Skipped: ${stats.skipped}`);
  if (stats.failed > 0) {
    console.log(`   Failed: ${stats.failed}`);
  }
  console.log(`   Duration: ${duration}s`);
  console.log('═══════════════════════════════════════════════');
  if (stats.failed > 0) {
    // Non-zero exit so CI marks the run as failed instead of silently succeeding.
    console.error(
      `❌ ${stats.failed} translation(s) failed. See errors above.\n`
    );
    process.exitCode = 1;
  } else {
    console.log('✅ Translation completed!\n');
  }
}

// ============================================================================
// Entry Point
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  translateDocs(args.length > 0 ? args : undefined).catch((error) => {
    console.error('\n❌ Translation failed:', error);
    process.exit(1);
  });
}

export { translateDocs };
// Export for testing/tooling (e.g. to verify OpenAPI path protection).
export { protectMdxSegments };
