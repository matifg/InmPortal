import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Building2 } from 'lucide-react';

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

  const validateField = (name: string, value: string) => {
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
      if (!value.trim()) fieldError = 'Obligatorio';
      else if (!/^[\d\s+\-()]{8,}$/.test(value.trim())) fieldError = 'Teléfono inválido';
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
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validate = () => {
    let valid = true;
    const errors: typeof fieldErrors = { nombre: '', apellido: '', email: '', telefono: '', password: '' };

    Object.entries(form).forEach(([name, value]) => {
      const fieldError = validateField(name, value);
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rol: role }),
      });
      if (res.ok) {
        navigate('/login', { state: { registerSuccess: true } });
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
              necesitás activar una membresía.
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

      <div className="relative z-10 h-full flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 px-6 sm:px-8 py-5 sm:py-6 flex flex-col gap-3 sm:gap-4">
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

          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{cfg.title}</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{cfg.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                <input type="text" name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} className={inputClass} />
                {fieldErrors.telefono && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.telefono}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-start">
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña (mín. 6 caracteres)"
                  value={form.password}
                  onChange={handleChange}
                  className={inputClass}
                />
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
      </div>
    </div>
  );
}
