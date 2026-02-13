'use client';

import { useTranslations } from 'next-intl';

export default function Description({ text, loading }: { text?: string; loading: boolean }) {
  const t = useTranslations('property');

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-4">{t('aboutPlace')}</h2>
      <p className="text-gray-600 whitespace-pre-line mb-6">
        {loading ? <span className="animate-pulse">{text}</span> : text}
      </p>
    </div>
  );
}
