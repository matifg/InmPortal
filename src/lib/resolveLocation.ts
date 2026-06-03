import { fetchLocalidades, type UbicacionItem } from '../services/ubicaciones';

function norm(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export async function resolveCityToLocation(
  city: string,
  provincias: UbicacionItem[]
): Promise<{
  provinciaId: string;
  localidadId: string;
  localidades: UbicacionItem[];
  cityName: string;
} | null> {
  const target = norm(city);
  if (!target) return null;

  for (const provincia of provincias) {
    try {
      const localidades = await fetchLocalidades(provincia.id);
      const match = localidades.find((l) => norm(l.nombre) === target);
      if (match) {
        return {
          provinciaId: provincia.id,
          localidadId: match.id,
          localidades,
          cityName: match.nombre,
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}
