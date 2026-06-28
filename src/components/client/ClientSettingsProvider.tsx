'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clientSettingsApi } from '@/lib/api';
import { defaultClientSettings, mergeClientSettings } from '@/lib/client-settings';
import { PublicClientSettings } from '@/types';

type ClientSettingsContextValue = {
  settings: PublicClientSettings;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ClientSettingsContext = createContext<ClientSettingsContextValue | null>(null);

export function ClientSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicClientSettings>(defaultClientSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientSettingsApi.getPublic();
      setSettings(mergeClientSettings(response.data));
    } catch (nextError) {
      console.error(nextError);
      setSettings(defaultClientSettings);
      setError('client_settings_load_failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      refresh,
    }),
    [settings, loading, error],
  );

  return <ClientSettingsContext.Provider value={value}>{children}</ClientSettingsContext.Provider>;
}

export function useClientSettings() {
  const context = useContext(ClientSettingsContext);
  if (!context) {
    throw new Error('useClientSettings must be used inside ClientSettingsProvider');
  }
  return context;
}
