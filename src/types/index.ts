export type PropertyType = 'Casa' | 'Departamento' | 'Terreno' | 'Local Comercial' | 'Oficina';
export type PropertyStatus = 'Venta' | 'Alquiler';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: PropertyStatus;
  images: string[];
  agentId: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'visitor' | 'agent';
  avatar?: string;
}
