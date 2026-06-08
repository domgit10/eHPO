'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const t = useTranslations('login');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(t('error'));
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('successTitle')}</h1>
          <p className="text-gray-600">
            {t('successText').replace('{email}', email)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏔</div>
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-gray-500 mt-2 text-sm">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
