import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Redirección si ya está logueado (según role, SIN LOOP)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      if (role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (role === 'AGENTE') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  // ✅ Mensaje de registro (SIN LOOP)
  useEffect(() => {
    if (location.state?.registerSuccess) {
      setSuccessMsg('Cuenta creada correctamente. Iniciá sesión');

      const timer = setTimeout(() => setSuccessMsg(''), 3000);

      window.history.replaceState({}, document.title);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ✅ LOGIN REAL
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

      if (!res.ok) throw new Error('Credenciales inválidas');

      const data = await res.json();

      // 🔥 Guardar sesión (nuevo formato)
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('membresiaActiva', JSON.stringify(data.membresiaActiva));
      localStorage.setItem('nombre', data.nombre || ''); // <--- AGREGAR ESTA LÍNEA

      // Redirige según role
      if (data.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (data.role === 'AGENTE') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }

    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Lado izquierdo: Formulario */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl px-10 py-12 flex flex-col gap-6 animate-fade-in">
          {/* Logo / Nombre */}
          <div className="flex flex-col items-center mb-2">
            <span className="text-3xl font-extrabold text-indigo-700 tracking-tight mb-1 select-none">InmoPortal</span>
          </div>
          {/* Título y subtítulo */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-1">Acceso a tu cuenta</h2>
          <p className="text-gray-500 text-center mb-4">Gestioná tus propiedades de forma simple</p>

          {/* Mensajes */}
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 rounded-lg px-4 py-2 mb-2 text-center border border-emerald-100">
              {successMsg}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 mb-2 text-center border border-red-100">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              autoComplete="email"
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-md ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Link de registro */}
          <div className="mt-4 text-center text-[15px]">
            <span className="text-gray-500">¿No tenés cuenta? </span>
            <span
              className="text-indigo-600 hover:underline cursor-pointer font-medium transition"
              onClick={() => navigate('/register')}
            >
              Registrate
            </span>
          </div>
        </div>
      </div>

      {/* Lado derecho: Imagen de fondo y overlay */}
      <div className="hidden md:block md:w-1/2 relative h-screen">
        {/* Imagen de fondo absoluta */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/casa-login.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Overlay y texto centrado */}
        <div className="absolute inset-0 z-10 bg-black/30 flex flex-col justify-center items-center">
          <div className="text-white text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg text-center px-8">
            Encontrá tu próxima propiedad
          </div>
          <div className="text-indigo-100 text-lg md:text-xl font-medium text-center px-8">
            Tecnología para inmobiliarias modernas
          </div>
        </div>
      </div>
    </div>
  );
}