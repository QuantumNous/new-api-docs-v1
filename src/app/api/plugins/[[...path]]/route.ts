import { z } from 'zod';
import { OFFICIAL_PLUGIN_SITES } from '@/lib/plugins/public-site';
import {
  pluginCatalogSchema,
  pluginChangelogSchema,
  pluginDetailSchema,
  pluginIdSchema,
} from '@/lib/plugins/schema';

const siteSchema = z.enum(['pro', 'ai']);

function failure(message: string, status: number) {
  return Response.json(
    { success: false, message },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const url = new URL(request.url);
  const site = siteSchema.safeParse(url.searchParams.get('site') ?? 'ai');
  if (!site.success) return failure('不支持的官网域名。', 400);

  const { path = [] } = await context.params;
  const isDetail =
    path.length === 1 &&
    path[0] !== 'index.json' &&
    pluginIdSchema.safeParse(path[0]).success;
  const isChangelog =
    path.length === 3 &&
    path[2] === 'changelog' &&
    path.slice(0, 2).every((part) => pluginIdSchema.safeParse(part).success);
  if (path.length !== 0 && !isDetail && !isChangelog)
    return failure('插件接口不存在。', 404);

  const upstream = new URL(
    `/api/v1/plugins${path.length ? `/${path.join('/')}` : ''}`,
    OFFICIAL_PLUGIN_SITES[site.data]
  );
  if (isChangelog) upstream.searchParams.set('locale', 'zh');

  try {
    const response = await fetch(upstream, {
      headers: { Accept: 'application/json', 'User-Agent': 'new-api-docs-v1' },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      return failure(
        response.status === 404
          ? '未找到此插件或版本。'
          : '官网插件数据暂时无法加载，请重试。',
        response.status === 404 ? 404 : 502
      );
    }
    const envelope = z
      .object({ success: z.literal(true), data: z.unknown() })
      .parse(await response.json());
    const schema = isChangelog
      ? pluginChangelogSchema.nullable()
      : isDetail
        ? pluginDetailSchema
        : pluginCatalogSchema;
    const data = schema.parse(envelope.data);
    // Reject a mismatched response instead of showing another plugin/version's content.
    if (isDetail && data && 'key' in data && data.key !== path[0])
      return failure('官网返回的插件信息不匹配。', 502);
    if (
      isChangelog &&
      data &&
      'plugin' in data &&
      (data.plugin !== path[0] || data.version !== path[1])
    )
      return failure('官网返回的更新日志不匹配。', 502);
    return Response.json(
      { success: true, data },
      {
        headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' },
      }
    );
  } catch (error) {
    const timeout =
      error instanceof Error &&
      ['TimeoutError', 'AbortError'].includes(error.name);
    return failure(
      timeout ? '官网请求超时，请重试。' : '官网插件数据暂时无法加载，请重试。',
      timeout ? 504 : 502
    );
  }
}
