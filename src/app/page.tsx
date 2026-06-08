import { createClient } from '@/lib/supabase/server';
import { MapWrapper } from '@/components/Map/MapWrapper';
import type { Peak, Profile, VisitWithPhotos } from '@/types';

export default async function MapPage() {
  const supabase = await createClient();

  const [peaksRes, profilesRes, visitsRes, userRes] = await Promise.all([
    supabase.from('peaks').select('*').order('hpo_number'),
    supabase.from('profiles').select('*').order('display_name'),
    supabase.from('visits').select('*, visit_photos(*), profiles(*)').order('visited_at'),
    supabase.auth.getUser(),
  ]);

  const peaks = (peaksRes.data ?? []) as Peak[];
  const profiles = (profilesRes.data ?? []) as Profile[];
  const visits = (visitsRes.data ?? []) as VisitWithPhotos[];
  const currentUserId = userRes.data.user?.id ?? null;

  return (
    <div className="flex-1 flex">
      <MapWrapper
        peaks={peaks}
        profiles={profiles}
        visits={visits}
        currentUserId={currentUserId}
      />
    </div>
  );
}
