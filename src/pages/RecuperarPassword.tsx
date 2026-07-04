import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import AuthBranding from '../components/AuthBranding';

type PageState = 'form' | 'success';

export default function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<PageState>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/recuperar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setState('success');
        return;
      }

      if (res.status >= 500) {
        setError('No pudimos enviar el enlace. Intentá de nuevo más tarde.');
        return;
      }

      setState('success');
    } catch {
      setError('Error de conexión. Intentá de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-full flex items-center justify-center p-3 sm:p-4 py-4 bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/casa-login.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-indigo-950/80" aria-hidden />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 px-5 sm:px-6 py-5 sm:py-6">
        <div className="text-center mb-4">
          <span className="text-2xl font-extrabold text-slate-800 tracking-tight">Inmo360</span>
        </div>

        {state === 'form' && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Recuperar contraseña</h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                Ingresá el correo electrónico asociado a tu cuenta y te enviaremos un enlace para
                restablecer tu contraseña.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-center border border-red-100 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 outline-none transition ring-2 ring-transparent text-sm focus:border-indigo-500 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-lg font-semibold text-white text-sm transition cursor-pointer shadow-md focus:ring-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-400/40 inline-flex items-center justify-center gap-2 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Enviando...
                  </>
                ) : (
                  'Enviar enlace'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                Volver al login
              </Link>
            </p>
          </>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <div className="flex items-start gap-2 text-left rounded-xl bg-indigo-50/80 border border-indigo-100 px-4 py-3 w-full">
              <Mail className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">
                Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu
                contraseña.
              </p>
            </div>
            <Link
              to="/login"
              className="w-full mt-2 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              Volver al login
            </Link>
          </div>
        )}

        </div>
        <AuthBranding detached />
      </div>
    </div>
  );
}
