import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  User,
  MessageCircle,
  Save,
  Trash2,
  AlertTriangle,
  X,
  Building2,
  Upload,
  ImageIcon,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AR_MOBILE_PHONE_PLACEHOLDER,
  AR_MOBILE_PHONE_ERROR,
  isValidArMobilePhone,
  normalizeArMobileDigits,
  parseAgentContact,
} from '../lib/agentContact';
import { normalizeImageUrl } from '../lib/propertyImages';

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const COVER_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

type ProfileForm = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  inmobiliaria: string;
  logoUrl: string;
  coverUrl: string;
};

function extractProfile(data: Record<string, unknown>): ProfileForm {
  const nested = (data.usuario ?? data.user) as Record<string, unknown> | undefined;
  const parsed = parseAgentContact(data);
  const rawLogo =
    typeof data.logoUrl === 'string'
      ? data.logoUrl
      : typeof nested?.logoUrl === 'string'
        ? nested.logoUrl
        : parsed?.logoUrl ?? '';
  const rawCover =
    typeof data.coverUrl === 'string'
      ? data.coverUrl
      : typeof nested?.coverUrl === 'string'
        ? nested.coverUrl
        : parsed?.coverUrl ?? '';

  return {
    nombre: String(data.nombre ?? nested?.nombre ?? ''),
    apellido: String(data.apellido ?? nested?.apellido ?? ''),
    email: String(data.email ?? nested?.email ?? ''),
    telefono: String(data.telefono ?? nested?.telefono ?? ''),
    inmobiliaria: String(
      data.inmobiliaria ?? nested?.inmobiliaria ?? parsed?.inmobiliaria ?? ''
    ),
    logoUrl: rawLogo ? normalizeImageUrl(String(rawLogo)) : '',
    coverUrl: rawCover ? normalizeImageUrl(String(rawCover)) : '',
  };
}

