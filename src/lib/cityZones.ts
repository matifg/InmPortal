import { normalizeSearch } from './filterProperties';

/** Zonas configuradas para Baradero (mismo listado del ABM). */
export const BARADERO_ZONES = [
  'Colonia Suiza',
  'Centro',
  'Estacion',
  'Costa',
  'Alsina',
  'Portela',
  'Santa Coloma',
] as const;

const ZONES_BY_CITY: Record<string, readonly string[]> = {
  baradero: BARADERO_ZONES,
};

/** Devuelve las zonas de una ciudad si está configurada; si no, []. */
export function getZonesForCity(city: string): string[] {
  const q = normalizeSearch(city);
  if (!q) return [];

  const exact = ZONES_BY_CITY[q];
  if (exact) return [...exact];

  for (const [key, zones] of Object.entries(ZONES_BY_CITY)) {
    if (q.includes(key)) return [...zones];
  }
  return [];
}

export function cityHasZones(city: string): boolean {
  return getZonesForCity(city).length > 0;
}
