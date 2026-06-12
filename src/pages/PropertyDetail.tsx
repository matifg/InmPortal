import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Property, AgentContact } from '../types';
import { phoneForTel, phoneForWhatsApp } from '../lib/agentContact';
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
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
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
      className={`bg-white rounded-2xl shadow-sm border border-slate-200/80 ${
        compact ? 'p-5' : 'p-6 lg:sticky lg:top-24'
      }`}
    >
      {!compact && <h3 className="text-lg font-bold text-slate-900 mb-5">Contactar al agente</h3>}

      <div className={`flex items-center gap-4 ${compact ? 'mb-4' : 'mb-6 pb-6 border-b border-slate-100'}`}>
        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-indigo-600">{agentInitial}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 truncate">{agentName}</p>
          <p className="text-sm text-slate-500">{agentSubtitle}</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-5">
        {tel ? (
          <>
            <a
              href={`https://wa.me/${phoneForWhatsApp(tel)}?text=${encodeURIComponent(
                `Hola ${agentName}, me interesa: ${property.title}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
            <a
              href={`tel:${phoneForTel(tel)}`}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors text-sm"
            >
              <Phone className="h-4 w-4" />
              Llamar
            </a>
          </>
        ) : (
          <p className="text-sm text-slate-500 text-center py-2">Teléfono no disponible.</p>
        )}
        {email && (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`Consulta: ${property.title}`)}`}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-medium transition-colors text-sm"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        )}
      </div>

      {!compact && (
        <form onSubmit={onSubmit} className="space-y-3 border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500">Consulta por email</p>
          <input
            type="text"
            placeholder="Tu nombre"
            value={contactForm.nombre}
            onChange={(e) => setContactForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
          />
          <input
            type="email"
            placeholder="Tu email"
            value={contactForm.email}
            onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
          />
          <textarea
            rows={3}
            placeholder="Me interesa esta propiedad..."
            value={contactForm.mensaje}
            onChange={(e) => setContactForm((f) => ({ ...f, mensaje: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none"
          />
          <button
            type="submit"
            disabled={!email}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
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
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [agent, setAgent] = useState<AgentContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [contactForm, setContactForm] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

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
        setAgent(data.agent ?? null);

        if (!data.agent && data.agentId) {
          const contact = await api.getAgentContact(data.agentId);
          setAgent(contact);
        }

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

  const whatsappUrl = tel
    ? `https://wa.me/${phoneForWhatsApp(tel)}?text=${encodeURIComponent(
        `Hola ${agentName}, me interesa: ${property.title}`
      )}`
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
    { icon: Bed, value: property.bedrooms, label: 'Habitaciones' },
    { icon: Bath, value: property.bathrooms, label: 'Baños' },
    { icon: Square, value: property.area, label: 'm²' },
    { icon: HomeIcon, value: property.propertyType, label: 'Tipo' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500 mb-4">
          <Link to="/propiedades" className="hover:text-indigo-600 transition-colors">
            Catálogo
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {property.city && (
            <>
              <span className="text-slate-700">{property.city}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="text-slate-900 font-medium truncate max-w-[200px] sm:max-w-none">
            {property.title}
          </span>
        </nav>

        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/propiedades"
            className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </button>
        </div>

        <PropertyGallery images={images} />

        <div className="mt-6 md:mt-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-slate-900/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {property.status}
              </span>
              <span className="bg-indigo-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {property.propertyType}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
              {property.title}
            </h1>
            <div className="flex items-start gap-2 mt-3 text-slate-600">
              <MapPin className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-base">
                {property.address}, {property.city}
                {property.zona ? ` · ${property.zona}` : ''}
              </p>
            </div>
          </div>
          <div className="lg:text-right shrink-0">
            <p className="text-3xl sm:text-4xl font-bold text-indigo-600">
              {property.ocultarPrecio
                ? 'Consultar precio'
                : formatPrice(property.price, property.currency)}
              {!property.ocultarPrecio && property.status === 'Alquiler' && (
                <span className="text-lg text-slate-500 font-normal"> /mes</span>
              )}
            </p>
            {!property.ocultarPrecio && (
              <p className="text-sm text-slate-500 mt-1">{currencyInfo.label}</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Características</h2>
              <div className="flex flex-wrap gap-6 sm:gap-10">
                {specs.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50">
                      <Icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{value}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Descripción</h2>
              <p className="text-slate-600 whitespace-pre-line leading-relaxed text-[15px]">
                {descShown}
              </p>
              {descLong && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
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

            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
              <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Ubicación</h2>
                <a
                  href={mapLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                >
                  Abrir en Maps <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <iframe
                title="Mapa de ubicación"
                src={mapEmbedUrl}
                className="w-full h-56 sm:h-64 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {similar.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Propiedades similares</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similar.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <ContactCard {...contactProps} />
          </div>
        </div>

        <div className="mt-8 lg:hidden">
          <ContactCard {...contactProps} compact />
        </div>
      </div>

      {whatsappUrl && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 safe-area-pb">
          <div className="flex items-center gap-3 max-w-6xl mx-auto">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 truncate">{property.title}</p>
              <p className="text-lg font-bold text-indigo-600 leading-tight">
                {property.ocultarPrecio
                  ? 'Consultar precio'
                  : formatPrice(property.price, property.currency)}
              </p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
