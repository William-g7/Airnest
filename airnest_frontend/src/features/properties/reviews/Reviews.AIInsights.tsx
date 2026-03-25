'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface AIInsightsData {
  highlights: string[];
  concerns: string[];
  best_for: string[];
  summary_text: string;
  reviews_count_at_generation: number;
  generated_at: string;
  source?: string;
}

interface Props {
  propertyId: string;
  totalReviews: number;
}

const HeartIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1024 1024" fill="#ff385c">
    <path d="M512 901.746939c-13.583673 0-26.122449-4.179592-37.093878-13.061225-8.881633-7.314286-225.697959-175.020408-312.424489-311.379592C133.746939 532.37551 94.040816 471.24898 94.040816 384.522449c0-144.718367 108.146939-262.269388 240.326531-262.269388 67.395918 0 131.657143 30.82449 177.632653 84.636735 45.453061-54.334694 109.191837-84.636735 177.110204-84.636735 132.702041 0 240.326531 117.55102 240.326531 262.269388 0 85.159184-37.093878 143.673469-67.395919 191.216327l-1.044898 1.567346c-86.726531 136.359184-303.542857 304.587755-312.424489 311.379592-10.44898 8.359184-22.987755 13.061224-36.571429 13.061225z" />
  </svg>
);

const InfoIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1024 1024" fill="#ff385c">
    <path d="M512 147.2C310.528 147.2 147.2 310.528 147.2 512S310.528 876.8 512 876.8 876.8 713.472 876.8 512 713.472 147.2 512 147.2z m0 64c166.144 0 300.8 134.656 300.8 300.8S678.144 812.8 512 812.8 211.2 678.144 211.2 512 345.856 211.2 512 211.2z" />
    <path d="M478.72 462.3104m33.28 0l0 0q33.28 0 33.28 33.28l0 173.056q0 33.28-33.28 33.28l0 0q-33.28 0-33.28-33.28l0-173.056q0-33.28 33.28-33.28Z" />
    <path d="M512 370.7136m-48.64 0a48.64 48.64 0 1 0 97.28 0 48.64 48.64 0 1 0-97.28 0Z" />
  </svg>
);

const PeopleIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1025 1024" fill="#ff385c">
    <path d="M762.6 88m-88 0a88 88 0 1 0 176 0 88 88 0 1 0-176 0Z" />
    <path d="M1023.9 570.7l-69.5-260c-18.7-70-82.2-118.7-154.6-118.7H725.5c-33.6 0-65.3 10.5-91.4 28.7-26.2-18.2-57.8-28.7-91.4-28.7h-74.3c-72.4 0-135.9 48.7-154.6 118.7l-69.5 260c-0.9 3.5-1.4 6.9-1.4 10.4 0 16.7 10.6 32.1 26.9 37.8l-13.2 22.9-3.3-11.8c-11.7-41.3-49.4-69.9-92.4-69.9h-29.8c-43.4 0-81.5 29.2-92.7 71.1L0.8 771.2c-0.5 1.9-0.8 3.9-0.8 5.8 0 9.9 6.6 18.9 16.5 21.5 11.9 3.2 24.1-3.9 27.3-15.8l36.2-135c0.6-2.3 3.9-1.8 3.9 0.5V1016c0 4.4 3.6 8 8 8h37.5c4.4 0 8-3.6 8-8V808.9c0-4.4 3.6-8 8-8h1.8c4.4 0 8 3.6 8 8V1016c0 4.4 3.6 8 8 8h37.5c4.4 0 8-3.6 8-8V651.4c0-2.3 3.3-2.8 3.9-0.5l9.4 35c1 3.9 2.9 7.5 5.3 10.7 2.4 3.2 5.5 5.8 9 7.9 14.6 8.4 33.3 3.4 41.8-11.2l39.1-67.7c2-3.5 3-7.3 3-11.1 0-4.3-1.2-8.5-3.6-12.1 2.1-3.3 3.8-7 4.8-11l64.1-239c1.2-4.5 7.9-3.6 7.9 1V1008c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16V640c0-4.4 1.8-8.4 4.7-11.3 2.9-2.9 6.9-4.7 11.3-4.7 8.8 0 16 7.2 16 16v368c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16V720h29.2c2.2 0 4 1.8 4 4v284c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16V724c0-2.2 1.8-4 4-4h24c2.2 0 4 1.8 4 4v284c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16V724c0-2.2 1.8-4 4-4h38.1c10.8 0 18.5-10.5 15.3-20.8l-48.8-156.8c-5.8-18.5-8.7-37.7-8.7-57.1v-132c0-4.6 6.7-5.5 7.9-1l64.1 239c5.7 21.3 27.7 34 49 28.3 21.5-5.7 34.1-27.6 28.4-48.9z m-373.3-85.4c0 19.4-2.9 38.6-8.7 57.1L617.5 620.9V446.3l16.5-61.6 16.6 61.9v38.7z" />
    <path d="M147.5 456m-88 0a88 88 0 1 0 176 0 88 88 0 1 0-176 0Z" />
    <path d="M505.5 88m-88 0a88 88 0 1 0 176 0 88 88 0 1 0-176 0Z" />
  </svg>
);

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-gray-50/60 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <div className="h-5 bg-gray-200 rounded w-32" />
        <div className="ml-auto h-4 bg-gray-200 rounded w-20" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-5" />
      <div className="flex flex-wrap gap-2 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-8 bg-gray-200 rounded-full w-28" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2].map(i => (
          <div key={i} className="h-8 bg-gray-200 rounded-full w-32" />
        ))}
      </div>
    </div>
  );
}

