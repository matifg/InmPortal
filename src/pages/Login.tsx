import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Building2, Search, Clock, Home, Eye, EyeOff } from 'lucide-react';

type LoginMode = 'visitante' | 'agente';

const MODE_CONFIG = {
  visitante: {
    subtitle: 'Explorá propiedades y contactá agentes',
    image: '/casa-login.jpg',
    overlay: 'bg-emerald-950/70',
    button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-400/40',
    tabActive: 'bg-emerald-600 text-white shadow',
    link: 'text-emerald-600',
    inputFocus: 'focus:border-emerald-500 focus:ring-emerald-500/20',
    exploreBtn:
      'border-2 border-emerald-600 text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 hover:border-emerald-700 shadow-sm',
    exploreIcon: 'text-emerald-600',
  },
  agente: {
    subtitle: 'Gestioná tus propiedades desde un solo lugar',
    image: '/casa-register.png',
    overlay: 'bg-indigo-950/70',
    button: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-400/40',
    tabActive: 'bg-indigo-600 text-white shadow',
    link: 'text-indigo-600',
    inputFocus: 'focus:border-indigo-500 focus:ring-indigo-500/20',
    exploreBtn:
      'bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 shadow-md hover:shadow-lg',
    exploreIcon: 'text-white',
  },
} as const;

async function getLoginErrorMessage(res: Response): Promise<string> {
  if (res.status === 401) {
    return 'Credenciales inválidas';
  }

  if (res.status === 403) {
    try {
      const data = await res.json();
      if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
      }
    } catch {
      // ignore parse errors
    }
    return 'Debés verificar tu correo electrónico antes de iniciar sesión.';
  }

  return 'No pudimos iniciar sesión. Intentá de nuevo más tarde.';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<LoginMode>('visitante');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [registerMsg, setRegisterMsg] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const cfg = MODE_CONFIG[mode];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      if (role === 'ADMIN') navigate('/admin', { replace: true });
      else if (role === 'AGENTE') navigate('/dashboard', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (location.state?.sessionEnded) {
      setSessionEnded(true);
      window.history.replaceState({}, document.title);
      return;
    }
    if (location.state?.registerSuccess) {
      setRegisterMsg('Cuenta creada correctamente. Iniciá sesión');
      const timer = setTimeout(() => setRegisterMsg(''), 3000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state?.sessionEnded, location.state?.registerSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(await getLoginErrorMessage(res));
      }

      const data = await res.json();

      if (mode === 'agente' && data.role !== 'AGENTE' && data.role !== 'ADMIN') {
        throw new Error('Esta cuenta no es de agente. Probá ingresar como visitante.');
      }
      if (mode === 'visitante' && (data.role === 'AGENTE' || data.role === 'ADMIN')) {
        throw new Error('Esta cuenta es de agente. Cambiá a "Soy agente" para ingresar.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('membresiaActiva', JSON.stringify(data.membresiaActiva));
      localStorage.setItem('nombre', data.nombre || '');

      if (data.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (data.role === 'AGENTE') navigate('/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url('${cfg.image}')` }}
      />
      <div className={`absolute inset-0 transition-colors duration-500 ${cfg.overlay}`} />

      <div className="relative z-10 h-full flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 px-6 sm:px-8 py-6 flex flex-col gap-4">
          {sessionEnded && (
            <div className="flex flex-col items-center justify-center text-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Clock className="h-6 w-6 text-amber-600" />
              <p className="text-sm font-semibold text-amber-900">Ha finalizado su sesión.</p>
              <p className="text-xs text-amber-700">Volvé a ingresar para continuar.</p>
            </div>
          )}

          <div className="text-center">
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">InmoPortal</span>
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('visitante'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mode === 'visitante' ? cfg.tabActive : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Visitante
            </button>
            <button
              type="button"
              onClick={() => { setMode('agente'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mode === 'agente' ? cfg.tabActive : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Agente
            </button>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Acceso a tu cuenta</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{cfg.subtitle}</p>
          </div>

          {registerMsg && (
            <div className="rounded-lg px-3 py-2 text-center border text-xs sm:text-sm bg-emerald-50 text-emerald-700 border-emerald-100">
              {registerMsg}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg px-3 py-2 text-center border border-red-100 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 outline-none transition ring-2 ring-transparent text-sm ${cfg.inputFocus}`}
              autoComplete="email"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 outline-none transition ring-2 ring-transparent text-sm ${cfg.inputFocus}`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg font-semibold text-white text-sm transition cursor-pointer shadow-md focus:ring-2 ${cfg.button} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            ¿No tenés cuenta?{' '}
            <button
              type="button"
              className={`${cfg.link} hover:underline font-medium`}
              onClick={() => navigate('/register', { state: { defaultRole: mode === 'agente' ? 'AGENTE' : 'CLIENTE' } })}
            >
              Registrate
            </button>
          </p>

          <div className="pt-4 mt-1 border-t border-slate-100 space-y-3">
            <p className="text-center text-sm text-slate-600">¿Solo querés explorar propiedades?</p>
            <Link
              to="/propiedades"
              className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${cfg.exploreBtn}`}
            >
              <Home className={`h-4 w-4 ${cfg.exploreIcon}`} />
              Explorar catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
