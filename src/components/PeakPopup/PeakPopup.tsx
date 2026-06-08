'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Peak, Profile, VisitWithPhotos } from '@/types';
import { VisitForm } from '@/components/VisitForm/VisitForm';
import { createClient } from '@/lib/supabase/client';

interface PeakPopupProps {
  peak: Peak;
  visits: VisitWithPhotos[];
  profiles: Profile[];
  currentUserId: string | null;
  profileColorMap: Map<string, string>;
  onClose: () => void;
}

export function PeakPopup({
  peak,
  visits,
  profiles,
  currentUserId,
  profileColorMap,
  onClose,
}: PeakPopupProps) {
  const t = useTranslations('peak');
  const tCommon = useTranslations('common');
  const [showForm, setShowForm] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string[]>>(new Map());

  const supabase = createClient();
  const myVisit = visits.find((v) => v.user_id === currentUserId);

  const difficultyLabels = {
    easy: t('easy'),
    moderate: t('moderate'),
    demanding: t('demanding'),
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    moderate: 'bg-yellow-100 text-yellow-700',
    demanding: 'bg-red-100 text-red-700',
  };

  function getPhotoUrl(path: string) {
    const { data } = supabase.storage.from('visit-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl border-l border-gray-200 flex flex-col z-10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400 font-mono">HPO #{peak.hpo_number}</span>
            {peak.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[peak.difficulty]}`}>
                {difficultyLabels[peak.difficulty]}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-800">{peak.name_hr}</h2>
          {peak.elevation_m && (
            <p className="text-sm text-gray-500">{peak.elevation_m} {tCommon('meters')}</p>
          )}
          {peak.section_hr && (
            <p className="text-xs text-gray-400 mt-0.5">{peak.section_hr}</p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">
          ×
        </button>
      </div>

      {/* Visits */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {visits.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{t('noVisits')}</p>
        ) : (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('visitedBy')}</p>
            {visits.map((visit) => {
              const profile = profiles.find((p) => p.id === visit.user_id);
              const color = profileColorMap.get(visit.user_id) ?? '#9CA3AF';

              return (
                <div key={visit.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-sm text-gray-800">
                      {profile?.display_name ?? tCommon('unknown')}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(visit.visited_at).toLocaleDateString('hr-HR')}
                    </span>
                  </div>

                  {visit.note && (
                    <p className="text-sm text-gray-600 italic mb-2">"{visit.note}"</p>
                  )}

                  {visit.visit_photos && visit.visit_photos.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {visit.visit_photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={getPhotoUrl(photo.storage_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={getPhotoUrl(photo.storage_path)}
                            alt={photo.caption ?? peak.name_hr}
                            className="w-16 h-16 object-cover rounded-lg hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Action */}
      {currentUserId && !showForm && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-green-700 text-white py-2.5 rounded-lg font-medium hover:bg-green-800 transition-colors text-sm"
          >
            {myVisit ? t('editVisit') : t('markVisited')}
          </button>
        </div>
      )}

      {showForm && currentUserId && (
        <VisitForm
          peak={peak}
          existingVisit={myVisit}
          userId={currentUserId}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            window.location.reload();
          }}
        />
      )}

      {!currentUserId && (
        <div className="p-4 border-t border-gray-100">
          <a
            href="/login"
            className="block text-center text-sm text-green-700 hover:underline"
          >
            Prijavi se za bilježenje posjeta
          </a>
        </div>
      )}
    </div>
  );
}
