import { Property, PropertyType, AgentContact } from '../types';
import { parseAgentContact, fetchAgentContact } from '../lib/agentContact';
import { normalizeImageUrl } from '../lib/propertyImages';

function mapPropertyImages(item: { imageUrl?: string | null; imagenes?: { url?: string; orden?: number }[] }): string[] {
  const portada = item.imageUrl?.trim() ? normalizeImageUrl(item.imageUrl.trim()) : '';
  const fromGallery = Array.isArray(item.imagenes)
    ? [...item.imagenes]
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map((img) => (img?.url?.trim() ? normalizeImageUrl(img.url.trim()) : ''))
        .filter(Boolean)
    : [];

  if (portada) {
    return [portada, ...fromGallery.filter((url) => url !== portada)];
  }
  return fromGallery;
}

function mapTipoId(tipoId?: number): PropertyType {
  if (tipoId === 1) return 'Casa';
  if (tipoId === 2) return 'Departamento';
  if (tipoId === 3) return 'Terreno';
  if (tipoId === 4) return 'Local Comercial';
  if (tipoId === 5) return 'Oficina';
  return 'Departamento';
}

function mapStatus(operacion?: string | null, estado?: string | null): Property['status'] {
  const op = operacion?.trim();
  if (op === 'Venta' || op === 'Alquiler' || op === 'Temporario') return op;
  if (estado?.toLowerCase() === 'disponible') return 'Venta';
  return 'Alquiler';
}

function mapPropertyItem(item: any): Property {
  return {
    id: item.id,
    title: item.titulo,
    description: item.descripcion,
    price: item.precio,
    ocultarPrecio: item.ocultarPrecio ?? false,
    city: item.ciudad,
    address: item.direccion,
    propertyType: mapTipoId(item.tipoId),
    bedrooms: item.habitaciones,
    bathrooms: item.banios,
    area: item.superficieM2,
    status: mapStatus(item.operacion, item.estado),
    images: mapPropertyImages(item),
    agentId: item.agenteId,
    createdAt: item.creadoEn || '',
    currency: item.moneda,
    operation: item.operacion,
    tipoId: item.tipoId,
    zona: item.zona,
    agent: parseAgentContact(item.agente ?? item.agent) ?? undefined,
  };
}

// Simulated delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory store for mock data (solo para otros métodos)
let properties: Property[] = [];

export const api = {
  // GET /propiedades
  getProperties: async (): Promise<Property[]> => {
    // Fetch real data from backend
    const res = await fetch(`${import.meta.env.VITE_API_URL}/propiedades`);
    if (!res.ok) throw new Error('Error fetching properties');
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(mapPropertyItem);
  },

  // GET /propiedades/:id
  getPropertyById: async (id: string): Promise<Property | undefined> => {
    // Fetch real data from backend con JWT
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/propiedades/${id}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    );
    if (!res.ok) return undefined;
    const item = await res.json();
    const property = mapPropertyItem(item);
    if (!property.agent && property.agentId) {
      property.agent = (await fetchAgentContact(property.agentId)) ?? undefined;
    }
    return property;
  },

  getAgentContact: async (agentId: string): Promise<AgentContact | null> => {
    return fetchAgentContact(agentId);
  },

  // GET /propiedades?agentId=:agentId
  getPropertiesByAgent: async (agentId: string): Promise<Property[]> => {
    // Fetch real data from backend con autenticación JWT
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/propiedades/agente/${agentId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error('Error fetching agent properties');
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(mapPropertyItem);
  },

  // POST /propiedades
  /**
   * Crea una propiedad enviando el payload con los nombres de campos en español, como espera el backend.
   * @param propertyPayload Objeto con los campos en español (ver PropertyForm.tsx)
   */
  createProperty: async (propertyPayload: any): Promise<any> => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/propiedades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyPayload),
    });
    if (!res.ok) throw new Error('Error creando propiedad');
    return await res.json();
  },

  // POST /imagenes (Mock Supabase Storage)
  uploadImages: async (files: File[]): Promise<string[]> => {
    await delay(1500);
    // In a real app, this would upload to Supabase Storage and return the public URLs
    // For this mock, we'll just return some placeholder Unsplash images based on the file count
    const placeholderImages = [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600607687931-cecebd808ce2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ];

    return files.map((_, index) => placeholderImages[index % placeholderImages.length]);
  },
  // PUT /propiedades/:id
  updateProperty: async (id: string, propertyPayload: any): Promise<any> => {
    const token = localStorage.getItem('token');

    const res = await fetch(`${import.meta.env.VITE_API_URL}/propiedades/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(propertyPayload),
    });

    if (!res.ok) throw new Error('Error actualizando propiedad');

    return await res.json();
  },
};