export default function ReviewsAIInsights({ propertyId, totalReviews }: Props) {
  const locale = useLocale();
  const t = useTranslations('reviews');
  const [data, setData] = useState<AIInsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (totalReviews < 3) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/reviews/${propertyId}/ai-summary?locale=${locale}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [propertyId, locale, totalReviews]);

  if (totalReviews < 3) return null;
  if (error) return null;
  if (loading) return <Skeleton />;
  if (!data) return null;

  const hasHighlights = data.highlights.length > 0;
  const hasConcerns = data.concerns.length > 0;
  const hasBestFor = data.best_for.length > 0;

  if (!hasHighlights && !hasConcerns && !hasBestFor) return null;

  const relativeTime = (() => {
    if (!data.generated_at) return '';
    const diff = Date.now() - new Date(data.generated_at).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t('aiJustNow');
    if (hours < 24) return t('aiHoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('aiDaysAgo', { count: days });
  })();

  return (
    <div className="rounded-2xl border border-red-100/80 bg-gradient-to-br from-rose-50/60 via-white to-rose-50/30 p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-airbnb/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-airbnb" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">{t('aiInsightsTitle')}</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {t('aiBasedOn', { count: data.reviews_count_at_generation })}
          </span>
        </div>
        {relativeTime && (
          <span className="text-xs text-gray-400">{relativeTime}</span>
        )}
      </div>

      {/* Summary sentence */}
      {data.summary_text && (
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">&ldquo;{data.summary_text}&rdquo;</p>
      )}

      <div className="space-y-5">
        {/* Highlights */}
        {hasHighlights && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HeartIcon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-800">{t('aiHighlights')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.highlights.map((h, i) => (
                <span
                  key={i}
                  className="text-xs px-3.5 py-1.5 rounded-full bg-white text-gray-700 border border-gray-200/80 shadow-sm font-medium transition-all hover:shadow-md hover:border-airbnb/30"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {hasConcerns && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-800">{t('aiConcerns')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.concerns.map((c, i) => (
                <span
                  key={i}
                  className="text-xs px-3.5 py-1.5 rounded-full bg-white text-gray-600 border border-amber-200/80 shadow-sm font-medium transition-all hover:shadow-md hover:border-amber-300"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Best for */}
        {hasBestFor && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PeopleIcon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-800">{t('aiBestFor')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.best_for.map((b, i) => (
                <span
                  key={i}
                  className="text-xs px-3.5 py-1.5 rounded-full bg-airbnb/5 text-airbnb border border-airbnb/15 shadow-sm font-semibold transition-all hover:shadow-md hover:bg-airbnb/10"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
