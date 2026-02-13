'use client';

import { Toaster } from 'react-hot-toast';
import { BASE_TOAST_OPTIONS, TOAST_THEME_STYLES } from './toastStyles';

const containerStyle: React.CSSProperties = { zIndex: 9999 };

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerStyle={containerStyle}
      toastOptions={{
        ...BASE_TOAST_OPTIONS,
        success: {
          ...TOAST_THEME_STYLES.success,
          style: {
            ...BASE_TOAST_OPTIONS.style,
            ...TOAST_THEME_STYLES.success.style,
          },
        },
        error: {
          ...TOAST_THEME_STYLES.error,
          style: {
            ...BASE_TOAST_OPTIONS.style,
            ...TOAST_THEME_STYLES.error.style,
          },
        },
      }}
    />
  );
}
