import { Property } from '../types';

export type PropertySearchFilters = {
  city: string;
  tipoId: string;
  operacion: string;
};

export const EMPTY_PROPERTY_FILTERS: PropertySearchFilters = {
  city: '',
  tipoId: '',
  operacion: '',
};

export function normalizeSearch(str: string): string {
  return str
    ? str.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    : '';
}

export function hasActiveFilters(filters: PropertySearchFilters): boolean {
  return Boolean(filters.city.trim() || filters.tipoId || filters.operacion);
}

export function filterProperties(
  properties: Property[],
  filters: PropertySearchFilters
): Property[] {
  const cityQ = normalizeSearch(filters.city);
  const tipoId = filters.tipoId;
  const opQ = normalizeSearch(filters.operacion);

  return properties.filter((p) => {
    if (cityQ) {
      const inCity = normalizeSearch(p.city).includes(cityQ);
      const inTitle = normalizeSearch(p.title).includes(cityQ);
      const inZone = normalizeSearch(p.zona || '').includes(cityQ);
      if (!inCity && !inTitle && !inZone) return false;
    }

    if (tipoId) {
      const propTipo = p.tipoId != null ? String(p.tipoId) : '';
      if (propTipo !== tipoId) {
        const typeByName =
          (tipoId === '1' && p.propertyType === 'Casa') ||
          (tipoId === '2' && p.propertyType === 'Departamento') ||
          (tipoId === '3' && p.propertyType === 'Terreno');
        if (!typeByName) return false;
      }
    }

    if (opQ) {
      const op = normalizeSearch(p.operation || p.status || '');
      if (op !== opQ && !op.includes(opQ)) return false;
    }

    return true;
  });
}
