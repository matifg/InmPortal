import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Property } from '../types';
import { Plus, Edit, Trash2, Loader2, MapPin, ExternalLink, Home } from 'lucide-react';

export default function AgentPanel() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'price' | 'date'>('price');
  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 6;
  const navigate = useNavigate();
  // Ordenar propiedades por precio o fecha sin mutar el array original
  const sortedProperties = useMemo(() => {
    const propsCopy = [...properties];
    if (sortBy === 'price') {
      propsCopy.sort((a, b) => {
        if (sortOrder === 'asc') return a.price - b.price;
        return b.price - a.price;
      });
    } else {
      propsCopy.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (sortOrder === 'asc') return dateA - dateB;
        return dateB - dateA;
      });
    }
    return propsCopy;
  }, [properties, sortOrder, sortBy]);

  // Mock agent ID
const agente = JSON.parse(localStorage.getItem('agente') || '{}');
  const agentId = agente?.id;
  console.log("AGENTE ID:", agentId);

  useEffect(() => {
    const fetchAgentProperties = async () => {
      console.log('AgentPanel: agentId =', agentId);
      console.log('AgentPanel: fetching properties...');
      try {
        const data = await api.getPropertiesByAgent(agentId);
        console.log('AgentPanel: properties fetched:', data);
        setProperties(data);
      } catch (error) {
        console.error('Error fetching agent properties:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAgentProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const totalPages = Math.ceil(sortedProperties.length / propertiesPerPage);
  const startIdx = (currentPage - 1) * propertiesPerPage;
  const endIdx = startIdx + propertiesPerPage;
  const visibleProperties = sortedProperties.slice(startIdx, endIdx);

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
                    <th
                      className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 transition"
                      onClick={() => {
                        if (sortBy === 'price') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('price');
                          setSortOrder('asc');
                        }
                      }}
                      title="Ordenar por precio"
                    >
                      Precio
                      <span className="ml-1 align-middle">
                        {sortBy === 'price' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </th>
                    <th
                      className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:text-indigo-600 transition"
                      onClick={() => {
                        if (sortBy === 'date') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('date');
                          setSortOrder('desc');
                        }
                      }}
                      title="Ordenar por fecha"
                    >
                      Fecha
                      <span className="ml-1 align-middle">
                        {sortBy === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleProperties.map((property) => (
                    <tr
                      key={property.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/propiedad/${property.id}`}
                      tabIndex={0}
                      aria-label={`Ver detalle de ${property.title}`}
                    >
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${property.status === 'Venta' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
                            className="p-2 text-gray-400 group-hover:text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver detalle"
                            aria-label="Ver detalle"
                            onClick={e => e.stopPropagation()}
                            tabIndex={0}
                            data-tooltip="Ver detalle"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </Link>
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                            aria-label="Editar"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/propiedad/editar/${property.id}`);
                            }}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                            aria-label="Eliminar"
                            onClick={e => e.stopPropagation()}
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
            <div className="flex justify-between items-center border-t px-6 py-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded bg-indigo-600 text-white font-medium transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded bg-indigo-600 text-white font-medium transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


