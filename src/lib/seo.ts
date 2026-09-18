import { Property } from '../types';

/** Título de pestaña para la ficha. */
export function buildPropertyPageTitle(property: Property): string {
  const headline = property.title?.trim() || property.propertyType || 'Propiedad';
  const place = [property.zona, property.city].filter(Boolean).join(', ');
  const op = property.operation || property.status;
  return [headline, place, op].filter(Boolean).join(' | ');
}

/** Meta description corta (~155 chars) para la ficha. */
export function buildPropertyPageDescription(property: Property): string {
  const bits: string[] = [];

  if (property.propertyType) bits.push(property.propertyType);
  const place = [property.zona, property.city].filter(Boolean).join(', ');
  if (place) bits.push(place);

  const op = property.operation || property.status;
  if (op) bits.push(op);

  if (typeof property.totalAmbientes === 'number' && property.totalAmbientes > 0) {
    bits.push(`${property.totalAmbientes} amb.`);
  }
  if (typeof property.bedrooms === 'number') {
    bits.push(`${property.bedrooms} dorm.`);
  }
  if (typeof property.area === 'number' && property.area > 0) {
    bits.push(`${property.area} m²`);
  }

  const lead = bits.join(' · ');
  const fromDesc = property.description?.replace(/\s+/g, ' ').trim();

  if (fromDesc) {
    const combined = lead ? `${lead}. ${fromDesc}` : fromDesc;
    return combined.length > 155 ? `${combined.slice(0, 152).trim()}…` : combined;
  }

  return lead
    ? `${lead}. Consultá detalles y contacto en Inmo360.`
    : 'Propiedad publicada en Inmo360. Consultá detalles y contacto con el agente.';
}
