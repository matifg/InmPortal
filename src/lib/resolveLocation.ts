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
      const exact = localidades.find((l) => norm(l.nombre) === target);
      if (exact) {
        return {
          provinciaId: provincia.id,
          localidadId: exact.id,
          localidades,
          cityName: exact.nombre,
        };
      }

      const partial = localidades.find(
        (l) => norm(l.nombre).includes(target) || target.includes(norm(l.nombre))
      );
      if (partial) {
        return {
          provinciaId: provincia.id,
          localidadId: partial.id,
          localidades,
          cityName: partial.nombre,
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}
