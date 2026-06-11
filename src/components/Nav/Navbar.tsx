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
  const [mobileOpen, setMobileOpen] = useState(false);
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
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-green-700 tracking-tight">
            eHPO
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
                className="hidden sm:block text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:block text-sm bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors"
            >
              {t('login')}
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden p-2 text-gray-600 hover:text-gray-900 text-xl leading-none"
            aria-label="Menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 text-gray-700 hover:text-green-700 text-sm font-medium"
          >
            {t('map')}
          </Link>
          <Link
            href="/peaks"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 text-gray-700 hover:text-green-700 text-sm font-medium"
          >
            {t('peaks')}
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 text-gray-700 hover:text-green-700 text-sm font-medium"
          >
            {t('leaderboard')}
          </Link>
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-gray-700 hover:text-green-700 text-sm font-medium"
              >
                {t('profile')}
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="block w-full text-left py-2.5 text-gray-600 hover:text-red-600 text-sm font-medium"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-green-700 hover:text-green-800 text-sm font-medium"
            >
              {t('login')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
