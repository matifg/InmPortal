import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Building2, Eye, EyeOff } from 'lucide-react';
import {
  AR_MOBILE_PHONE_PLACEHOLDER,
  AR_MOBILE_PHONE_ERROR,
  isValidArMobilePhone,
  normalizeArMobileDigits,
} from '../lib/agentContact';
import AuthBranding from '../components/AuthBranding';

type RegisterRole = 'CLIENTE' | 'AGENTE';

const ROLE_CONFIG = {
  CLIENTE: {
    title: 'Creá tu cuenta',
    subtitle: 'Guardá favoritos y contactá agentes',
    image: '/casa-login.jpg',
    overlay: 'bg-emerald-950/75',
    tabActive: 'bg-emerald-600 text-white shadow',
    button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/40',
    inputFocus: 'focus:border-emerald-400 focus:ring-emerald-500/30',
    link: 'text-emerald-600',
    submitLabel: 'Crear cuenta gratis',
  },
  AGENTE: {
    title: 'Publicá como agente',
    subtitle: 'Gestioná tus propiedades desde un panel',
    image: '/casa-register.png',
    overlay: 'bg-indigo-950/75',
    tabActive: 'bg-indigo-600 text-white shadow',
    button: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500/40',
    inputFocus: 'focus:border-indigo-400 focus:ring-indigo-500/30',
    link: 'text-indigo-600',
    submitLabel: 'Crear cuenta de agente',
  },
} as const;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAgentConfirm, setShowAgentConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
  });

  const [role, setRole] = useState<RegisterRole>('CLIENTE');
  const cfg = ROLE_CONFIG[role];

  useEffect(() => {
    const defaultRole = (location.state as { defaultRole?: RegisterRole })?.defaultRole;
    if (defaultRole === 'AGENTE' || defaultRole === 'CLIENTE') {
      setRole(defaultRole);
    }
  }, [location.state]);

  const validateField = (name: string, value: string, currentRole = role) => {
    let fieldError = '';
    if (name === 'nombre' || name === 'apellido') {
      if (!value.trim()) fieldError = 'Obligatorio';
      else if (value.trim().length < 2) fieldError = 'Mín. 2 caracteres';
    }
    if (name === 'email') {
      if (!value) fieldError = 'Obligatorio';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fieldError = 'Email inválido';
    }
    if (name === 'telefono') {
      if (currentRole === 'AGENTE') {
        if (!value.trim()) fieldError = 'WhatsApp / teléfono obligatorio para agentes';
        else if (!isValidArMobilePhone(value)) fieldError = AR_MOBILE_PHONE_ERROR;
      } else if (value.trim() && !isValidArMobilePhone(value)) {
        fieldError = AR_MOBILE_PHONE_ERROR;
      }
    }
    if (name === 'password') {
      if (!value) fieldError = 'Obligatorio';
      else if (value.length < 6) fieldError = 'Mín. 6 caracteres';
    }
    setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
    return fieldError;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === 'telefono' && role === 'AGENTE') {
      nextValue = value.replace(/^\+?54\s*9?\s*/, '');
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    validateField(name, nextValue);
  };

  const validate = () => {
    let valid = true;
    const errors: typeof fieldErrors = { nombre: '', apellido: '', email: '', telefono: '', password: '' };

    Object.entries(form).forEach(([name, value]) => {
      const fieldError = validateField(name, value, role);
      errors[name as keyof typeof errors] = fieldError;
      if (fieldError) valid = false;
    });

    setFieldErrors(errors);
    return valid;
  };

  const submitRegistration = async () => {
    setLoading(true);
    setError('');
    try {
      const telefono = form.telefono.trim()
        ? normalizeArMobileDigits(form.telefono)
        : '';

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, telefono, rol: role }),
      });
      if (res.ok) {
        navigate('/registro/confirmacion', { state: { email: form.email.trim(), role } });
      } else {
        const data = await res.json();
        setError(data.message || 'Error al registrar');
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
      setShowAgentConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    if (role === 'AGENTE') {
      setShowAgentConfirm(true);
      return;
    }

    await submitRegistration();
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 outline-none transition text-sm ring-2 ring-transparent ${cfg.inputFocus}`;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url('${cfg.image}')` }}
      />
      <div className={`absolute inset-0 transition-colors duration-500 ${cfg.overlay}`} />

      {showAgentConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Crear cuenta de agente?</h3>
            <p className="text-slate-600 text-sm mb-4">
              Estás registrándote como <strong>agente inmobiliario</strong>. Para publicar propiedades
              necesitás activar una membresía. Tu WhatsApp ({form.telefono || 'sin número'}) se mostrará
              en las fichas de tus propiedades.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAgentConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitRegistration}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-70"
              >
                {loading ? 'Creando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-full flex items-center justify-center p-3 sm:p-4 py-4">
        <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 px-5 sm:px-6 py-5 flex flex-col gap-3.5">
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                role === 'CLIENTE' ? cfg.tabActive : 'text-slate-600 hover:bg-white'
              }`}
              onClick={() => setRole('CLIENTE')}
            >
              <Search className="h-3.5 w-3.5" />
              Buscar propiedades
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                role === 'AGENTE' ? cfg.tabActive : 'text-slate-600 hover:bg-white'
              }`}
              onClick={() => setRole('AGENTE')}
            >
              <Building2 className="h-3.5 w-3.5" />
              Publicar como agente
            </button>
          </div>

          <div className="text-center pt-0.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{cfg.title}</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">{cfg.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input type="text" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} className={inputClass} />
                {fieldErrors.nombre && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.nombre}</p>}
              </div>
              <div>
                <input type="text" name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} className={inputClass} />
                {fieldErrors.apellido && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.apellido}</p>}
              </div>
              <div>
                <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className={inputClass} />
                {fieldErrors.email && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.email}</p>}
              </div>
              <div>
                {role === 'AGENTE' ? (
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-sm font-medium whitespace-nowrap">
                      +54 9
                    </span>
                    <input
                      type="tel"
                      name="telefono"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder={AR_MOBILE_PHONE_PLACEHOLDER}
                      value={form.telefono}
                      onChange={handleChange}
                      className={`${inputClass} rounded-l-none flex-1 min-w-0`}
                    />
                  </div>
                ) : (
                  <input
                    type="tel"
                    name="telefono"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Teléfono (opcional)"
                    value={form.telefono}
                    onChange={handleChange}
                    className={inputClass}
                  />
                )}
                {role === 'AGENTE' && !fieldErrors.telefono && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    WhatsApp argentino (móvil). Los visitantes te contactarán por este número.
                  </p>
                )}
                {fieldErrors.telefono && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.telefono}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-start">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Contraseña (mín. 6 caracteres)"
                  value={form.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {fieldErrors.password && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.password}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`sm:min-w-[180px] h-[42px] px-5 rounded-lg font-semibold text-white text-sm transition cursor-pointer shadow-md focus:ring-2 ${cfg.button} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creando...' : cfg.submitLabel}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 rounded-lg px-3 py-2 text-center border border-red-100 text-xs sm:text-sm">
                {error}
              </div>
            )}
          </form>

          <p className="text-center text-sm text-slate-500">
            ¿Ya tenés cuenta?{' '}
            <button type="button" className={`${cfg.link} hover:underline font-medium`} onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
          </p>

        </div>
          <AuthBranding detached />
        </div>
      </div>
    </div>
  );
}
