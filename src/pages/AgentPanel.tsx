import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Property } from '../types';
import { Plus, Edit, Trash2, Loader2, MapPin, ExternalLink, Home, Search, X, ChevronDown, EyeOff, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import MembresiaBanner from '../components/MembresiaBanner';
import { readMembresiaFromStorage, syncMembresiaFromAgentResponse } from '../lib/membresia';
import { parseAgentContact } from '../lib/agentContact';

// Badge UI mejorada
function StatusBadge({ status }: { status: string }) {
  let color = "bg-gray-100 text-gray-600";
  if (status === "Venta") color = "bg-green-100 text-green-800";
  else if (status === "Alquiler") color = "bg-blue-100 text-blue-800";
  else if (status === "Temporario") color = "bg-violet-100 text-violet-800";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm ${color}`}>
      {status}
    </span>
  );
}

function PublicacionBadge({ estado }: { estado?: string }) {
  if (estado !== 'BORRADOR') return null;
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm bg-amber-100 text-amber-800">
      Borrador
    </span>
  );
}

const ORDER_OPTIONS = [
  { value: 'date-desc', label: 'Fecha: Más reciente' },
  { value: 'date-asc', label: 'Fecha: Más antiguo' },
  { value: 'price-asc', label: 'Precio: Menor a mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a menor' },
  { value: 'title-asc', label: 'Título: A-Z' },
];

export default function AgentPanel() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<'all' | 'Venta' | 'Alquiler' | 'Temporario'>('all');
  const [search, setSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Nuevo: ordenamiento unificado
  const [order, setOrder] = useState('date-desc');
  const [membresiaActiva, setMembresiaActiva] = useState(readMembresiaFromStorage);
  const [agentTelefono, setAgentTelefono] = useState<string | null>(null);

  const navigate = useNavigate();

  const notifyMembresiaInactiva = () => {
    toast.error('Activá tu membresía para publicar nuevas propiedades');
  };

  // Nueva función para obtener el agente autenticado
  const fetchAgent = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No autenticado');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/agentes/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No autorizado o no es agente');
    const agente = await res.json();
    setMembresiaActiva(syncMembresiaFromAgentResponse(agente));
    const contact = parseAgentContact(agente);
    setAgentTelefono(contact?.telefono ?? agente.telefono ?? null);
    return agente;
  };

  // Refactor: obtener agente antes de pedir propiedades
  const fetchAgentProperties = async () => {
    setLoading(true);
    try {
      const agente = await fetchAgent();
      const data = await api.getPropertiesByAgent(agente.id);

      const dataWithImages = await Promise.all(
        data.map(async (prop: any) => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/imagenes/propiedad/${prop.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const imagenes = res.ok ? await res.json() : [];
            return { ...prop, imagenes };
          } catch {
            return { ...prop, imagenes: [] };
          }
        })
      );

      setProperties(dataWithImages);
    } catch (err) {
      console.error(err);
      // Opcional: mostrar error o redirigir si no es agente
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentProperties();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, itemsPerPage, search, order]);

  const formatPrice = (price: number, currency?: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Búsqueda flexible (ignora acentos y case)
  const normalize = (str: string) =>
    str ? str.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "") : "";

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchSearch =
        normalize(p.title).includes(normalize(search)) ||
        normalize(p.city).includes(normalize(search));
      return matchStatus && matchSearch;
    });
  }, [properties, statusFilter, search]);

  // Ordenamiento moderno
  const sortedProperties = useMemo(() => {
    const copy = [...filteredProperties];
    switch (order) {
      case 'date-desc':
        copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-asc':
        copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-asc':
        copy.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        copy.sort((a, b) => b.price - a.price);
        break;
      case 'title-asc':
        copy.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    return copy;
  }, [filteredProperties, order]);

  const totalPages = Math.max(1, Math.ceil(sortedProperties.length / itemsPerPage));
  const paginatedProperties = sortedProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        <MembresiaBanner membresiaActiva={membresiaActiva} className="mb-6" />

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-1 leading-tight">Panel de Agente</h1>
            <p className="text-gray-500 text-lg font-medium">Gestiona tus propiedades publicadas</p>
            {agentTelefono ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                <MessageCircle className="h-4 w-4" />
                WhatsApp de contacto: <span className="font-semibold">{agentTelefono}</span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg inline-block">
                Sin WhatsApp cargado — los visitantes no podrán contactarte por esa vía.
              </p>
            )}
          </div>
          {membresiaActiva ? (
            <Link
              to="/dashboard/nueva-propiedad"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-500 hover:scale-105 text-white px-7 py-3 rounded-2xl font-bold shadow-lg transition-all duration-200 text-lg"
            >
              <Plus className="h-6 w-6" />
              Nueva Propiedad
            </Link>
          ) : (
            <button
              type="button"
              onClick={notifyMembresiaInactiva}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-500 opacity-50 cursor-not-allowed text-white px-7 py-3 rounded-2xl font-bold shadow-lg text-lg"
            >
              <Plus className="h-6 w-6" />
              Nueva Propiedad
            </button>
          )}
        </div>

        {/* FILTROS Y ORDENAMIENTO */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-1 gap-4 items-center min-w-0">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="h-5 w-5" />
              </span>
              <input
                placeholder="Buscar por título o ciudad..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-10 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition w-full text-base"
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
                  onClick={() => setSearch('')}
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {/* Filtro estado */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-gray-200 px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition text-base min-w-[130px]"
            >
              <option value="all">Todos</option>
              <option value="Venta">Venta</option>
              <option value="Alquiler">Alquiler</option>
              <option value="Temporario">Temporario</option>
            </select>
            {/* Ordenamiento */}
            <div className="relative min-w-[190px]">
              <select
                value={order}
                onChange={e => setOrder(e.target.value)}
                className="appearance-none rounded-lg border border-gray-200 px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition text-base pr-8 w-full"
              >
                {ORDER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {/* Solo una flechita custom, ocultando la del select nativo */}
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            {/* Paginado por página */}
            <select
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-4 py-2 shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition text-base min-w-[90px]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="text-sm text-gray-600 text-right min-w-[180px]">
            Mostrando <span className="font-semibold text-gray-900">{paginatedProperties.length}</span> de <span className="font-semibold text-gray-900">{filteredProperties.length}</span> propiedades
          </div>
        </div>

        {/* LISTA DE CARDS */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center flex flex-col items-center gap-4">
            <Home className="h-12 w-12 text-indigo-400 mb-2" />
            <h3 className="text-xl font-bold text-gray-900">No se encontraron propiedades</h3>
            <p className="text-gray-500 mb-4">Prueba ajustando los filtros o creando una nueva propiedad.</p>
            {membresiaActiva ? (
              <Link
                to="/dashboard/nueva-propiedad"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-500 hover:scale-105 text-white px-5 py-2 rounded-lg font-semibold shadow transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
                Nueva Propiedad
              </Link>
            ) : (
              <button
                type="button"
                onClick={notifyMembresiaInactiva}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-500 opacity-50 cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold shadow"
              >
                <Plus className="h-5 w-5" />
                Nueva Propiedad
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            {paginatedProperties.map(p => (
              <div
                key={p.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 flex items-center gap-8 px-8 py-6 group cursor-pointer"
                onClick={() => navigate(
                  p.publicacionEstado === 'BORRADOR'
                    ? `/propiedad/editar/${p.id}`
                    : `/propiedad/${p.id}`
                )}
                tabIndex={0}
                aria-label={`Ver detalle de ${p.title}`}
              >
                {/* Imagen */}
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 relative">
                  {p.imagenes?.[0]?.url ? (
                    <img
                      src={p.imagenes[0].url}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Home className="h-10 w-10" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-semibold text-lg text-gray-900 truncate">{p.title || 'Sin título'}</div>
                    <PublicacionBadge estado={p.publicacionEstado} />
                  </div>
                  <div className="flex items-center text-sm text-gray-500 gap-1 truncate">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{p.city}</span>
                  </div>
                  <div className="text-xs text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</div>
                </div>
                {/* Precio + Estado + Acciones */}
                <div className="flex flex-col items-end gap-3 min-w-[200px]">
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <span className="text-2xl font-extrabold text-indigo-700">
                      {p.price ? formatPrice(p.price, p.currency) : '—'}
                    </span>
                    {p.ocultarPrecio && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600" title="Precio oculto al público">
                        <EyeOff className="h-3.5 w-3.5" />
                        Oculto
                      </span>
                    )}
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      className="p-2 rounded-lg hover:bg-indigo-50 transition group"
                      title="Ver"
                      aria-label="Ver"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(
                          p.publicacionEstado === 'BORRADOR'
                            ? `/propiedad/editar/${p.id}`
                            : `/propiedad/${p.id}`
                        );
                      }}
                    >
                      <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-blue-50 transition group"
                      title="Editar"
                      aria-label="Editar"
                      onClick={e => { e.stopPropagation(); navigate(`/propiedad/editar/${p.id}`); }}
                    >
                      <Edit className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-red-50 transition group"
                      title="Eliminar"
                      aria-label="Eliminar"
                      onClick={e => {
                        e.stopPropagation();
                        const confirmDelete = window.confirm('Eliminar propiedad?');
                        if (!confirmDelete) return;
                        // deleteProperty(p.id); // Implementa si tienes la función
                        toast.success('Propiedad eliminada (simulado)');
                      }}
                    >
                      <Trash2 className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINADO */}
        <div className="flex justify-between items-center mt-12">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            Anterior
          </button>
          <span className="text-gray-500 font-medium text-lg">
            Página {currentPage} de {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}