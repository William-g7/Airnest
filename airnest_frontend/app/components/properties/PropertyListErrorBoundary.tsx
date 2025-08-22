'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import ErrorBoundaryWithTranslation from '../ErrorBoundary';

interface PropertyListErrorBoundaryProps {
  children: React.ReactNode;
}

const PropertyListErrorBoundary: React.FC<PropertyListErrorBoundaryProps> = ({ children }) => {
  const t = useTranslations('properties');

  const customFallback = (
    <div className="w-full p-8 rounded-xl border border-gray-200 bg-gray-50 text-center">
      <div className="flex flex-col items-center justify-center">
        <svg className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.75m-.75 3h.75m-.75 3h.75m-3.75-16.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('loadError')}</h3>
        <p className="text-gray-600 mb-6">{t('errorMessage')}</p>
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-airbnb text-white rounded-lg hover:bg-airbnb_dark transition-colors"
          >
            {t('refreshPage')}
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {t('backToHome')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundaryWithTranslation fallback={customFallback}>
      {children}
    </ErrorBoundaryWithTranslation>
  );
};

export default PropertyListErrorBoundary;
