'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Peak, Visit } from '@/types';

interface VisitFormProps {
  peak: Peak;
  existingVisit?: Visit;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function VisitForm({ peak, existingVisit, userId, onClose, onSuccess }: VisitFormProps) {
  const t = useTranslations('visitForm');
  const [date, setDate] = useState(
    existingVisit?.visited_at ?? new Date().toISOString().split('T')[0]
  );
  const [unknownDate, setUnknownDate] = useState(!!(existingVisit && existingVisit.visited_at == null));
  const [companions, setCompanions] = useState(existingVisit?.companions ?? '');
  const [startPoint, setStartPoint] = useState(existingVisit?.start_point ?? '');
  const [weather, setWeather] = useState(existingVisit?.weather ?? '');
  const [durationHours, setDurationHours] = useState(
    existingVisit?.duration_minutes != null ? Math.floor(existingVisit.duration_minutes / 60).toString() : ''
  );
  const [durationMins, setDurationMins] = useState(
    existingVisit?.duration_minutes != null ? (existingVisit.duration_minutes % 60).toString() : ''
  );
  const [note, setNote] = useState(existingVisit?.note ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  function getDurationMinutes(): number | null {
    const h = parseInt(durationHours) || 0;
    const m = parseInt(durationMins) || 0;
    const total = h * 60 + m;
    return total > 0 ? total : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let visitId = existingVisit?.id;
      const payload = {
        visited_at: unknownDate ? null : date,
        note: note || null,
        companions: companions || null,
        start_point: startPoint || null,
        weather: (weather || null) as Visit['weather'],
        duration_minutes: getDurationMinutes(),
      };

      if (existingVisit) {
        const { error: updateErr } = await supabase
          .from('visits')
          .update(payload)
          .eq('id', existingVisit.id);
        if (updateErr) throw updateErr;
      } else {
        const { data, error: insertErr } = await supabase
          .from('visits')
          .insert({ user_id: userId, peak_id: peak.id, ...payload })
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        visitId = data.id;
      }

      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${visitId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('visit-photos')
          .upload(path, file, { upsert: false });
        if (uploadErr) throw uploadErr;
        await supabase.from('visit_photos').insert({ visit_id: visitId, storage_path: path });
      }

      onSuccess();
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files).slice(0, 5));
  }

  return (
    <div className="border-t border-gray-100 p-4 bg-gray-50 overflow-y-auto max-h-[70vh]">
      <h3 className="font-semibold text-sm text-gray-800 mb-3">{t('title')} — {peak.name_hr}</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Date */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-700">{t('dateLabel')}</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={unknownDate}
                onChange={(e) => setUnknownDate(e.target.checked)}
                className="w-3 h-3 accent-green-600"
              />
              <span className="text-xs text-gray-500">{t('unknownDate')}</span>
            </label>
          </div>
          {!unknownDate && (
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          )}
        </div>

        {/* Companions */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('companionsLabel')}</label>
          <input
            type="text"
            value={companions}
            onChange={(e) => setCompanions(e.target.value)}
            placeholder={t('companionsPlaceholder')}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Start point */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('startPointLabel')}</label>
          <input
            type="text"
            value={startPoint}
            onChange={(e) => setStartPoint(e.target.value)}
            placeholder={t('startPointPlaceholder')}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Weather */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('weatherLabel')}</label>
          <select
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">{t('weatherSelect')}</option>
            <option value="sunny">{t('weatherSunny')}</option>
            <option value="cloudy">{t('weatherCloudy')}</option>
            <option value="foggy">{t('weatherFoggy')}</option>
            <option value="rainy">{t('weatherRainy')}</option>
            <option value="snowy">{t('weatherSnowy')}</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('durationLabel')}</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={0}
              max={24}
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              placeholder="0"
              className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="text-xs text-gray-600">{t('durationHours')}</span>
            <input
              type="number"
              min={0}
              max={59}
              value={durationMins}
              onChange={(e) => setDurationMins(e.target.value)}
              placeholder="0"
              className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="text-xs text-gray-600">{t('durationMinutes')}</span>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('noteLabel')}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('photosLabel')}</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <p className="text-xs text-gray-500 mt-1">{t('photosHint')}</p>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
