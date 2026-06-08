import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Peak, VisitWithPhotos, Profile } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-gray-400 mb-1">HPO #{peak.hpo_number}</p>
            <h1 className="text-2xl font-bold text-gray-800">{peak.name_hr}</h1>
            {peak.name_en && peak.name_en !== peak.name_hr && (
              <p className="text-sm text-gray-400 italic">{peak.name_en}</p>
            )}
          </div>
          {peak.difficulty && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {difficultyLabels[peak.difficulty] ?? peak.difficulty}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {peak.elevation_m && (
            <div>
              <p className="text-gray-400 text-xs">Nadmorska visina</p>
              <p className="font-semibold text-gray-700">{peak.elevation_m} m</p>
            </div>
          )}
          {peak.section_hr && (
            <div>
              <p className="text-gray-400 text-xs">Područje</p>
              <p className="font-semibold text-gray-700">{peak.section_hr}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 text-xs">GPS</p>
            <p className="font-mono text-xs text-gray-500">
              {peak.latitude.toFixed(4)}, {peak.longitude.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Posjeti</p>
            <p className="font-semibold text-gray-700">{visits.length}</p>
          </div>
        </div>
      </div>

      {/* Visits */}
      <h2 className="font-semibold text-gray-700 mb-4">Tko je posjetio ({visits.length})</h2>

      {visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-4xl mb-3">⛰</p>
          <p className="text-gray-400">Nitko još nije posjetio ovaj vrh.</p>
          <Link href="/login" className="text-sm text-green-700 hover:underline mt-2 inline-block">
            Prijavi se i budi prvi/a!
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => {
            const profile = visit.profiles as unknown as Profile;

            return (
              <div key={visit.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-800">{profile?.display_name ?? 'Nepoznato'}</span>
                  <span className="text-sm text-gray-400">
                    {new Date(visit.visited_at).toLocaleDateString('hr-HR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>

                {visit.note && (
                  <p className="text-sm text-gray-600 italic mb-3">"{visit.note}"</p>
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
      )}
    </div>
  );
}
