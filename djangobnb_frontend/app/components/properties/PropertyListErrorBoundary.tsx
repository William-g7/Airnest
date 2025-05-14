'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import ErrorBoundaryWithTranslation from '../ErrorBoundary';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface PropertyListErrorBoundaryProps {
  children: React.ReactNode;
}

const PropertyListErrorBoundary: React.FC<PropertyListErrorBoundaryProps> = ({ children }) => {
  const t = useTranslations('properties');

  const customFallback = (
    <div className="w-full p-8 rounded-xl border border-gray-200 bg-gray-50 text-center">
      <div className="flex flex-col items-center justify-center">
        <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mb-4" />
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
