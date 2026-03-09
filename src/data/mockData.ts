import { Property } from '../types';

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Hermosa Casa con Piscina',
    description: 'Espectacular casa de 4 habitaciones con amplia piscina, jardín y zona de barbacoa. Ideal para familias grandes. Ubicada en una zona residencial tranquila y segura, cerca de colegios y centros comerciales.',
    price: 450000,
    city: 'Madrid',
    address: 'Calle de los Pinos 123, Zona Norte',
    propertyType: 'Casa',
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    status: 'Venta',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600607687931-cecebd808ce2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ],
    agentId: 'agent-1',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Moderno Departamento Céntrico',
    description: 'Departamento a estrenar en el corazón de la ciudad. Cuenta con acabados de lujo, balcón con vista panorámica y acceso a amenidades del edificio como gimnasio y terraza.',
    price: 1200,
    city: 'Barcelona',
    address: 'Av. Diagonal 456, Piso 8',
    propertyType: 'Departamento',
    bedrooms: 2,
    bathrooms: 2,
    area: 95,
    status: 'Alquiler',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1e5250a221?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ],
    agentId: 'agent-1',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Villa de Lujo frente al Mar',
    description: 'Exclusiva villa con acceso directo a la playa. Diseño arquitectónico moderno, amplios ventanales, piscina infinita y domótica integrada en toda la propiedad.',
    price: 1250000,
    city: 'Marbella',
    address: 'Paseo Marítimo 789',
    propertyType: 'Casa',
    bedrooms: 5,
    bathrooms: 6,
    area: 450,
    status: 'Venta',
    images: [
      'https://images.unsplash.com/photo-1613490908571-9ce224083933?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ],
    agentId: 'agent-2',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Acogedor Estudio para Estudiantes',
    description: 'Estudio amueblado ideal para estudiantes o profesionales jóvenes. Excelente ubicación cerca de universidades y transporte público.',
    price: 650,
    city: 'Valencia',
    address: 'Calle Universitaria 32',
    propertyType: 'Departamento',
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    status: 'Alquiler',
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ],
    agentId: 'agent-1',
    createdAt: new Date().toISOString()
  }
];
