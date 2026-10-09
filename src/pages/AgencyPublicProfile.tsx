import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { api } from '../services/api';
import { AgentContact, Property } from '../types';
import {
  fetchAgentContact,
  phoneForTel,
  phoneForWhatsApp,
} from '../lib/agentContact';
import { usePageMeta } from '../hooks/usePageMeta';

export default function AgencyPublicProfile() {
  const { agenteId } = useParams<{ agenteId: string }>();
  const [agent, setAgent] = useState<AgentContact | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const titleName = agent?.inmobiliaria?.trim() || agent?.nombre || 'Inmobiliaria';
  usePageMeta(
    `${titleName} | Inmo360`,
    `Propiedades publicadas por ${titleName} en Inmo360.`,
    {
      image: agent?.coverUrl || agent?.logoUrl || null,
      // Perfil inexistente o sin publicaciones: contenido pobre, no se indexa.
      noindex: !loading && properties.length === 0,
    }
  );

  useEffect(() => {
    if (!agenteId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [contact, props] = await Promise.all([
          fetchAgentContact(agenteId),
          api.getPropertiesByAgent(agenteId),
        ]);
        if (cancelled) return;
        // Preferir branding del contacto; si falta cover/logo, tomar del agente embebido en props
        const fromProp = props.find((p) => p.agent)?.agent ?? null;
        const merged: AgentContact | null = contact
          ? {
              ...fromProp,
              ...contact,
              inmobiliaria: contact.inmobiliaria || fromProp?.inmobiliaria,
              logoUrl: contact.logoUrl || fromProp?.logoUrl,
              coverUrl: contact.coverUrl || fromProp?.coverUrl,
            }
          : fromProp;
        setAgent(merged);
        setProperties(props);
        if (!merged && props.length === 0) {
          setError('No encontramos esta inmobiliaria.');
        }
      } catch {
        if (!cancelled) setError('No pudimos cargar el perfil. Intentá de nuevo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agenteId]);

  const displayName = agent?.inmobiliaria?.trim() || agent?.nombre || 'Inmobiliaria';
  const logoSrc = agent?.logoUrl?.trim() || '';
  const coverSrc = agent?.coverUrl?.trim() || '';
  const tel = agent?.telefono?.trim();
  const email = agent?.email?.trim();
  const whatsappUrl = tel
    ? `https://wa.me/${phoneForWhatsApp(tel)}?text=${encodeURIComponent(
        `Hola ${displayName}, vi su perfil en Inmo360.`
      )}`
    : null;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error && !agent && properties.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Perfil no encontrado</h1>
        <p className="text-slate-600 mb-6">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950" />
        {coverSrc && (
          <img
            src={coverSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className={`absolute inset-0 ${
            coverSrc
              ? 'bg-gradient-to-t from-slate-950/90 via-slate-900/55 to-slate-900/30'
              : 'bg-slate-950/20'
          }`}
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pb-12">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Volver al catálogo
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-white/95 shadow-lg flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-white/40">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={`Logo de ${displayName}`}
                  width={112}
                  height={112}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <Building2 className="h-10 w-10 text-slate-400" />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200 mb-1">
                Inmobiliaria
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-sm">
                {displayName}
              </h1>
              {agent?.nombre && agent.inmobiliaria && (
                <p className="text-sm text-slate-200/90 mt-1.5">Agente: {agent.nombre}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 transition-colors shadow-md shadow-black/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {tel && (
                  <a
                    href={`tel:${phoneForTel(tel)}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-2.5 hover:bg-white/20 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Llamar
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-2.5 hover:bg-white/20 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Propiedades</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {properties.length} publicaci{properties.length === 1 ? 'ón' : 'ones'}
            </p>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Esta inmobiliaria aún no tiene propiedades publicadas.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
