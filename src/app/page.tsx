import { redirect } from 'next/navigation';
import { i18n } from '@/lib/i18n';

export default function RootPage() {
  // 重定向到默认语言页面
  redirect(`/${i18n.defaultLanguage}`);
}
