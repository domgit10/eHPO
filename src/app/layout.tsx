import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocaleFromCookie } from '@/lib/i18n/locale';
import { getMessages } from '@/lib/i18n';
import { Navbar } from '@/components/Nav/Navbar';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HPO Sobilaznica',
  description: 'Praćenje posjeta Hrvatskoj planinارskoj obilaznici',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocaleFromCookie();
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className={`h-full ${geist.className}`}>
      <body className="h-full flex flex-col bg-gray-50">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
