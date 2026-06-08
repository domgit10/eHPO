'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { Peak } from '@/types';

interface PeaksClientProps {
  peaks: Peak[];
  visitorsByPeak: Map<string, string[]>;
  myVisitedIds: Set<string>;
}

const SECTIONS = ['Sva područja', 'Samoborsko gorje', 'Žumberačko gorje', 'Medvednica', 'Zagorje',
  'Kalnički prigorje', 'Bilogorsko gorje', 'Moslavačka gora', 'Psunj i Papuk', 'Brodsko gorje',
  'Gorski kotar', 'Primorje i Kvarner', 'Lika', 'Sjeverni Velebit', 'Srednji Velebit',
  'Južni Velebit', 'Dinara', 'Dalmatinska zagora', 'Biokovo', 'Pelješac', 'Otoci'];

export function PeaksClient({ peaks, visitorsByPeak, myVisitedIds }: PeaksClientProps) {
  const t = useTranslations('peaks');
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('Sva područja');
  const [sort, setSort] = useState<'hpo' | 'elevation' | 'name'>('hpo');

  const difficultyColors: Record<string, string> = {
    easy: 'text-green-600',
    moderate: 'text-yellow-600',
    demanding: 'text-red-600',
  };
  const difficultyLabels: Record<string, string> = {
    easy: 'Lako',
    moderate: 'Srednje',
    demanding: 'Zahtjevno',
  };

  const filtered = peaks
    .filter((p) => {
      const matchSearch = p.name_hr.toLowerCase().includes(search.toLowerCase());
      const matchSection = section === 'Sva područja' || p.section_hr === section;
      return matchSearch && matchSection;
    })
    .sort((a, b) => {
      if (sort === 'hpo') return a.hpo_number - b.hpo_number;
      if (sort === 'elevation') return (b.elevation_m ?? 0) - (a.elevation_m ?? 0);
      return a.name_hr.localeCompare(b.name_hr);
    });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('title')} (153)</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {SECTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'hpo' | 'elevation' | 'name')}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="hpo">{t('sortHpo')}</option>
          <option value="elevation">{t('sortElevation')}</option>
          <option value="name">{t('sortName')}</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-1">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">{t('noResults')}</p>
        )}
        {filtered.map((peak) => {
          const visitors = visitorsByPeak.get(peak.id) ?? [];
          const isMine = myVisitedIds.has(peak.id);

          return (
            <Link
              key={peak.id}
              href={`/peaks/${peak.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-green-200 hover:shadow-sm transition-all group"
            >
              <span className="text-xs font-mono text-gray-300 w-8 flex-shrink-0">
                #{peak.hpo_number}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 group-hover:text-green-700 truncate">
                    {peak.name_hr}
                  </span>
                  {isMine && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>
                {peak.section_hr && (
                  <span className="text-xs text-gray-400">{peak.section_hr}</span>
                )}
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                {peak.difficulty && (
                  <span className={`text-xs ${difficultyColors[peak.difficulty] ?? 'text-gray-400'}`}>
                    {difficultyLabels[peak.difficulty] ?? peak.difficulty}
                  </span>
                )}
                {peak.elevation_m && (
                  <span className="text-xs text-gray-400 font-mono w-14 text-right">
                    {peak.elevation_m}m
                  </span>
                )}
                {visitors.length > 0 ? (
                  <div className="text-xs text-gray-500 text-right w-20 truncate">
                    {visitors.slice(0, 2).join(', ')}
                    {visitors.length > 2 && ` +${visitors.length - 2}`}
                  </div>
                ) : (
                  <span className="text-xs text-gray-200 w-20 text-right">—</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
