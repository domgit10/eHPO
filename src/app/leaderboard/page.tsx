import { createClient } from '@/lib/supabase/server';
import { getAchievement, getPercentage, HPO_TOTAL } from '@/lib/achievements';

interface ProfileWithCount {
  id: string;
  display_name: string;
  hiking_club: string | null;
  visitCount: number;
}

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, hiking_club');

  const { data: visitCounts } = await supabase
    .from('visits')
    .select('user_id');

  const countMap = new Map<string, number>();
  for (const v of visitCounts ?? []) {
    countMap.set(v.user_id, (countMap.get(v.user_id) ?? 0) + 1);
  }

  const ranked: ProfileWithCount[] = (profiles ?? [])
    .map((p) => ({ ...p, visitCount: countMap.get(p.id) ?? 0 }))
    .sort((a, b) => b.visitCount - a.visitCount);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Ljestvica planinara</h1>
      <p className="text-gray-600 text-sm mb-8">Tko je obišao najviše HPO vrhova?</p>

      {ranked.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-4xl mb-3">⛰</p>
          <p className="text-gray-600">Još nema posjeta. Budi prvi/a!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map((person, index) => {
            const rank = index + 1;
            const achievement = getAchievement(person.visitCount);
            const pct = getPercentage(person.visitCount);
            const initial = person.display_name[0]?.toUpperCase() ?? '?';

            return (
              <div
                key={person.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4"
              >
                {/* Rank */}
                <span className={`text-sm font-bold w-6 text-center flex-shrink-0 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-500' : rank === 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {rank}
                </span>

                {/* Achievement icon */}
                <span className="text-xl flex-shrink-0" title={achievement.label}>
                  {achievement.icon}
                </span>

                {/* Avatar */}
                <span className="w-8 h-8 rounded-full bg-green-700 text-white text-sm flex items-center justify-center font-bold flex-shrink-0">
                  {initial}
                </span>

                {/* Name + club */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{person.display_name}</p>
                  {person.hiking_club && (
                    <p className="text-xs text-gray-500 truncate">{person.hiking_club}</p>
                  )}
                </div>

                {/* Peaks count + % */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">{person.visitCount}<span className="text-xs font-normal text-gray-500">/{HPO_TOTAL}</span></p>
                  <p className="text-xs text-gray-600">{pct}%</p>
                </div>

                {/* Progress bar */}
                <div className="w-20 flex-shrink-0">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Achievement legend */}
      <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Razine dostignuća</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { icon: '👑', label: 'Legendarni planinar', req: '153 vrhova' },
            { icon: '💎', label: 'Dijamantni planinar', req: '100+ vrhova' },
            { icon: '🥇', label: 'Zlatni planinar', req: '75+ vrhova' },
            { icon: '🥈', label: 'Srebrni planinar', req: '50+ vrhova' },
            { icon: '🥉', label: 'Brončani planinar', req: '25+ vrhova' },
            { icon: '🥾', label: 'Novak planinar', req: '0+ vrhova' },
          ].map((a) => (
            <div key={a.icon} className="flex items-center gap-2">
              <span className="text-lg">{a.icon}</span>
              <div>
                <p className="text-xs font-medium text-gray-700">{a.label}</p>
                <p className="text-xs text-gray-500">{a.req}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
