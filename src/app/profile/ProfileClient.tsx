'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { Peak, Profile, Visit } from '@/types';

interface ProfileClientProps {
  profile: Profile | null;
  visits: Visit[];
  peaks: Peak[];
}

export function ProfileClient({ profile, visits, peaks }: ProfileClientProps) {
  const t = useTranslations('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const visitedPeakIds = new Set(visits.map((v) => v.peak_id));
  const visitedPeaks = peaks.filter((p) => visitedPeakIds.has(p.id));
  const percentage = Math.round((visitedPeaks.length / 153) * 100);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', profile!.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('title')}</h1>

      {/* Profile form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('displayName')}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('displayNamePlaceholder')}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {saved ? t('saved') : saving ? t('saving') : t('save')}
        </button>
      </form>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-700 mb-3">{t('progress')}</h2>
        <div className="flex items-end gap-3 mb-2">
          <span className="text-4xl font-bold text-green-700">{visitedPeaks.length}</span>
          <span className="text-gray-400 text-sm pb-1">{t('of153')}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-1">{percentage}%</p>
      </div>

      {/* Visited peaks list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4">
          {t('myPeaks')} ({visitedPeaks.length})
        </h2>
        {visitedPeaks.length === 0 ? (
          <p className="text-gray-400 text-sm">Još nisi posjetio/la nijedan vrh.</p>
        ) : (
          <div className="space-y-2">
            {visitedPeaks.map((peak) => {
              const visit = visits.find((v) => v.peak_id === peak.id);
              return (
                <div key={peak.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-xs text-gray-400 font-mono mr-2">#{peak.hpo_number}</span>
                    <a href={`/peaks/${peak.id}`} className="text-sm font-medium text-gray-700 hover:text-green-700">
                      {peak.name_hr}
                    </a>
                  </div>
                  <div className="text-right">
                    {peak.elevation_m && <span className="text-xs text-gray-400">{peak.elevation_m}m</span>}
                    {visit && (
                      <span className="text-xs text-gray-300 ml-2">
                        {new Date(visit.visited_at).toLocaleDateString('hr-HR')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
