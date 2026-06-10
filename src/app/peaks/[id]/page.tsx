import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Peak, VisitWithPhotos, Profile } from '@/types';
import { PeakVisitSection } from './PeakVisitSection';

interface Props {
  params: Promise<{ id: string }>;
}

const weatherLabels: Record<string, string> = {
  sunny: 'Sunčano ☀️',
  cloudy: 'Oblačno ⛅',
  foggy: 'Maglovito 🌫️',
  rainy: 'Kišovito 🌧️',
  snowy: 'Snijeg ❄️',
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export default async function PeakDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [peakRes, visitsRes, userRes] = await Promise.all([
    supabase.from('peaks').select('*').eq('id', id).single(),
    supabase.from('visits').select('*, visit_photos(*), profiles(*)').eq('peak_id', id).order('visited_at'),
    supabase.auth.getUser(),
  ]);

  if (!peakRes.data) notFound();

  const peak = peakRes.data as Peak;
  const visits = (visitsRes.data ?? []) as VisitWithPhotos[];
  const currentUserId = userRes.data.user?.id ?? null;
  const existingVisit = visits.find((v) => v.user_id === currentUserId) ?? null;

  const difficultyLabels: Record<string, string> = {
    easy: 'Lako',
    moderate: 'Srednje',
    demanding: 'Zahtjevno',
  };

  const supabaseForUrl = await createClient();

  function getPhotoUrl(path: string) {
    const { data } = supabaseForUrl.storage.from('visit-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full">
      <Link href="/peaks" className="text-sm text-green-700 hover:underline mb-6 inline-block">
        ← Svi vrhovi
      </Link>

      {/* Peak header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-gray-600 mb-1">HPO #{peak.hpo_number}</p>
            <h1 className="text-2xl font-bold text-gray-800">{peak.name_hr}</h1>
            {peak.name_en && peak.name_en !== peak.name_hr && (
              <p className="text-sm text-gray-500 italic">{peak.name_en}</p>
            )}
          </div>
          {peak.difficulty && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {difficultyLabels[peak.difficulty] ?? peak.difficulty}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {peak.elevation_m && (
            <div>
              <p className="text-gray-500 text-xs">Nadmorska visina</p>
              <p className="font-semibold text-gray-800">{peak.elevation_m} m</p>
            </div>
          )}
          {peak.section_hr && (
            <div>
              <p className="text-gray-500 text-xs">Područje</p>
              <p className="font-semibold text-gray-800">{peak.section_hr}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500 text-xs">GPS</p>
            <p className="font-mono text-xs text-gray-700">
              {peak.latitude.toFixed(4)}, {peak.longitude.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Posjeti</p>
            <p className="font-semibold text-gray-800">{visits.length}</p>
          </div>
        </div>
      </div>

      {/* Mark as visited button (logged-in users) or login prompt (empty state) */}
      {(currentUserId || visits.length === 0) && (
        <div className="mb-6">
          <PeakVisitSection
            peak={peak}
            currentUserId={currentUserId}
            existingVisit={existingVisit}
          />
        </div>
      )}

      {/* Visits list */}
      {visits.length > 0 && (
        <>
          <h2 className="font-semibold text-gray-800 mb-4">
            Tko je posjetio ({visits.length})
          </h2>
          <div className="space-y-4">
            {visits.map((visit) => {
              const profile = visit.profiles as unknown as Profile;
              const isMyVisit = visit.user_id === currentUserId;

              return (
                <div
                  key={visit.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 ${isMyVisit ? 'border-green-200' : 'border-gray-100'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800">
                      {profile?.display_name ?? 'Nepoznato'}
                      {isMyVisit && <span className="ml-2 text-xs text-green-600 font-normal">(ti)</span>}
                    </span>
                    <span className="text-sm text-gray-600">
                      {visit.visited_at
                        ? new Date(visit.visited_at).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>

                  {/* Extra visit details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    {visit.companions && (
                      <span className="text-xs text-gray-600">👥 {visit.companions}</span>
                    )}
                    {visit.start_point && (
                      <span className="text-xs text-gray-600">📍 {visit.start_point}</span>
                    )}
                    {visit.weather && (
                      <span className="text-xs text-gray-600">{weatherLabels[visit.weather] ?? visit.weather}</span>
                    )}
                    {visit.duration_minutes && (
                      <span className="text-xs text-gray-600">⏱ {formatDuration(visit.duration_minutes)}</span>
                    )}
                  </div>

                  {visit.note && (
                    <p className="text-sm text-gray-700 italic mb-3">"{visit.note}"</p>
                  )}

                  {visit.visit_photos && visit.visit_photos.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {visit.visit_photos.map((photo) => (
                        <a key={photo.id} href={getPhotoUrl(photo.storage_path)} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getPhotoUrl(photo.storage_path)}
                            alt={photo.caption ?? peak.name_hr}
                            className="w-20 h-20 object-cover rounded-xl hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* If logged in but no visits yet, show a softer note below the button */}
      {currentUserId && visits.length === 0 && (
        <p className="text-center text-gray-500 text-sm mt-4">Nitko još nije posjetio ovaj vrh. Budi prvi/a!</p>
      )}
    </div>
  );
}
