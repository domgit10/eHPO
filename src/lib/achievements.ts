export interface Achievement {
  icon: string;
  label: string;
  labelEn: string;
  level: number;
  minPeaks: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { level: 5, minPeaks: 153, icon: '👑', label: 'Legendarni planinar', labelEn: 'Legendary Mountaineer' },
  { level: 4, minPeaks: 100, icon: '💎', label: 'Dijamantni planinar', labelEn: 'Diamond Mountaineer' },
  { level: 3, minPeaks: 75,  icon: '🥇', label: 'Zlatni planinar',     labelEn: 'Gold Mountaineer' },
  { level: 2, minPeaks: 50,  icon: '🥈', label: 'Srebrni planinar',    labelEn: 'Silver Mountaineer' },
  { level: 1, minPeaks: 25,  icon: '🥉', label: 'Brončani planinar',   labelEn: 'Bronze Mountaineer' },
  { level: 0, minPeaks: 0,   icon: '🥾', label: 'Novak planinar',      labelEn: 'Novice Mountaineer' },
];

export function getAchievement(visitCount: number): Achievement {
  return ACHIEVEMENTS.find((a) => visitCount >= a.minPeaks) ?? ACHIEVEMENTS[ACHIEVEMENTS.length - 1];
}

export const HPO_TOTAL = 153;

export function getPercentage(visitCount: number): number {
  return Math.round((visitCount / HPO_TOTAL) * 100);
}
