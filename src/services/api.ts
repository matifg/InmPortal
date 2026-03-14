import { Property } from '../types';

// Simulated delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory store for mock data (solo para otros métodos)
let properties: Property[] = [];

export const api = {
  // GET /propiedades
  getProperties: async (): Promise<Property[]> => {
    // Fetch real data from backend
    const res = await fetch('http://localhost:8080/propiedades');
    if (!res.ok) throw new Error('Error fetching properties');
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: item.id,
      title: item.titulo,
      description: item.descripcion,
      price: item.precio,
      city: item.ciudad,
      address: item.direccion,
      propertyType: item.tipoId === 1 ? 'Casa' : 'Departamento',
      bedrooms: item.habitaciones,
      bathrooms: item.banios,
      area: item.superficieM2,
      status: item.estado === 'disponible' ? 'Venta' : 'Alquiler',
      images: [item.imageUrl, ...(Array.isArray(item.imagenes) ? item.imagenes.map((img: any) => img.url) : [])].filter(Boolean),
      agentId: item.agenteId,
      createdAt: item.creadoEn || '',
      currency: item.moneda,
      operation: item.operacion,
    }));
  },

  // GET /propiedades/:id
  getPropertyById: async (id: string): Promise<Property | undefined> => {
    // Fetch real data from backend
    const res = await fetch(`http://localhost:8080/propiedades/${id}`);
    if (!res.ok) return undefined;
    const item = await res.json();
    return {
      id: item.id,
      title: item.titulo,
      description: item.descripcion,
      price: item.precio,
      city: item.ciudad,
      address: item.direccion,
      propertyType: item.tipoId === 1 ? 'Casa' : 'Departamento',
      bedrooms: item.habitaciones,
      bathrooms: item.banios,
      area: item.superficieM2,
      status: item.estado === 'disponible' ? 'Venta' : 'Alquiler',
      images: Array.isArray(item.imagenes) ? item.imagenes.map((img: any) => img.url) : [],
      agentId: item.agenteId,
      createdAt: item.creadoEn || '',
      currency: item.moneda,
      operation: item.operacion,
    };
  },

  // GET /propiedades?agentId=:agentId
  getPropertiesByAgent: async (agentId: string): Promise<Property[]> => {
    // Fetch real data from backend
    const res = await fetch(`http://localhost:8080/propiedades/agente/${agentId}`);
    if (!res.ok) throw new Error('Error fetching agent properties');
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: item.id,
      title: item.titulo,
      description: item.descripcion,
      price: item.precio,
      city: item.ciudad,
      address: item.direccion,
      propertyType: item.tipoId === 1 ? 'Casa' : 'Departamento',
      bedrooms: item.habitaciones,
      bathrooms: item.banios,
      area: item.superficieM2,
      status: item.estado === 'disponible' ? 'Venta' : 'Alquiler',
      images: [item.imageUrl, ...(Array.isArray(item.imagenes) ? item.imagenes.map((img: any) => img.url) : [])].filter(Boolean),
      agentId: item.agenteId,
      createdAt: item.creadoEn || '',
      currency: item.moneda,
      operation: item.operacion,
    }));
  },

  // POST /propiedades
  /**
   * Crea una propiedad enviando el payload con los nombres de campos en español, como espera el backend.
   * @param propertyPayload Objeto con los campos en español (ver PropertyForm.tsx)
   */
  createProperty: async (propertyPayload: any): Promise<any> => {
    const res = await fetch('http://localhost:8080/propiedades', {
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
  }
};