export default function AgentProfile() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    inmobiliaria: '',
    logoUrl: '',
    coverUrl: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const [clearingPhone, setClearingPhone] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/agentes/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('No se pudo cargar el perfil');
        const data = await res.json();
        setForm(extractProfile(data));
      } catch {
        setError('No pudimos cargar tu perfil. Intentá de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validateField = (name: keyof typeof fieldErrors, value: string) => {
    let fieldError = '';
    if (name === 'nombre' || name === 'apellido') {
      if (!value.trim()) fieldError = 'Obligatorio';
      else if (value.trim().length < 2) fieldError = 'Mín. 2 caracteres';
    }
    if (name === 'telefono') {
      if (value.trim() && !isValidArMobilePhone(value)) fieldError = AR_MOBILE_PHONE_ERROR;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
    return fieldError;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'telefono') {
      nextValue = value.replace(/^\+?54\s*9?\s*/, '');
    }
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    if (name in fieldErrors) {
      validateField(name as keyof typeof fieldErrors, nextValue);
    }
  };

  const validate = () => {
    const errors = {
      nombre: validateField('nombre', form.nombre),
      apellido: validateField('apellido', form.apellido),
      telefono: validateField('telefono', form.telefono),
    };
    return !errors.nombre && !errors.apellido && !errors.telefono;
  };

  const persistProfile = async (payload: {
    nombre: string;
    apellido: string;
    telefono: string | null;
    inmobiliaria: string | null;
  }) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Sin sesión');

    const res = await fetch(`${import.meta.env.VITE_API_URL}/agentes/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || data.mensaje || 'No se pudo guardar el perfil');
    }

    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSaving(true);
    try {
      const updated = await persistProfile({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim()
          ? normalizeArMobileDigits(form.telefono)
          : null,
        // "" limpia a null según contrato del API
        inmobiliaria: form.inmobiliaria.trim() || '',
      });

      setForm(extractProfile(updated));
      const displayName = [form.nombre.trim(), form.apellido.trim()].filter(Boolean).join(' ');
      if (displayName) localStorage.setItem('nombre', displayName);
      toast.success('Perfil actualizado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmClearPhone = async () => {
    setShowClearConfirm(false);
    setFieldErrors((prev) => ({ ...prev, telefono: '' }));
    setClearingPhone(true);
    setError('');

    try {
      const updated = await persistProfile({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: null,
        inmobiliaria: form.inmobiliaria.trim() || '',
      });

      setForm(extractProfile(updated));
      toast.success('WhatsApp eliminado de tu perfil');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar el número';
      setError(msg);
      toast.error(msg);
    } finally {
      setClearingPhone(false);
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      toast.error('Formato inválido. Usá JPG, PNG o WebP.');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error('El logo no puede superar 2 MB.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sin sesión');
      return;
    }

    setUploadingLogo(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/agentes/me/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.mensaje || 'No se pudo subir el logo');
      }
      const updated = await res.json();
      const profile = extractProfile(updated);
      setForm(profile);
      if (profile.logoUrl) localStorage.setItem('logoUrl', profile.logoUrl);
      else localStorage.removeItem('logoUrl');
      window.dispatchEvent(new Event('agent-branding-updated'));
      toast.success('Logo actualizado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir el logo';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sin sesión');
      return;
    }

    setRemovingLogo(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/agentes/me/logo`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.mensaje || 'No se pudo eliminar el logo');
      }
      const updated = await res.json().catch(() => null);
      if (updated) {
        setForm(extractProfile(updated));
      } else {
        setForm((prev) => ({ ...prev, logoUrl: '' }));
      }
      localStorage.removeItem('logoUrl');
      window.dispatchEvent(new Event('agent-branding-updated'));
      toast.success('Logo eliminado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el logo';
      setError(msg);
      toast.error(msg);
    } finally {
      setRemovingLogo(false);
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      toast.error('Formato inválido. Usá JPG, PNG o WebP.');
      return;
    }
    if (file.size > COVER_MAX_BYTES) {
      toast.error('La portada no puede superar 5 MB.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sin sesión');
      return;
    }

    setUploadingCover(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/agentes/me/cover`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.mensaje || 'No se pudo subir la portada');
      }
      const updated = await res.json();
      setForm(extractProfile(updated));
      toast.success('Portada actualizada');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir la portada';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Sin sesión');
      return;
    }

    setRemovingCover(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/agentes/me/cover`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.mensaje || 'No se pudo eliminar la portada');
      }
      const updated = await res.json().catch(() => null);
      if (updated) {
        setForm(extractProfile(updated));
      } else {
        setForm((prev) => ({ ...prev, coverUrl: '' }));
      }
      toast.success('Portada eliminada');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la portada';
      setError(msg);
      toast.error(msg);
    } finally {
      setRemovingCover(false);
    }
  };

  const busy =
    saving || clearingPhone || uploadingLogo || removingLogo || uploadingCover || removingCover;

  const displayName = [form.nombre.trim(), form.apellido.trim()].filter(Boolean).join(' ') || 'Tu nombre';
  const brandName = form.inmobiliaria.trim() || displayName;
  const initial = (form.nombre.trim() || form.inmobiliaria.trim() || 'A').charAt(0).toUpperCase();

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
      hasError
        ? 'border-red-400 bg-red-50/30'
        : 'border-slate-200 bg-white focus:border-indigo-500 hover:border-slate-300'
    }`;

  const primaryGhostBtn =
    'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-colors';
  const dangerGhostBtn =
    'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-100 bg-white text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Volver al panel
        </Link>

        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-1.5">
            Cuenta de agente
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Mi perfil
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm sm:text-base max-w-xl">
            Contacto para consultas y la marca que se ve en el catálogo y en tu página pública.
          </p>
        </header>

        {!form.telefono.trim() && (
          <div className="mb-5 flex items-start gap-3 text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5">
            <MessageCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
            <p>
              Sin WhatsApp, los visitantes no podrán contactarte desde tus publicaciones.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-5 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form id="agent-profile-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Vista previa marca */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 pb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-600" />
                  Cómo se ve tu marca
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Vista previa del header público de tu inmobiliaria.
                </p>
              </div>
            </div>

            <div className="relative mx-5 sm:mx-6 mb-5 rounded-xl overflow-hidden ring-1 ring-slate-200/80">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950" />
              {form.coverUrl && (
                <img
                  src={form.coverUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div
                className={`absolute inset-0 ${
                  form.coverUrl
                    ? 'bg-gradient-to-t from-slate-950/85 via-slate-900/45 to-slate-900/25'
                    : 'bg-slate-950/15'
                }`}
                aria-hidden
              />
              <div className="relative px-4 sm:px-5 py-8 sm:py-10 flex items-end gap-4 min-h-[9.5rem]">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-white/50">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="" className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <span className="text-xl font-bold text-indigo-600">{initial}</span>
                  )}
                </div>
                <div className="min-w-0 pb-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200 mb-0.5">
                    Inmobiliaria
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate drop-shadow-sm">
                    {brandName}
                  </p>
                  {form.inmobiliaria.trim() && (
                    <p className="text-xs text-slate-200/85 mt-0.5 truncate">{displayName}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Datos de contacto */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600 shrink-0" />
                Datos de contacto
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Nombre y WhatsApp que usan los interesados para consultarte.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className={inputClass(!!fieldErrors.nombre)}
                    placeholder="Tu nombre"
                  />
                  {fieldErrors.nombre && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.nombre}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Apellido</label>
                  <input
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChange}
                    className={inputClass(!!fieldErrors.apellido)}
                    placeholder="Tu apellido"
                  />
                  {fieldErrors.apellido && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.apellido}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  name="email"
                  value={form.email}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">No se puede cambiar desde aquí.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    name="telefono"
                    type="tel"
                    value={form.telefono}
                    onChange={handleChange}
                    disabled={clearingPhone}
                    className={`${inputClass(!!fieldErrors.telefono)} pr-11 disabled:opacity-60`}
                    placeholder={AR_MOBILE_PHONE_PLACEHOLDER}
                  />
                  {form.telefono.trim() && (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      disabled={busy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      aria-label="Eliminar número de WhatsApp"
                      title="Eliminar número"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {fieldErrors.telefono ? (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.telefono}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">
                    Móvil Argentina. El tacho elimina el contacto.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Branding */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600 shrink-0" />
                Branding en el catálogo
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Nombre, logo y portada de tu inmobiliaria.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre de la inmobiliaria{' '}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                name="inmobiliaria"
                value={form.inmobiliaria}
                onChange={handleChange}
                className={inputClass(false)}
                placeholder="Ej. Fortese Propiedades"
              />
              <p className="text-xs text-slate-500 mt-1">
                Pie del tile y título de tu página pública.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-5 items-start">
              <div className="h-24 w-24 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center px-2">
                    <ImageIcon className="h-7 w-7 text-slate-300 mx-auto" />
                    <p className="text-[10px] text-slate-400 mt-1">Logo</p>
                  </div>
                )}
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-medium text-slate-800">Logo</p>
                <p className="text-xs text-slate-500">
                  JPG, PNG o WebP · máx. 2 MB · tile, avatar y página pública.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={handleLogoSelect}
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    className={primaryGhostBtn}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {form.logoUrl ? 'Cambiar' : 'Subir logo'}
                  </button>
                  {form.logoUrl && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleRemoveLogo}
                      className={dangerGhostBtn}
                    >
                      {removingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-slate-800">Portada / fondo</p>
                <p className="text-xs text-slate-500">máx. 5 MB</p>
              </div>
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                <div className="aspect-[2.4/1] relative bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-50">
                  {form.coverUrl ? (
                    <img
                      src={form.coverUrl}
                      alt="Portada"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400">
                      <ImageIcon className="h-8 w-8 opacity-70" />
                      <span className="text-xs font-medium">Sin portada todavía</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept={IMAGE_ACCEPT}
                      className="hidden"
                      onChange={handleCoverSelect}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => coverInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-slate-800 text-xs font-semibold shadow-sm border border-white/80 hover:bg-white disabled:opacity-50"
                    >
                      {uploadingCover ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {form.coverUrl ? 'Cambiar' : 'Subir'}
                    </button>
                    {form.coverUrl && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleRemoveCover}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-red-600 text-xs font-semibold shadow-sm border border-white/80 hover:bg-red-50 disabled:opacity-50"
                      >
                        {removingCover ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Fondo del perfil público. Ideal horizontal, buena luz.
              </p>
            </div>
          </section>
        </form>
      </div>

      {/* Barra fija guardar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <p className="hidden sm:block text-xs text-slate-500">
            Los cambios de logo y portada se guardan al subirlos.
          </p>
          <button
            type="submit"
            form="agent-profile-form"
            disabled={busy}
            className="ml-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-indigo-600/20"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-phone-title"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h2 id="clear-phone-title" className="text-lg font-bold text-slate-900 mb-2">
                ¿Eliminar tu WhatsApp?
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-1">
                Vas a eliminar{' '}
                <span className="font-medium text-slate-800">{form.telefono}</span> de tu perfil.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Los visitantes{' '}
                <span className="font-medium text-indigo-700">no podrán contactarte</span> por
                WhatsApp hasta que cargues un número nuevo.
              </p>
            </div>

            <div className="flex gap-3 px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearPhone}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
