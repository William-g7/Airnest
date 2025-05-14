'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';

const NonceContext = createContext<string>('');

function getNonceFromCookie(): string {
  if (typeof document === 'undefined') return '';

  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('csp-nonce=')) {
      return cookie.substring('csp-nonce='.length, cookie.length);
    }
  }
  return '';
}

export function NonceProvider({ children }: { children: ReactNode }) {
  const [nonce, setNonce] = useState<string>('');

  useEffect(() => {
    setNonce(getNonceFromCookie());
  }, []);

  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>;
}

export function useNonce(): string {
  return useContext(NonceContext);
}
