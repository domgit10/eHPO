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
  const [note, setNote] = useState(existingVisit?.note ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let visitId = existingVisit?.id;

      if (existingVisit) {
        const { error: updateErr } = await supabase
          .from('visits')
          .update({ visited_at: date, note: note || null })
          .eq('id', existingVisit.id);
        if (updateErr) throw updateErr;
      } else {
        const { data, error: insertErr } = await supabase
          .from('visits')
          .insert({ user_id: userId, peak_id: peak.id, visited_at: date, note: note || null })
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        visitId = data.id;
      }

      // Upload photos
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
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
  }

  return (
    <div className="border-t border-gray-100 p-4 bg-gray-50">
      <h3 className="font-semibold text-sm text-gray-800 mb-3">{t('title')} — {peak.name_hr}</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('dateLabel')}</label>
          <input
            type="date"
            required
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('noteLabel')}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('photosLabel')}</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <p className="text-xs text-gray-400 mt-1">{t('photosHint')}</p>
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
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
