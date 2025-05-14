'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import ErrorBoundaryWithTranslation from '../ErrorBoundary';

interface AuthModalErrorBoundaryProps {
  children: React.ReactNode;
}

const AuthModalErrorBoundary: React.FC<AuthModalErrorBoundaryProps> = ({ children }) => {
  return <ErrorBoundaryWithTranslation>{children}</ErrorBoundaryWithTranslation>;
};

export default AuthModalErrorBoundary;
