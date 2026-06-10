export interface Peak {
  id: string;
  hpo_number: number;
  name_hr: string;
  name_en: string | null;
  latitude: number;
  longitude: number;
  elevation_m: number | null;
  section_hr: string | null;
  section_en: string | null;
  difficulty: 'easy' | 'moderate' | 'demanding' | null;
  description_hr: string | null;
  description_en: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  hiking_club: string | null;
  created_at: string;
}

export interface Visit {
  id: string;
  user_id: string;
  peak_id: string;
  visited_at: string | null;
  note: string | null;
  companions: string | null;
  start_point: string | null;
  weather: 'sunny' | 'cloudy' | 'foggy' | 'rainy' | 'snowy' | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface VisitPhoto {
  id: string;
  visit_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface VisitWithProfile extends Visit {
  profiles: Profile;
}

export interface VisitWithPhotos extends Visit {
  visit_photos: VisitPhoto[];
  profiles: Profile;
}

export interface PeakWithVisits extends Peak {
  visits: VisitWithPhotos[];
}

export type Locale = 'hr' | 'en';

export const USER_COLORS = [
  '#0D9488', // teal — red is reserved for map's "unvisited" state
  '#3182CE', // blue
  '#38A169', // green
  '#D69E2E', // yellow
  '#805AD5', // purple
  '#DD6B20', // orange
  '#00B5D8', // cyan
  '#D53F8C', // pink
] as const;
