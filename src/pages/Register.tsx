import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: ''
  });

  // 1. Estado de rol
  const [role, setRole] = useState<'CLIENTE' | 'AGENTE'>('CLIENTE');

  // Validación en tiempo real
  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'email') {
      if (!value) error = 'El email es obligatorio';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Ingresá un email válido';
    }
    if (name === 'password') {
      if (!value) error = 'La contraseña es obligatoria';
      else if (value.length < 6) error = 'Debe tener al menos 6 caracteres';
    }
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validate = () => {
    let valid = true;
    Object.entries(form).forEach(([name, value]) => {
      validateField(name, value);
      if (value === '' || fieldErrors[name as keyof typeof fieldErrors]) valid = false;
    });
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 3. Usar rol dinámico
        body: JSON.stringify({ ...form, rol: role })
      });
      if (res.ok) {
        navigate('/login');
      } else {
        const data = await res.json();
        setError(data.message || 'Error al registrar');
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <img
          src="/casa-register.png"
          alt="Fondo registro"
          className="w-full h-full object-cover opacity-40"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      {/* Card */}
      <div className="relative z-10 w-full max-w-lg mx-auto bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-indigo-700/20 px-10 py-12 flex flex-col gap-8">
        {/* 2. Selector de rol */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex justify-center gap-2">
            <button
              type="button"
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-150
                ${role === 'CLIENTE'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white/10 text-indigo-200 hover:bg-white/20'}
              `}
              onClick={() => setRole('CLIENTE')}
            >
              Buscar propiedades
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-150
                ${role === 'AGENTE'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white/10 text-indigo-200 hover:bg-white/20'}
              `}
              onClick={() => setRole('AGENTE')}
            >
              Publicar como agente
            </button>
          </div>
          <div className="text-center text-indigo-200 text-sm mt-1 min-h-[20px]">
            {role === 'CLIENTE'
              ? 'Crea una cuenta para guardar favoritos y contactar agentes.'
              : 'Crea una cuenta de agente para publicar y gestionar propiedades.'}
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-1 leading-tight drop-shadow">
          Publicá tus propiedades en minutos
        </h2>
        <p className="text-gray-300 text-center mb-6 text-lg">
          Gestioná todo desde un solo lugar
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Datos personales */}
          <div>
            <div className="text-gray-400 font-semibold mb-2">Datos personales</div>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:bg-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all duration-200 shadow-sm"
                />
                {fieldErrors.nombre && (
                  <div className="text-red-400 text-xs mt-1">{fieldErrors.nombre}</div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  name="apellido"
                  placeholder="Apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:bg-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all duration-200 shadow-sm"
                />
                {fieldErrors.apellido && (
                  <div className="text-red-400 text-xs mt-1">{fieldErrors.apellido}</div>
                )}
              </div>
            </div>
          </div>
          {/* Contacto */}
          <div>
            <div className="text-gray-400 font-semibold mb-2">Contacto</div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:bg-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all duration-200 shadow-sm"
            />
            {fieldErrors.email && (
              <div className="text-red-400 text-xs mt-1">{fieldErrors.email}</div>
            )}
            <input
              type="text"
              name="telefono"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={handleChange}
              className="w-full mt-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:bg-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all duration-200 shadow-sm"
            />
            {fieldErrors.telefono && (
              <div className="text-red-400 text-xs mt-1">{fieldErrors.telefono}</div>
            )}
          </div>
          {/* Acceso */}
          <div>
            <div className="text-gray-400 font-semibold mb-2">Acceso</div>
            <div className="relative">
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:bg-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all duration-200 shadow-sm pr-12"
              />
            </div>
            {fieldErrors.password && (
              <div className="text-red-400 text-xs mt-1">{fieldErrors.password}</div>
            )}
          </div>
          {error && (
            <div className="bg-red-500/10 text-red-300 rounded-lg px-4 py-2 text-center border border-red-400/20">
              {error}
            </div>
          )}
          {/* 5. Botón submit dinámico */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200 cursor-pointer shadow-xl shadow-indigo-700/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading
              ? 'Creando cuenta...'
              : role === 'CLIENTE'
                ? 'Crear cuenta gratis'
                : 'Crear cuenta de agente'}
          </button>
          <div className="text-xs text-gray-400 text-center mt-2">
            Tus datos están protegidos y nunca se compartirán.
          </div>
        </form>
        <div className="mt-6 text-center text-[15px]">
          <span className="text-gray-300">¿Ya tenés cuenta? </span>
          <span
            className="text-indigo-300 hover:underline cursor-pointer font-medium transition"
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </span>
        </div>
      </div>
    </div>
  );
}