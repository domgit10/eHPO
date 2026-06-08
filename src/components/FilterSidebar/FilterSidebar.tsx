'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Profile, VisitWithPhotos } from '@/types';

interface FilterSidebarProps {
  profiles: Profile[];
  selectedUserIds: string[];
  onSelectionChange: (ids: string[]) => void;
  visits: VisitWithPhotos[];
  profileColorMap: Map<string, string>;
}

export function FilterSidebar({
  profiles,
  selectedUserIds,
  onSelectionChange,
  visits,
  profileColorMap,
}: FilterSidebarProps) {
  const t = useTranslations('map');
  const [collapsed, setCollapsed] = useState(false);

  const visitCountByUser = new Map<string, number>();
  for (const v of visits) {
    visitCountByUser.set(v.user_id, (visitCountByUser.get(v.user_id) ?? 0) + 1);
  }

  function toggle(userId: string) {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedUserIds, userId]);
    }
  }

  function toggleAll() {
    if (selectedUserIds.length === profiles.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(profiles.map((p) => p.id));
    }
  }

  return (
    <div
      className={`bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-200 ${
        collapsed ? 'w-10' : 'w-56'
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2.5 text-gray-400 hover:text-gray-700 self-end text-xs"
        title={collapsed ? 'Otvori filtar' : 'Zatvori filtar'}
      >
        {collapsed ? '▶' : '◀'}
      </button>

      {!collapsed && (
        <div className="px-3 pb-4 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('filterTitle')}
          </p>

          <button
            onClick={toggleAll}
            className="w-full text-left text-xs text-green-700 font-medium mb-3 hover:underline"
          >
            {selectedUserIds.length === profiles.length ? 'Isključi sve' : 'Uključi sve'}
          </button>

          <div className="space-y-2">
            {profiles.map((profile) => {
              const color = profileColorMap.get(profile.id) ?? '#9CA3AF';
              const count = visitCountByUser.get(profile.id) ?? 0;
              const checked = selectedUserIds.includes(profile.id);

              return (
                <label key={profile.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(profile.id)}
                    className="sr-only"
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all"
                    style={{
                      backgroundColor: checked ? color : 'transparent',
                      borderColor: color,
                    }}
                  />
                  <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-gray-900">
                    {profile.display_name}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{count}</span>
                </label>
              );
            })}
          </div>

          {selectedUserIds.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Crvene oznake = nitko od označenih nije posjetio
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
