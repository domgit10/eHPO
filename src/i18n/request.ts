import { getRequestConfig } from 'next-intl/server';
import { getLocaleFromCookie } from '@/lib/i18n/locale';
import { getMessages } from '@/lib/i18n';

export default getRequestConfig(async () => {
  const locale = await getLocaleFromCookie();
  return {
    locale,
    messages: await getMessages(locale),
  };
});
