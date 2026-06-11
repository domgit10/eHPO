'use client';

import { useEffect, useRef, useState } from 'react';
import type { Peak, Visit, Profile, VisitWithPhotos } from '@/types';
import { USER_COLORS } from '@/types';
import { PeakPopup } from '@/components/PeakPopup/PeakPopup';
import { FilterSidebar } from '@/components/FilterSidebar/FilterSidebar';

interface MapViewProps {
  peaks: Peak[];
  profiles: Profile[];
  visits: VisitWithPhotos[];
  currentUserId: string | null;
}

export function MapView({ peaks, profiles, visits, currentUserId }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<Map<string, import('leaflet').CircleMarker>>(new Map());
  const [selectedPeak, setSelectedPeak] = useState<Peak | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Build visit lookup: peakId -> [VisitWithPhotos]
  const visitsByPeak = new Map<string, VisitWithPhotos[]>();
  for (const visit of visits) {
    const arr = visitsByPeak.get(visit.peak_id) ?? [];
    arr.push(visit);
    visitsByPeak.set(visit.peak_id, arr);
  }

  // Per-profile color map
  const profileColorMap = new Map<string, string>();
  profiles.forEach((p, i) => profileColorMap.set(p.id, USER_COLORS[i % USER_COLORS.length]));

  const ORANGE_NO_STAMP = '#F97316';

  function getMarkerColor(peakId: string): string {
    const peakVisits = visitsByPeak.get(peakId) ?? [];

    if (selectedUserIds.length === 0) {
      if (peakVisits.length === 0) return '#9CA3AF';
      return peakVisits.some((v) => v.stamp_collected) ? '#16A34A' : ORANGE_NO_STAMP;
    }

    const matchingVisits = peakVisits.filter((v) => selectedUserIds.includes(v.user_id));
    if (matchingVisits.length === 0) {
      return selectedUserIds.length === 1 ? '#9CA3AF' : '#EF4444';
    }

    const withStamp = matchingVisits.find((v) => v.stamp_collected);
    if (withStamp) return profileColorMap.get(withStamp.user_id) ?? '#16A34A';
    return ORANGE_NO_STAMP;
  }

  useEffect(() => {
    if (!mapRef.current) return;

    let map: import('leaflet').Map | null = null;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!mapRef.current) return;

      map = L.map(mapRef.current, {
        center: [45.1, 16.0],
        zoom: 7,
        zoomControl: true,
        preferCanvas: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      leafletMap.current = map;

      peaks.forEach((peak) => {
        const color = getMarkerColor(peak.id);
        const marker = L.circleMarker([peak.latitude, peak.longitude], {
          radius: 7,
          fillColor: color,
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .addTo(map!)
          .on('click', () => setSelectedPeak(peak));

        markersRef.current.set(peak.id, marker);
      });

      setMapReady(true);
    };

    initMap();

    return () => {
      map?.remove();
      leafletMap.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Update marker colors when filters change
  useEffect(() => {
    markersRef.current.forEach((marker, peakId) => {
      const color = getMarkerColor(peakId);
      marker.setStyle({ fillColor: color });
    });
  }, [selectedUserIds, visits]);

  return (
    <div className="flex-1 flex relative">
      <FilterSidebar
        profiles={profiles}
        selectedUserIds={selectedUserIds}
        onSelectionChange={setSelectedUserIds}
        visits={visits}
        profileColorMap={profileColorMap}
      />

      <div ref={mapRef} className="flex-1 z-0 relative" style={{ minHeight: '500px' }}>
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <span className="text-sm text-gray-500">Učitavanje karte...</span>
          </div>
        )}
      </div>

      {selectedPeak && (
        <PeakPopup
          peak={selectedPeak}
          visits={visitsByPeak.get(selectedPeak.id) ?? []}
          profiles={profiles}
          currentUserId={currentUserId}
          profileColorMap={profileColorMap}
          onClose={() => setSelectedPeak(null)}
        />
      )}
    </div>
  );
}
