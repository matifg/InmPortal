import { AgentContact, Property } from '../types';

/** Título de pestaña para la ficha. */
export function buildPropertyPageTitle(property: Property): string {
  const headline = property.title?.trim() || property.propertyType || 'Propiedad';
  const place = [property.zona, property.city].filter(Boolean).join(', ');
  const op = property.operation || property.status;
  return [headline, place, op].filter(Boolean).join(' | ');
}

function toJsonLdScript(graph: Record<string, unknown>[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

function toAbsolute(src: string, origin: string): string {
  return /^https?:\/\//i.test(src) ? src : new URL(src, origin).href;
}

function positive(n?: number | null): n is number {
  return typeof n === 'number' && n > 0;
}

/** Solo las viviendas admiten superficie, ambientes, dormitorios y baños en schema.org. */
const ACCOMMODATION_TYPE: Partial<Record<Property['propertyType'], string>> = {
  Casa: 'House',
  Departamento: 'Apartment',
};

function agencyNodeId(origin: string, agentId: string): string {
  return `${origin}/inmobiliaria/${agentId}#inmobiliaria`;
}

function buildAgencyNode(agent: AgentContact, agentId: string, origin: string): Record<string, unknown> {
  const logo = agent.logoUrl?.trim();
  const cover = agent.coverUrl?.trim();
  return {
    '@type': 'RealEstateAgent',
    '@id': agencyNodeId(origin, agentId),
    name: agent.inmobiliaria?.trim() || agent.nombre,
    url: `${origin}/inmobiliaria/${agentId}`,
    ...(logo ? { logo: toAbsolute(logo, origin) } : {}),
    ...(cover || logo ? { image: toAbsolute((cover || logo)!, origin) } : {}),
    ...(agent.telefono?.trim() ? { telephone: agent.telefono.trim() } : {}),
    ...(agent.email?.trim() ? { email: agent.email.trim() } : {}),
  };
}

/**
 * Datos estructurados schema.org (RealEstateListing + inmueble + inmobiliaria + BreadcrumbList) para la ficha.
 * Devuelve el JSON listo para un <script type="application/ld+json">, con `<` escapado.
 */
export function buildPropertyJsonLd(
  property: Property,
  pageUrl: string,
  images: string[],
  agent?: AgentContact | null
): string {
  const origin = new URL(pageUrl).origin;
  const photos = images.filter((src) => src && src !== '/no-image.jpg').map((src) => toAbsolute(src, origin));
  const op = property.operation || property.status;
  const agentId = property.agentId || agent?.id;
  const agencyNode = agent && agentId ? buildAgencyNode(agent, agentId, origin) : null;

  const address = {
    '@type': 'PostalAddress',
    ...(property.address ? { streetAddress: property.address } : {}),
    ...(property.city ? { addressLocality: property.city } : {}),
    addressCountry: 'AR',
  };

  const accommodationType = ACCOMMODATION_TYPE[property.propertyType];
  const realEstate: Record<string, unknown> = accommodationType
    ? {
        '@type': accommodationType,
        address,
        ...(positive(property.area)
          ? { floorSize: { '@type': 'QuantitativeValue', value: property.area, unitCode: 'MTK' } }
          : {}),
        ...(positive(property.totalAmbientes) ? { numberOfRooms: property.totalAmbientes } : {}),
        ...(positive(property.bedrooms) ? { numberOfBedrooms: property.bedrooms } : {}),
        ...(positive(property.bathrooms) ? { numberOfBathroomsTotal: property.bathrooms } : {}),
      }
    : { '@type': 'Place', address };

  const listing: Record<string, unknown> = {
    '@type': 'RealEstateListing',
    name: property.title,
    description: buildPropertyPageDescription(property),
    url: pageUrl,
    ...(photos.length ? { image: photos } : {}),
    ...(property.createdAt ? { datePosted: property.createdAt.slice(0, 10) } : {}),
    contentLocation: { '@type': 'Place', address },
    about: realEstate,
    ...(agencyNode ? { provider: { '@id': agencyNode['@id'] } } : {}),
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
      ...(agencyNode ? { offeredBy: { '@id': agencyNode['@id'] } } : {}),
    };
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Catálogo', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: property.title, item: pageUrl },
    ],
  };

  return toJsonLdScript(agencyNode ? [listing, agencyNode, breadcrumb] : [listing, breadcrumb]);
}

/** Datos estructurados (RealEstateAgent + BreadcrumbList) para el perfil público de la inmobiliaria. */
export function buildAgencyJsonLd(agent: AgentContact, agentId: string, pageUrl: string): string {
  const origin = new URL(pageUrl).origin;
  const agencyNode = buildAgencyNode(agent, agentId, origin);
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Catálogo', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: agencyNode.name, item: agencyNode.url },
    ],
  };
  return toJsonLdScript([agencyNode, breadcrumb]);
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
