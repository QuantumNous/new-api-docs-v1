import { generateLLMsText } from '@/lib/llms';
import { i18n } from '@/lib/i18n';
import { getDocsConfig } from '@/lib/docs-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const docsConfig = await getDocsConfig();

  return new Response(
    generateLLMsText(origin, i18n.defaultLanguage, docsConfig),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    }
  );
}
