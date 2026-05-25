import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Property, AgentContact } from '../types';
import { phoneForTel, phoneForWhatsApp } from '../lib/agentContact';
import ImageSlider from '../components/ImageSlider';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Home as HomeIcon,
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const BASE_URL = `${import.meta.env.VITE_API_URL}`;

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<AgentContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  });

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      try {
        const data = await api.getPropertyById(id);
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
    if (currency === 'USD') return { symbol: '$', label: 'Dólares' };
    if (currency === 'EUR') return { symbol: '€', label: 'Euros' };
    if (currency === 'ARS') return { symbol: '$', label: 'Pesos' };
    return { symbol: currency, label: currency };
  };

  const formatPrice = (price: number, currency?: string) => {
    const { symbol } = getCurrencyInfo(currency);
    return `${price.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ${symbol}`;
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

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Propiedad no encontrada</h2>
        <p className="text-gray-600 mb-8">La propiedad que buscas no existe o ha sido eliminada.</p>
        <Link
          to="/"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  let images: string[] = [];
  if (Array.isArray(property.imagenes) && property.imagenes.length > 0) {
    images = property.imagenes
      .map((img: { url?: string }) => {
        let url = img?.url || '';
        if (url && !/^https?:\/\//i.test(url)) {
          url = `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url || null;
      })
      .filter((url): url is string => !!url);
  }
  if (!images.length && property.images?.length) {
    images = property.images.filter(Boolean) as string[];
  }
  if (!images.length) {
    images = ['/no-image.jpg'];
  }

  const agentName = agent?.nombre ?? 'Agente inmobiliario';
  const agentInitial = agentName.charAt(0).toUpperCase();
  const agentSubtitle = agent?.inmobiliaria ?? 'Inmo360';
  const tel = agent?.telefono;
  const email = agent?.email;

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <Link
          to="/"
          className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-4 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="w-full">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-white flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[540px]">
              <ImageSlider
                images={images}
                imgClassName="object-cover w-full h-full max-h-full"
                containerClassName="w-full h-full"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center h-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
                {property.status}
              </span>
              <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full">
                {property.propertyType}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-2">
              {property.title}
            </h1>
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-3">
              {formatPrice(property.price, property.currency)}
              {property.status === 'Alquiler' && (
                <span className="text-lg text-slate-500 font-normal">/mes</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-base text-slate-600 font-medium">
              <MapPin className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>
                {property.address}, {property.city}
                {property.zona ? ` · ${property.zona}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Características principales</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                  <Bed className="h-7 w-7 text-indigo-600 mb-2" />
                  <span className="text-xl font-bold text-slate-900">{property.bedrooms}</span>
                  <span className="text-xs text-slate-500">Habitaciones</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                  <Bath className="h-7 w-7 text-indigo-600 mb-2" />
                  <span className="text-xl font-bold text-slate-900">{property.bathrooms}</span>
                  <span className="text-xs text-slate-500">Baños</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                  <Square className="h-7 w-7 text-indigo-600 mb-2" />
                  <span className="text-xl font-bold text-slate-900">{property.area}</span>
                  <span className="text-xs text-slate-500">m²</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl">
                  <HomeIcon className="h-7 w-7 text-indigo-600 mb-2" />
                  <span className="text-sm font-bold text-slate-900 text-center">{property.propertyType}</span>
                  <span className="text-xs text-slate-500">Tipo</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Descripción</h2>
              <p className="text-slate-600 whitespace-pre-line leading-relaxed">{property.description}</p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-5">Contactar al agente</h3>

              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="h-14 w-14 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-indigo-600">{agentInitial}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{agentName}</p>
                  <p className="text-sm text-slate-500">{agentSubtitle}</p>
                  {email && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{email}</p>
                  )}
                  {tel && (
                    <p className="text-xs text-slate-400 truncate">{tel}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {tel ? (
                  <>
                    <a
                      href={`tel:${phoneForTel(tel)}`}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium transition-colors"
                    >
                      <Phone className="h-5 w-5" />
                      Llamar
                    </a>
                    <a
                      href={`https://wa.me/${phoneForWhatsApp(tel)}?text=${encodeURIComponent(
                        `Hola ${agentName}, me interesa: ${property.title}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-medium transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">
                    Teléfono no disponible — usá el formulario o email.
                  </p>
                )}
                {email ? (
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(`Consulta: ${property.title}`)}`}
                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-5 py-3 rounded-xl font-medium transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    Enviar email
                  </a>
                ) : null}
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-3 border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-500 mb-2">
                  Dejanos tu consulta y te respondemos por email.
                </p>
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
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Solicitar información
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
