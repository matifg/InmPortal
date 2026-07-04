import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import AuthBranding from '../components/AuthBranding';

type PageState = 'form' | 'success' | 'invalid-link';

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data === 'string') return data;
    return data.message || data.mensaje || 'No se pudo restablecer la contraseña.';
  } catch {
    const text = await res.text().catch(() => '');
    return text || 'No se pudo restablecer la contraseña.';
  }
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, setState] = useState<PageState>(token ? 'form' : 'invalid-link');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ password: '', confirmPassword: '' });

  const validateField = (name: 'password' | 'confirmPassword', value: string, nextPassword = password, nextConfirm = confirmPassword) => {
    let fieldError = '';

    if (name === 'password') {
      if (value && value.length < 6) fieldError = 'Mín. 6 caracteres';
      if (nextConfirm && value !== nextConfirm) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      } else if (nextConfirm) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    }

    if (name === 'confirmPassword') {
      if (value && value !== nextPassword) fieldError = 'Las contraseñas no coinciden';
    }

    setFieldErrors((prev) => ({ ...prev, [name]: fieldError }));
    return fieldError;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setError('');
    validateField('password', value, value, confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setError('');
    validateField('confirmPassword', value, password, value);
  };

  const passwordsMatch = password.length >= 6 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setFieldErrors((prev) => ({ ...prev, password: 'Mín. 6 caracteres' }));
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/restablecer-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setState('success');
        return;
      }

      setError(await parseErrorMessage(res));
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
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 px-5 sm:px-6 py-5 flex flex-col gap-3.5">

        {state === 'invalid-link' && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
              <XCircle className="h-9 w-9 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Enlace inválido</h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                El enlace para restablecer tu contraseña no es válido o está incompleto.
              </p>
            </div>
            <Link
              to="/recuperar-password"
              className="w-full mt-2 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        )}

        {state === 'form' && (
          <>
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900 mb-1.5">Restablecer contraseña</h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                Ingresá tu nueva contraseña para recuperar el acceso a tu cuenta.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-center border border-red-100 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Nueva contraseña"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={`w-full px-3 py-2.5 pr-10 rounded-lg border outline-none transition ring-2 ring-transparent text-sm focus:border-indigo-500 focus:ring-indigo-500/20 ${
                      fieldErrors.password ? 'border-red-300' : 'border-gray-200'
                    }`}
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
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-0.5">{fieldErrors.password}</p>
                )}
              </div>
              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={`w-full px-3 py-2.5 pr-10 rounded-lg border outline-none transition ring-2 ring-transparent text-sm focus:border-indigo-500 focus:ring-indigo-500/20 ${
                      fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-0.5">{fieldErrors.confirmPassword}</p>
                )}
                {!fieldErrors.confirmPassword && confirmPassword && passwordsMatch && (
                  <p className="text-emerald-600 text-xs mt-0.5">Las contraseñas coinciden</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !passwordsMatch}
                className={`w-full py-2.5 rounded-lg font-semibold text-white text-sm transition cursor-pointer shadow-md focus:ring-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-400/40 inline-flex items-center justify-center gap-2 ${
                  loading || !passwordsMatch ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Guardando...
                  </>
                ) : (
                  'Restablecer contraseña'
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
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">¡Contraseña actualizada!</h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tu contraseña fue restablecida correctamente. Ya podés iniciar sesión.
              </p>
            </div>
            <Link
              to="/login"
              className="w-full mt-2 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              Ir al login
            </Link>
          </div>
        )}

        </div>
        <AuthBranding detached />
      </div>
    </div>
  );
}
