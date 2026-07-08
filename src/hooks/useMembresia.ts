import { useState, useEffect, useCallback } from 'react';
import { readMembresiaFromStorage, refreshMembresiaFromApi } from '../lib/membresia';

export function useMembresia(refreshOnMount = true) {
  const [membresiaActiva, setMembresiaActiva] = useState(readMembresiaFromStorage);
  const [checking, setChecking] = useState(refreshOnMount);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setMembresiaActiva(readMembresiaFromStorage());
      setChecking(false);
      return readMembresiaFromStorage();
    }

    setChecking(true);
    const active = await refreshMembresiaFromApi();
    setMembresiaActiva(active);
    setChecking(false);
    return active;
  }, []);

  useEffect(() => {
    if (refreshOnMount) {
      void refresh();
    }
  }, [refreshOnMount, refresh]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    const handleRefresh = () => {
      void refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh]);

  return { membresiaActiva, checking, refresh, setMembresiaActiva };
}
