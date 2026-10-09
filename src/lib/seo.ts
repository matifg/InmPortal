import { Property } from '../types';

/** Título de pestaña para la ficha. */
export function buildPropertyPageTitle(property: Property): string {
  const headline = property.title?.trim() || property.propertyType || 'Propiedad';
  const place = [property.zona, property.city].filter(Boolean).join(', ');
  const op = property.operation || property.status;
  return [headline, place, op].filter(Boolean).join(' | ');
}

/**
 * Datos estructurados schema.org (RealEstateListing + BreadcrumbList) para la ficha.
 * Devuelve el JSON listo para un <script type="application/ld+json">, con `<` escapado.
 */
export function buildPropertyJsonLd(property: Property, pageUrl: string, images: string[]): string {
  const origin = new URL(pageUrl).origin;
  const absolute = (src: string) => (/^https?:\/\//i.test(src) ? src : new URL(src, origin).href);
  const photos = images.filter((src) => src && src !== '/no-image.jpg').map(absolute);
  const op = property.operation || property.status;

  const listing: Record<string, unknown> = {
    '@type': 'RealEstateListing',
    name: property.title,
    description: buildPropertyPageDescription(property),
    url: pageUrl,
    ...(photos.length ? { image: photos } : {}),
    ...(property.createdAt ? { datePosted: property.createdAt.slice(0, 10) } : {}),
    contentLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(property.address ? { streetAddress: property.address } : {}),
        ...(property.city ? { addressLocality: property.city } : {}),
        addressCountry: 'AR',
      },
    },
  };

  if (!property.ocultarPrecio && property.price > 0 && property.currency) {
    listing.offers = {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: property.currency,
      availability: 'https://schema.org/InStock',
      businessFunction:
        op === 'Alquiler' || op === 'Temporario'
          ? 'http://purl.org/goodrelations/v1#LeaseOut'
          : 'http://purl.org/goodrelations/v1#Sell',
    };
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Catálogo', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: property.title, item: pageUrl },
    ],
  };

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [listing, breadcrumb] }).replace(
    /</g,
    '\\u003c'
  );
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
