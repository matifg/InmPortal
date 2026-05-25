import { useState, useEffect, useCallback } from 'react';
import { readMembresiaFromStorage, refreshMembresiaFromApi } from '../lib/membresia';

export function useMembresia(refreshOnMount = true) {
  const [membresiaActiva, setMembresiaActiva] = useState(readMembresiaFromStorage);
  const [checking, setChecking] = useState(refreshOnMount);

  const refresh = useCallback(async () => {
    setChecking(true);
    const active = await refreshMembresiaFromApi();
    setMembresiaActiva(active);
    setChecking(false);
    return active;
  }, []);

  useEffect(() => {
    if (refreshOnMount) {
      refresh();
    }
  }, [refreshOnMount, refresh]);

  return { membresiaActiva, checking, refresh, setMembresiaActiva };
}
