import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Property, AgentContact } from '../types';
import { phoneForTel, phoneForWhatsApp, resolveAgentContact } from '../lib/agentContact';
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
  Phone,
  Mail,
  MessageCircle,
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

function ContactCard({
  property,
  agentName,
  agentInitial,
  agentSubtitle,
  tel,
  email,
  contactForm,
  setContactForm,
  onSubmit,
  compact,
}: {
  property: Property;
  agentName: string;
  agentInitial: string;
  agentSubtitle: string;
  tel?: string;
  email?: string;
  contactForm: { nombre: string; email: string; mensaje: string };
  setContactForm: React.Dispatch<React.SetStateAction<{ nombre: string; email: string; mensaje: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  compact?: boolean;
}) {
  return (
    <div
      id={compact ? undefined : 'agent-contact'}
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${
        compact ? 'p-5' : 'p-6'
      }`}
    >
      {!compact && (
        <h3 className="text-lg font-bold text-gray-900 mb-5">Tu agente</h3>
      )}

      <div className={`flex items-center gap-4 ${compact ? 'mb-4' : 'mb-5 pb-5 border-b border-gray-100'}`}>
        <div className="h-14 w-14 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
          <span className="text-xl font-bold text-indigo-600">{agentInitial}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 truncate text-base">{agentName}</p>
          <p className="text-sm text-gray-500">{agentSubtitle}</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-5">
        {tel ? (
          <>
            <a
              href={`https://wa.me/${phoneForWhatsApp(tel)}?text=${encodeURIComponent(
                property.ocultarPrecio
                  ? `Hola ${agentName}, me interesa "${property.title}". ¿Podrías indicarme el precio?`
                  : `Hola ${agentName}, me interesa: ${property.title}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors duration-200"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
            <a
              href={`tel:${phoneForTel(tel)}`}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors duration-200 text-sm"
            >
              <Phone className="h-4 w-4" />
              Llamar
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">Teléfono no disponible.</p>
        )}
        {email && (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`Consulta: ${property.title}`)}`}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-medium transition-colors duration-200 text-sm"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        )}
      </div>

      {!compact && (
        <form onSubmit={onSubmit} className="space-y-3 border-t border-gray-100 pt-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consulta por email</p>
          <input
            type="text"
            placeholder="Tu nombre"
            value={contactForm.nombre}
            onChange={(e) => setContactForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-colors duration-200"
          />
          <input
            type="email"
            placeholder="Tu email"
            value={contactForm.email}
            onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-colors duration-200"
          />
          <textarea
            rows={3}
            placeholder="Me interesa esta propiedad..."
            value={contactForm.mensaje}
            onChange={(e) => setContactForm((f) => ({ ...f, mensaje: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none transition-colors duration-200"
          />
          <button
            type="submit"
            disabled={!email}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors duration-200"
          >
            Solicitar información
          </button>
        </form>
      )}
    </div>
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
  const [contactForm, setContactForm] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });

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

  const scrollToContact = () => {
    document.getElementById('agent-contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent?.email) {
      toast.error('Este agente no tiene email de contacto configurado.');
      return;
    }
    if (!contactForm.nombre.trim() || !contactForm.email.trim()) {
      toast.error('Completá tu nombre y email.');
      return;
    }

    const subject = encodeURIComponent(`Consulta: ${property?.title ?? 'Propiedad'}`);
    const body = encodeURIComponent(
      `Hola ${agent.nombre},\n\n` +
        `Me interesa la propiedad: ${property?.title ?? ''}\n` +
        `${property?.address ? `Dirección: ${property.address}, ${property.city}\n` : ''}` +
        `\n${contactForm.mensaje}\n\n` +
        `— ${contactForm.nombre}\n${contactForm.email}`
    );
    window.location.href = `mailto:${agent.email}?subject=${subject}&body=${body}`;
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
  const agentInitial = agentName.charAt(0).toUpperCase();
  const agentSubtitle = agent?.inmobiliaria ?? 'Inmo360';
  const tel = agent?.telefono;
  const email = agent?.email;
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

  const whatsappUrl = tel
    ? `https://wa.me/${phoneForWhatsApp(tel)}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  const contactProps = {
    property,
    agentName,
    agentInitial,
    agentSubtitle,
    tel,
    email,
    contactForm,
    setContactForm,
    onSubmit: handleContactSubmit,
  };

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

      <div className="flex flex-col gap-2.5">
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors duration-200 shadow-sm"
          >
            <MessageCircle className="h-5 w-5" />
            Contactar
          </a>
        ) : (
          <button
            type="button"
            onClick={scrollToContact}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors duration-200 shadow-sm"
          >
            <Mail className="h-5 w-5" />
            Contactar
          </button>
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
            <div className="sticky top-20 space-y-6">
              {priceCard}
              <ContactCard {...contactProps} />
            </div>
          </aside>
        </div>

        {/* Agente — mobile */}
        <div className="mt-6 lg:hidden">
          <ContactCard {...contactProps} compact />
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
              className="shrink-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md transition-colors duration-200"
            >
              <MessageCircle className="h-5 w-5" />
              {property.ocultarPrecio ? 'Consultar' : 'WhatsApp'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
