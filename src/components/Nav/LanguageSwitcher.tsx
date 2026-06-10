'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Locale } from '@/types';

export function LanguageSwitcher() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('hr');

  useEffect(() => {
    const stored = document.cookie
      .split('; ')
      .find((r) => r.startsWith('locale='))
      ?.split('=')[1];
    if (stored === 'hr' || stored === 'en') setLocale(stored);
  }, []);

  function switchLocale(next: Locale) {
    document.cookie = `locale=${next};path=/;max-age=31536000`;
    setLocale(next);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      <button
        onClick={() => switchLocale('hr')}
        className={`px-2 py-1 rounded transition-colors ${
          locale === 'hr'
            ? 'bg-green-100 text-green-800'
            : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        HR
      </button>
      <span className="text-gray-400">|</span>
      <button
        onClick={() => switchLocale('en')}
        className={`px-2 py-1 rounded transition-colors ${
          locale === 'en'
            ? 'bg-green-100 text-green-800'
            : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        EN
      </button>
    </div>
  );
}
