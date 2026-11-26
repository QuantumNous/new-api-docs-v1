/**
 * Fix in-page / cross-page anchors in translated docs.
 *
 * Translators keep heading anchors like `#创建与编辑渠道` while translating the
 * heading itself, so the link no longer matches the generated heading id.
 * This script maps each zh heading id to the heading id at the same position
 * in the en/ja file (same algorithm as fumadocs' remarkHeading) and rewrites
 * links in en/ja docs. It also maps `id="中文"` attributes on HTML elements.
 *
 * Usage:
 *   bun scripts/fix-translated-anchors.ts [--check] [paths under content/docs/zh ...]
 *   (no paths = all zh docs)
 */

import * as fs from 'fs';
import * as path from 'path';
import Slugger from 'github-slugger';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';

const DOCS_DIR = path.join(process.cwd(), 'content', 'docs');
const LANGS = ['en', 'ja'] as const;
const CJK = /[一-鿿]/;
const CHECK_ONLY = process.argv.includes('--check');

type Node = { type: string; value?: string; children?: Node[] };

function flatten(node: Node): string {
  if (node.children) return node.children.map(flatten).join('');
  return node.value ?? '';
}

/** Heading ids in document order, computed the same way as fumadocs remarkHeading. */
function headingIds(raw: string): string[] {
  // Blank out YAML frontmatter so its closing `---` is not parsed as a setext heading.
  const source = raw.replace(/^---\n[\s\S]*?\n---(?=\n)/, (fm) =>
    fm.replace(/[^\n]/g, '')
  );
  let tree: Node;
  try {
    tree = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMdx)
      .parse(source) as Node;
  } catch {
    // Fall back to plain markdown if MDX parsing fails.
    tree = unified().use(remarkParse).use(remarkGfm).parse(source) as Node;
  }
  const slugger = new Slugger();
  const ids: string[] = [];
  visit(tree as never, 'heading', (heading: Node) => {
    const last = heading.children?.at(-1);
    const custom =
      last?.type === 'text'
        ? /\s*\[#([^]+?)]\s*$/.exec(last.value ?? '')
        : null;
    ids.push(custom?.[1] ?? slugger.slug(flatten(heading)));
    return 'skip';
  });
  return ids;
}

/** `id="..."` attributes on JSX/HTML elements, in order. */
function elementIds(source: string): string[] {
  return [...source.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function collect(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...collect(p));
    else if (/\.mdx?$/.test(e.name)) out.push(p);
  }
  return out;
}

function zhFiles(args: string[]): string[] {
  const inputs = args.filter((a) => !a.startsWith('--'));
  if (inputs.length === 0) return collect(path.join(DOCS_DIR, 'zh'));
  return inputs.flatMap((a) => {
    const p = path.resolve(a);
    return fs.statSync(p).isDirectory() ? collect(p) : [p];
  });
}

/** Doc URL path (without locale) for a zh file, e.g. guide/feature-guide/user/auth */
function docPath(zhFile: string): string {
  return path
    .relative(path.join(DOCS_DIR, 'zh'), zhFile)
    .replace(/\.mdx?$/, '')
    .replace(/(^|\/)index$/, '')
    .split(path.sep)
    .join('/');
}

// ---------------------------------------------------------------------------
// Build zh-id -> translated-id maps per (lang, docPath)
// ---------------------------------------------------------------------------

const allZh = collect(path.join(DOCS_DIR, 'zh'));
const maps: Record<string, Map<string, Map<string, string>>> = {
  en: new Map(),
  ja: new Map(),
};
const warnings: string[] = [];

for (const zhFile of allZh) {
  const rel = path.relative(path.join(DOCS_DIR, 'zh'), zhFile);
  const zhSrc = fs.readFileSync(zhFile, 'utf-8');
  const zhH = headingIds(zhSrc);
  const zhE = elementIds(zhSrc);
  for (const lang of LANGS) {
    const tFile = path.join(DOCS_DIR, lang, rel);
    if (!fs.existsSync(tFile)) continue;
    const tSrc = fs.readFileSync(tFile, 'utf-8');
    const tH = headingIds(tSrc);
    const tE = elementIds(tSrc);
    const m = new Map<string, string>();
    if (zhH.length === tH.length) {
      zhH.forEach((id, i) => m.set(id, tH[i]));
    } else if (zhH.some((id) => CJK.test(id))) {
      warnings.push(
        `${lang}/${rel}: heading count differs (zh=${zhH.length} ${lang}=${tH.length}), heading anchors not mapped`
      );
    }
    if (zhE.length === tE.length) {
      zhE.forEach((id, i) => {
        // Element ids are usually kept verbatim; only map when translated.
        if (id !== tE[i]) m.set(id, tE[i]);
      });
    }
    maps[lang].set(docPath(zhFile), m);
  }
}

