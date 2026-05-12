import { generateLLMsText } from '@/lib/llms';
import { getDocsConfig } from '@/lib/docs-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ lang: string }> }
) {
  const { lang } = await params;
  const origin = new URL(req.url).origin;
  const docsConfig = await getDocsConfig();

  return new Response(generateLLMsText(origin, lang, docsConfig), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
