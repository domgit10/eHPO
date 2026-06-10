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
  const [displayName, setDisplayName] = useState<string | null>(null);
  const supabase = createClient();

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('display_name').eq('id', userId).single();
    setDisplayName(data?.display_name ?? null);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchProfile(data.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setDisplayName(null);
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
          <Link href="/" className="text-gray-700 hover:text-green-700 transition-colors">
            {t('map')}
          </Link>
          <Link href="/peaks" className="text-gray-700 hover:text-green-700 transition-colors">
            {t('peaks')}
          </Link>
          <Link href="/leaderboard" className="text-gray-700 hover:text-green-700 transition-colors">
            {t('leaderboard')}
          </Link>
          {user && (
            <Link href="/profile" className="text-gray-700 hover:text-green-700 transition-colors">
              {t('profile')}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        {user ? (
          <div className="flex items-center gap-3">
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="w-7 h-7 rounded-full bg-green-700 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {(displayName ?? user.email ?? '?')[0].toUpperCase()}
              </span>
              {displayName && (
                <span className="text-sm text-gray-700 hidden sm:block max-w-[110px] truncate">
                  {displayName}
                </span>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              {t('logout')}
            </button>
          </div>
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
