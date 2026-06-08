import { createClient } from '@/lib/supabase/server';
import { PeaksClient } from './PeaksClient';
import type { Peak } from '@/types';

export default async function PeaksPage() {
  const supabase = await createClient();

  const [peaksRes, visitsRes, userRes] = await Promise.all([
    supabase.from('peaks').select('*').order('hpo_number'),
    supabase.from('visits').select('user_id, peak_id, profiles(display_name)'),
    supabase.auth.getUser(),
  ]);

  const peaks = (peaksRes.data ?? []) as Peak[];
  const visits = visitsRes.data ?? [];
  const currentUserId = userRes.data.user?.id ?? null;

  // Count visitors per peak
  const visitorsByPeak = new Map<string, string[]>();
  for (const v of visits) {
    const row = v as unknown as { user_id: string; peak_id: string; profiles: { display_name: string } | null };
    const name = row.profiles?.display_name;
    if (!name) continue;
    const arr = visitorsByPeak.get(v.peak_id) ?? [];
    if (!arr.includes(name)) arr.push(name);
    visitorsByPeak.set(v.peak_id, arr);
  }

  // My visited peak ids
  const myVisitedIds = new Set(
    visits.filter((v) => v.user_id === currentUserId).map((v) => v.peak_id)
  );

  return <PeaksClient peaks={peaks} visitorsByPeak={visitorsByPeak} myVisitedIds={myVisitedIds} />;
}
