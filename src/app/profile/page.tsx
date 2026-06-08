import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileClient } from './ProfileClient';
import type { Peak, Visit } from '@/types';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profileRes, visitsRes, peaksRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('visits').select('*').eq('user_id', user.id).order('visited_at', { ascending: false }),
    supabase.from('peaks').select('*').order('hpo_number'),
  ]);

  return (
    <ProfileClient
      profile={profileRes.data}
      visits={(visitsRes.data ?? []) as Visit[]}
      peaks={(peaksRes.data ?? []) as Peak[]}
    />
  );
}
