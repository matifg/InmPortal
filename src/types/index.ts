export type PropertyType = 'Casa' | 'Departamento' | 'Terreno' | 'Local Comercial' | 'Oficina';
export type PropertyStatus = 'Venta' | 'Alquiler' | 'Temporario';

export interface AgentContact {
  id?: string;
  nombre: string;
  email?: string;
  telefono?: string;
  inmobiliaria?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  ocultarPrecio?: boolean;
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
  currency?: string;
  operation?: string | null;
  tipoId?: number;
  zona?: string;
  agent?: AgentContact;
  imagenes?: { url: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'visitor' | 'agent';
  avatar?: string;
}
