'use client';

import { useEffect, useRef } from 'react';

interface ScriptWithNonceProps {
  nonce: string;
  id?: string;
  children: string;
}

export function ScriptWithNonce({ nonce, id, children }: ScriptWithNonceProps) {
  const scriptRef = useRef<HTMLScriptElement>(null);

  useEffect(() => {
    if (scriptRef.current) {
      const script = document.createElement('script');
      script.nonce = nonce;
      script.textContent = children;
      if (id) script.id = id;

      if (scriptRef.current.parentNode) {
        scriptRef.current.parentNode.replaceChild(script, scriptRef.current);
      }
    }
  }, [children, nonce, id]);

  return <script ref={scriptRef} nonce={nonce} suppressHydrationWarning />;
}
