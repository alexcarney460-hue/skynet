'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ApiKeyCtx {
  apiKey: string;
  setApiKey: (k: string) => void;
}

const Ctx = createContext<ApiKeyCtx>({ apiKey: '', setApiKey: () => {} });

export function useApiKey() {
  return useContext(Ctx);
}

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('skynetx_api_key');
    if (stored) setApiKeyState(stored);
  }, []);

  function setApiKey(k: string) {
    setApiKeyState(k);
    if (k) localStorage.setItem('skynetx_api_key', k);
    else localStorage.removeItem('skynetx_api_key');
  }

  return <Ctx.Provider value={{ apiKey, setApiKey }}>{children}</Ctx.Provider>;
}
