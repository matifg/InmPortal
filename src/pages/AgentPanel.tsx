import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Property } from '../types';
import { Plus, Edit, Trash2, Loader2, MapPin, ExternalLink, Home } from 'lucide-react';

export default function AgentPanel() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock agent ID
  const agentId = 'agent-1';

  useEffect(() => {
    const fetchAgentProperties = async () => {
      try {
        const data = await api.getPropertiesByAgent(agentId);
        setProperties(data);
      } catch (error) {
        console.error('Error fetching agent properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentProperties();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Agente</h1>
            <p className="text-gray-600 mt-1">Gestiona tus propiedades publicadas</p>
          </div>
          <Link 
            to="/agent/nueva-propiedad" 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>Nueva Propiedad</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tienes propiedades</h3>
            <p className="text-gray-500 mb-6">Comienza publicando tu primera propiedad en el portal.</p>
            <Link 
              to="/agent/nueva-propiedad" 
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Publicar Propiedad</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Propiedad</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            <img 
                              src={property.images[0] || 'https://via.placeholder.com/150'} 
                              alt={property.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 mb-1 line-clamp-1">{property.title}</div>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[200px]">{property.city}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          property.status === 'Venta' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{formatPrice(property.price)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(property.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link 
                            to={`/propiedad/${property.id}`}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver propiedad"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </Link>
                          <button 
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