const idCache = new Map<string, Set<string> | undefined>();
/** All heading/element ids of the translated page at `page` (doc path) in `lang`. */
function translatedIds(lang: string, page: string): Set<string> | undefined {
  const key = `${lang}:${page}`;
  if (!idCache.has(key)) {
    const base = path.join(DOCS_DIR, lang, page);
    const file = [
      `${base}.mdx`,
      `${base}.md`,
      path.join(base, 'index.mdx'),
    ].find((f) => fs.existsSync(f));
    if (!file) {
      idCache.set(key, undefined);
    } else {
      const src = fs.readFileSync(file, 'utf-8');
      idCache.set(key, new Set([...headingIds(src), ...elementIds(src)]));
    }
  }
  return idCache.get(key);
}

// ---------------------------------------------------------------------------
// Rewrite links
// ---------------------------------------------------------------------------

let changedFiles = 0;
let fixed = 0;
const unresolved: string[] = [];

for (const zhFile of zhFiles(process.argv.slice(2))) {
  const rel = path.relative(path.join(DOCS_DIR, 'zh'), zhFile);
  const self = docPath(zhFile);
  for (const lang of LANGS) {
    const tFile = path.join(DOCS_DIR, lang, rel);
    if (!fs.existsSync(tFile)) continue;
    const src = fs.readFileSync(tFile, 'utf-8');
    const ownIds = new Set([...headingIds(src), ...elementIds(src)]);

    // Anchor links in the zh source, in order. Used to recover anchors the model
    // "translated" itself (e.g. #プラグイン詳細の確認) by matching link positions.
    const anchorLink =
      /(?:\]\(|href=["'])(?:\/zh\/docs\/([^#)"'\s]*))?#([^)"'\s]+)/g;
    const zhLinks = [
      ...fs.readFileSync(zhFile, 'utf-8').matchAll(anchorLink),
    ].map((m) => ({
      page: m[1] !== undefined ? m[1].replace(/\/$/, '') : self,
      anchor: safeDecode(m[2]),
    }));
    const tLinkCount = [
      ...src.matchAll(
        new RegExp(anchorLink.source.replace('\\/zh\\/', `\\/${lang}\\/`), 'g')
      ),
    ].length;
    const positional = zhLinks.length === tLinkCount;
    let linkIndex = -1;

    // Matches  ](#anchor)  ](/lang/docs/path#anchor)  href="#anchor"  href="/lang/docs/path#anchor"
    const re = new RegExp(
      `((?:\\]\\(|href=["']))((?:/${lang}/docs/([^#)"'\\s]*))?)#([^)"'\\s]+)`,
      'g'
    );
    let count = 0;
    const out = src.replace(
      re,
      (
        whole,
        lead: string,
        prefix: string,
        target: string | undefined,
        anchor: string
      ) => {
        linkIndex++;
        const decoded = safeDecode(anchor);
        const page = target !== undefined ? target.replace(/\/$/, '') : self;
        // Already a valid id on the target page: leave it.
        const targetIds = page === self ? ownIds : translatedIds(lang, page);
        if (!targetIds || targetIds.has(decoded)) return whole;
        let mapped = maps[lang].get(page)?.get(decoded);
        if (!mapped && positional) {
          const zhLink = zhLinks[linkIndex];
          if (zhLink && zhLink.page === page)
            mapped = maps[lang].get(page)?.get(zhLink.anchor);
        }
        if (mapped && mapped !== decoded) {
          count++;
          return `${lead}${prefix}#${mapped}`;
        }
        {
          unresolved.push(
            `${lang}/${rel}: #${decoded}${target !== undefined ? ` (-> ${page})` : ''}`
          );
        }
        return whole;
      }
    );

    if (count > 0) {
      fixed += count;
      changedFiles++;
      if (!CHECK_ONLY) fs.writeFileSync(tFile, out, 'utf-8');
      console.log(
        `${CHECK_ONLY ? 'would fix' : 'fixed'} ${count} anchor(s) in ${lang}/${rel}`
      );
    }
  }
}

for (const w of warnings) console.warn(`⚠ ${w}`);
if (unresolved.length) {
  console.warn(`\n⚠ ${unresolved.length} anchor(s) could not be resolved:`);
  for (const u of unresolved.slice(0, 50)) console.warn(`   ${u}`);
}
console.log(
  `\n${CHECK_ONLY ? 'Would fix' : 'Fixed'} ${fixed} anchor(s) in ${changedFiles} file(s).`
);
if (CHECK_ONLY && fixed > 0) process.exitCode = 1;
