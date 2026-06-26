import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Property, AgentContact } from '../types';
import { phoneForWhatsApp, resolveAgentContact } from '../lib/agentContact';
import { collectPropertyImages } from '../lib/propertyImages';
import PropertyGallery from '../components/PropertyGallery';
import PropertyDetailSkeleton from '../components/PropertyDetailSkeleton';
import PropertyCard from '../components/PropertyCard';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Home as HomeIcon,
  Share2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Pencil,
  Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DESC_COLLAPSE_LEN = 420;

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [agent, setAgent] = useState<AgentContact | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      setLoading(true);
      setProperty(null);
      setDescExpanded(false);
      window.scrollTo({ top: 0, behavior: 'instant' });

      try {
        const [data, all] = await Promise.all([
          api.getPropertyById(id),
          api.getProperties().catch(() => [] as Property[]),
        ]);

        if (!data) {
          setProperty(null);
          return;
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/imagenes/propiedad/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const imagenes = res.ok ? await res.json() : [];

        setProperty({ ...data, imagenes });

        const contact = data.agentId
          ? await resolveAgentContact(data.agentId, data.agent ?? null, token)
          : data.agent ?? null;
        setAgent(contact);

        const cityNorm = data.city?.trim().toLowerCase();
        setSimilar(
          all
            .filter(
              (p) =>
                p.id !== id &&
                cityNorm &&
                p.city?.trim().toLowerCase() === cityNorm
            )
            .slice(0, 3)
        );
      } catch (error) {
        console.error('Error fetching property:', error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    if (role !== 'AGENTE' || !token) {
      setCurrentAgentId(null);
      return;
    }

    let cancelled = false;
    fetch(`${import.meta.env.VITE_API_URL}/agentes/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.id) setCurrentAgentId(String(data.id));
      })
      .catch(() => {
        if (!cancelled) setCurrentAgentId(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const canEdit =
    !!property &&
    !!currentAgentId &&
    String(property.agentId) === currentAgentId;

  const getCurrencyInfo = (currency?: string) => {
    if (!currency) return { symbol: '$', label: 'Pesos' };
    if (currency === 'USD') return { symbol: 'USD', label: 'Dólares' };
    if (currency === 'EUR') return { symbol: '€', label: 'Euros' };
    if (currency === 'ARS') return { symbol: '$', label: 'Pesos' };
    return { symbol: currency, label: currency };
  };

  const formatPrice = (price: number, currency?: string) => {
    const { symbol } = getCurrencyInfo(currency);
    return `${price.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ${symbol}`;
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo compartir');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite((v) => {
      toast.success(v ? 'Eliminado de favoritos' : 'Agregado a favoritos');
      return !v;
    });
  };

  if (loading) return <PropertyDetailSkeleton />;

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Propiedad no encontrada</h2>
        <p className="text-slate-600 mb-8 max-w-md">
          La propiedad que buscas no existe o ha sido eliminada.
        </p>
        <Link
          to="/propiedades"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const images = collectPropertyImages(property);
  const agentName = agent?.nombre ?? 'Agente inmobiliario';
  const tel = agent?.telefono;
  // TODO: cuando el backend envíe telefonoAgente, utilizar esa propiedad para decidir si se muestra el botón.
  const telefonoAgente = tel;
  const hasAgentPhone = Boolean(telefonoAgente?.trim());
  const currencyInfo = getCurrencyInfo(property.currency);

  const mapQuery = encodeURIComponent(
    [property.address, property.city, property.zona].filter(Boolean).join(', ')
  );
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const mapLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const description = property.description || 'Sin descripción.';
  const descLong = description.length > DESC_COLLAPSE_LEN;
  const descShown =
    descExpanded || !descLong ? description : `${description.slice(0, DESC_COLLAPSE_LEN)}…`;

  const whatsappMessage = property.ocultarPrecio
    ? `Hola ${agentName}, me interesa "${property.title}". ¿Podrías indicarme el precio?`
    : `Hola ${agentName}, me interesa: ${property.title}`;

  const whatsappUrl = hasAgentPhone
    ? `https://wa.me/${phoneForWhatsApp(telefonoAgente!)}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  const specs = [
    { value: property.bedrooms, label: 'Habitaciones', emoji: '🛏' },
    { value: property.bathrooms, label: 'Baños', emoji: '🚿' },
    { value: property.area ? `${property.area} m²` : '—', label: 'Superficie', emoji: '📐' },
    { value: '—', label: 'Cochera', emoji: '🚗' },
  ];

  const secondaryActionBtn =
    'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-xs font-medium hover:bg-gray-100 hover:border-gray-300 transition-all duration-200';

  const priceCard = (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {property.status}
        </span>
        <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
          {property.propertyType}
        </span>
        {property.operation && property.operation !== property.status && (
          <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
            {property.operation}
          </span>
        )}
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
          {property.title}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-indigo-500 shrink-0" />
            {property.bedrooms ?? '—'} dorm.
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-indigo-500 shrink-0" />
            {property.bathrooms ?? '—'} baños
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Square className="h-4 w-4 text-indigo-500 shrink-0" />
            {property.area ? `${property.area} m²` : '—'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HomeIcon className="h-4 w-4 text-indigo-500 shrink-0" />
            {property.propertyType}
          </span>
        </div>
      </div>

      {property.ocultarPrecio ? (
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-600">Consultar precio</p>
          <p className="text-sm text-gray-500 mt-1">Contactá al agente para más info</p>
        </div>
      ) : (
        <div>
          <p className="text-3xl sm:text-4xl font-bold text-indigo-600 tracking-tight">
            {formatPrice(property.price, property.currency)}
            {property.status === 'Alquiler' && (
              <span className="text-lg text-gray-500 font-normal"> /mes</span>
            )}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{currencyInfo.label}</p>
        </div>
      )}

      <div className="flex items-start gap-2 text-gray-600 pt-1 border-t border-gray-100">
        <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed">
          {property.address && (
            <span className="block font-medium text-gray-800">{property.address}</span>
          )}
          <span>
            {property.city}
            {property.zona ? ` · ${property.zona}` : ''}
          </span>
        </p>
      </div>

      <div>
        {hasAgentPhone && whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" />
            Contactar por WhatsApp
          </a>
        ) : (
          <p className="text-sm text-gray-500 text-center py-3 px-4 rounded-xl bg-gray-50 border border-gray-100 leading-relaxed">
            Este agente aún no configuró un número de contacto.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {canEdit && (
          <button
            type="button"
            onClick={() => navigate(`/propiedad/editar/${property.id}`)}
            className={`${secondaryActionBtn} text-indigo-700 border-indigo-100 bg-indigo-50 hover:bg-indigo-100`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
        )}
        <button
          type="button"
          onClick={toggleFavorite}
          className={`${secondaryActionBtn} ${isFavorite ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-50' : ''}`}
          aria-label="Favoritos"
        >
          <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          Favoritos
        </button>
        <button type="button" onClick={handleShare} className={secondaryActionBtn}>
          <Share2 className="h-3.5 w-3.5" />
          Compartir
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500 min-w-0 mb-4">
          <Link to="/propiedades" className="hover:text-indigo-600 transition-colors duration-200">
            Catálogo
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          {property.city && (
            <>
              <span className="text-gray-700 truncate">{property.city}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </>
          )}
          <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-md">
            {property.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <PropertyGallery images={images} mainMaxHeight={380} />

            {/* Mobile: tarjeta de precio */}
            <div className="lg:hidden">{priceCard}</div>

            {/* Características — asoma en viewport inicial */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-sm -mt-2 lg:mt-0">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Características</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {specs.map(({ value, label, emoji }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200 text-center"
                  >
                    <span className="text-xl" aria-hidden>{emoji}</span>
                    <p className="text-lg font-bold text-gray-900">{value ?? '—'}</p>
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Descripción</h2>
              <p className="text-sm text-gray-500 mb-4">Detalles de la propiedad</p>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed text-[15px]">
                {descShown}
              </p>
              {descLong && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                >
                  {descExpanded ? (
                    <>
                      Ver menos <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Leer más <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Ubicación */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Ubicación</h2>
                <div className="space-y-1 text-sm text-gray-600">
                  {property.address && (
                    <p><span className="font-medium text-gray-800">Dirección:</span> {property.address}</p>
                  )}
                  <p><span className="font-medium text-gray-800">Localidad:</span> {property.city || '—'}</p>
                  {property.zona && (
                    <p><span className="font-medium text-gray-800">Zona:</span> {property.zona}</p>
                  )}
                </div>
                <a
                  href={mapLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                >
                  Abrir en Google Maps <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <iframe
                title="Mapa de ubicación"
                src={mapEmbedUrl}
                className="w-full h-52 sm:h-56 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {similar.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Propiedades similares</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similar.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar sticky — desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20">{priceCard}</div>
          </aside>
        </div>
      </div>

      {/* Barra fija mobile */}
      {whatsappUrl && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 py-3 safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <button
              type="button"
              onClick={toggleFavorite}
              className={`shrink-0 p-2.5 rounded-xl border transition-all duration-200 ${
                isFavorite
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
              aria-label="Favoritos"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 truncate">{property.title}</p>
              {property.ocultarPrecio ? (
                <p className="text-sm font-semibold text-emerald-700 leading-tight">Consultar precio</p>
              ) : (
                <p className="text-lg font-bold text-indigo-600 leading-tight">
                  {formatPrice(property.price, property.currency)}
                </p>
              )}
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white px-4 py-3 rounded-xl font-semibold shadow-md transition-all duration-200 text-sm"
            >
              <WhatsAppIcon className="h-5 w-5 shrink-0" />
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
