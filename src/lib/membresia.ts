const STORAGE_KEY = 'membresiaActiva';

export const MEMBRESIA_INACTIVA_TOAST =
  'Tu membresía está inactiva. Reactivala para volver a publicar y mostrar tus propiedades en el catálogo.';

export function readMembresiaFromStorage(): boolean {
  const mem = localStorage.getItem(STORAGE_KEY);
  if (mem === null) return true;
  try {
    return JSON.parse(mem) === true;
  } catch {
    return true;
  }
}

export function persistMembresiaActiva(active: boolean): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
}

/** Lee membresiaActiva desde /agentes/me u objetos anidados. */
export function extractMembresiaActiva(data: unknown): boolean | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;

  if (typeof o.membresiaActiva === 'boolean') return o.membresiaActiva;

  for (const key of ['usuario', 'user']) {
    const nested = o[key];
    if (nested && typeof nested === 'object') {
      const val = (nested as Record<string, unknown>).membresiaActiva;
      if (typeof val === 'boolean') return val;
    }
  }

  return null;
}

export async function refreshMembresiaFromApi(): Promise<boolean> {
  const token = localStorage.getItem('token');
  if (!token) return readMembresiaFromStorage();

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/agentes/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return readMembresiaFromStorage();

    const data = await res.json();
    const extracted = extractMembresiaActiva(data);
    if (extracted !== null) {
      persistMembresiaActiva(extracted);
      return extracted;
    }
    return readMembresiaFromStorage();
  } catch {
    return readMembresiaFromStorage();
  }
}

export function syncMembresiaFromAgentResponse(data: unknown): boolean {
  const extracted = extractMembresiaActiva(data);
  if (extracted !== null) {
    persistMembresiaActiva(extracted);
    return extracted;
  }
  return readMembresiaFromStorage();
}
