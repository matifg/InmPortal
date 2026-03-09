import { Property } from '../types';
import { mockProperties } from '../data/mockData';

// Simulated delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory store for mock data
let properties = [...mockProperties];

export const api = {
  // GET /propiedades
  getProperties: async (): Promise<Property[]> => {
    await delay(800);
    return [...properties].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // GET /propiedades/:id
  getPropertyById: async (id: string): Promise<Property | undefined> => {
    await delay(500);
    return properties.find(p => p.id === id);
  },

  // GET /propiedades?agentId=:agentId
  getPropertiesByAgent: async (agentId: string): Promise<Property[]> => {
    await delay(600);
    return properties.filter(p => p.agentId === agentId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  // POST /propiedades
  createProperty: async (propertyData: Omit<Property, 'id' | 'createdAt'>): Promise<Property> => {
    await delay(1000);
    const newProperty: Property = {
      ...propertyData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };
    properties.push(newProperty);
    return newProperty;
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
