'use client';

import React from 'react';
import ErrorBoundaryWithTranslation from '../components/ErrorBoundary';

interface ErrorBoundaryProviderProps {
  children: React.ReactNode;
}

const ErrorBoundaryProvider: React.FC<ErrorBoundaryProviderProps> = ({ children }) => {
  return <ErrorBoundaryWithTranslation>{children}</ErrorBoundaryWithTranslation>;
};

export default ErrorBoundaryProvider;
