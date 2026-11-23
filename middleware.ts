import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from 'next/server';
import { resolveDocRedirect } from '@/lib/docs-redirects.mjs';
import { i18n } from '@/lib/i18n';

const localeMiddleware = createI18nMiddleware(i18n);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  const destination = resolveDocRedirect(request.nextUrl.pathname);
  if (destination) {
    const url = new URL(destination, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }
  if (request.nextUrl.pathname.startsWith('/assets/'))
    return NextResponse.next();
  return localeMiddleware(request, event);
}

export const config = {
  // Matcher ignoring API routes, Next.js internals, and static assets
  // Important: exclude metadata routes like `/robots.txt` and `/sitemap.xml`
  // so they won't be redirected to `/{lang}/...` which would 404 unless you implement localized metadata routes.
  matcher: [
    '/assets/guide/feature-guide/:path*',
    '/((?!api|og/|_next/static|_next/image|favicon.ico|assets/|robots\\.txt|sitemap\\.xml|llms?\\.txt|llm-full\\.txt|llms-full\\.txt).*)',
  ],
};
