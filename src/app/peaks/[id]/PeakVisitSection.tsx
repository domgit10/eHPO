'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Peak, Visit } from '@/types';
import { VisitForm } from '@/components/VisitForm/VisitForm';

interface PeakVisitSectionProps {
  peak: Peak;
  currentUserId: string | null;
  existingVisit: Visit | null;
}

export function PeakVisitSection({ peak, currentUserId, existingVisit }: PeakVisitSectionProps) {
  const t = useTranslations('peak');
  const [showForm, setShowForm] = useState(false);

  if (!currentUserId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-4xl mb-3">⛰</p>
        <p className="text-gray-600 mb-2">Nitko još nije posjetio ovaj vrh.</p>
        <a href="/login" className="text-sm text-green-700 hover:underline font-medium">
          Prijavi se i budi prvi/a!
        </a>
      </div>
    );
  }

  if (showForm) {
    return (
      <VisitForm
        peak={peak}
        existingVisit={existingVisit ?? undefined}
        userId={currentUserId}
        onClose={() => setShowForm(false)}
        onSuccess={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-green-700 text-white py-2.5 rounded-xl font-medium hover:bg-green-800 transition-colors text-sm"
      >
        {existingVisit ? t('editVisit') : t('markVisited')}
      </button>
    </div>
  );
}
