import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, User, MessageCircle, Save, Trash2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AR_MOBILE_PHONE_PLACEHOLDER,
  AR_MOBILE_PHONE_ERROR,
  isValidArMobilePhone,
  normalizeArMobileDigits,
} from '../lib/agentContact';

type ProfileForm = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
};

function extractProfile(data: Record<string, unknown>): ProfileForm {
  const nested = (data.usuario ?? data.user) as Record<string, unknown> | undefined;
  return {
    nombre: String(data.nombre ?? nested?.nombre ?? ''),
    apellido: String(data.apellido ?? nested?.apellido ?? ''),
    email: String(data.email ?? nested?.email ?? ''),
    telefono: String(data.telefono ?? nested?.telefono ?? ''),
  };
}

export default function AgentProfile() {
  const [form, setForm] = useState<ProfileForm>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
      hasError
        ? 'border-red-400 bg-red-50/30'
        : 'border-gray-200 bg-white focus:border-indigo-500 hover:border-gray-300'
    }`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Volver al panel
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <User className="h-7 w-7 text-indigo-600" />
            Mi perfil
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Actualizá tus datos de contacto. Los visitantes usarán tu WhatsApp para consultar propiedades.
          </p>
        </div>

        {!form.telefono.trim() && (
          <div className="mb-5 flex items-start gap-2 text-sm text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
            <MessageCircle className="h-5 w-5 shrink-0 mt-0.5 text-indigo-600" />
            <p>
              Sin WhatsApp cargado, los visitantes no podrán contactarte desde tus publicaciones.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-5 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              name="email"
              value={form.email}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar desde aquí.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              WhatsApp <span className="text-gray-400 font-normal">(opcional)</span>
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
                  disabled={saving || clearingPhone}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
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
              <p className="text-xs text-gray-500 mt-1">
                Formato móvil Argentina. Tocá el tacho para eliminar el contacto.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || clearingPhone}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-3 rounded-xl font-semibold transition-colors duration-200 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Guardar cambios
              </>
            )}
          </button>
        </form>
      </div>

      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-phone-title"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
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
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h2 id="clear-phone-title" className="text-lg font-bold text-gray-900 mb-2">
                ¿Eliminar tu WhatsApp?
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-1">
                Vas a eliminar <span className="font-medium text-gray-800">{form.telefono}</span> de tu perfil.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Los visitantes <span className="font-medium text-indigo-700">no podrán contactarte</span> por WhatsApp desde tus publicaciones hasta que cargues un número nuevo.
              </p>
            </div>

            <div className="flex gap-3 px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
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
