import type { Locale } from '@/types';

export const locales: Locale[] = ['hr', 'en'];
export const defaultLocale: Locale = 'hr';

export async function getMessages(locale: Locale) {
  return (await import(`./messages/${locale}.json`)).default;
}
