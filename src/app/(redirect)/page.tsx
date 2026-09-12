import { i18n } from '@/lib/i18n';
import { redirect } from 'next/navigation';

/**
 * Fallback redirect for `/`.
 *
 * Locale detection is handled by `middleware.ts` (Accept-Language + cookies).
 * Keeping this page server-only avoids shipping extra client JS.
 */
export default function RootPage() {
  redirect(`/${i18n.defaultLanguage}`);
}
