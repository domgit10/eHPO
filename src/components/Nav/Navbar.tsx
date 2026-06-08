'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { User } from '@supabase/supabase-js';

export function Navbar() {
  const t = useTranslations('nav');
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold text-green-700 tracking-tight">
          HPO
        </Link>
        <div className="hidden sm:flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-green-700 transition-colors">
            {t('map')}
          </Link>
          <Link href="/peaks" className="text-gray-600 hover:text-green-700 transition-colors">
            {t('peaks')}
          </Link>
          {user && (
            <Link href="/profile" className="text-gray-600 hover:text-green-700 transition-colors">
              {t('profile')}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        {user ? (
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            {t('logout')}
          </button>
        ) : (
          <Link
            href="/login"
            className="text-sm bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
          >
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
}
