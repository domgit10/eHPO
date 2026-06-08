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

  function getMarkerColor(peakId: string): string {
    const peakVisits = visitsByPeak.get(peakId) ?? [];
    if (selectedUserIds.length === 0) {
      return peakVisits.length === 0 ? '#9CA3AF' : '#16A34A';
    }
    const matchingVisits = peakVisits.filter((v) => selectedUserIds.includes(v.user_id));
    if (matchingVisits.length === 0) {
      const anyoneVisited = peakVisits.length > 0;
      if (selectedUserIds.length === profiles.length && !anyoneVisited) return '#EF4444';
      return '#D1D5DB';
    }
    // Color of the first matching user
    return profileColorMap.get(matchingVisits[0].user_id) ?? '#16A34A';
  }

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current!, {
        center: [45.1, 16.0],
        zoom: 7,
        zoomControl: true,
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
          .addTo(map)
          .on('click', () => setSelectedPeak(peak));

        markersRef.current.set(peak.id, marker);
      });
    };

    initMap();
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

      <div ref={mapRef} className="flex-1 z-0" style={{ minHeight: '500px' }} />

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
