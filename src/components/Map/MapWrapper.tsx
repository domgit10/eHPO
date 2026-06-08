'use client';

import dynamic from 'next/dynamic';
import type { Peak, Profile, VisitWithPhotos } from '@/types';

const MapView = dynamic(
  () => import('./MapView').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Učitavanje karte...
      </div>
    ),
  }
);

interface MapWrapperProps {
  peaks: Peak[];
  profiles: Profile[];
  visits: VisitWithPhotos[];
  currentUserId: string | null;
}

export function MapWrapper(props: MapWrapperProps) {
  return <MapView {...props} />;
}
