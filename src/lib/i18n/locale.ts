import { cookies } from 'next/headers';
import type { Locale } from '@/types';
import { defaultLocale, locales } from './index';

export async function getLocaleFromCookie(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale;
  }
  return defaultLocale;
}
