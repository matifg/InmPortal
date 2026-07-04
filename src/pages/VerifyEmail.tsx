import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import AuthBranding from '../components/AuthBranding';

type VerifyState = 'loading' | 'success' | 'error';

type VerifyResult =
  | { ok: true }
  | { ok: false; errorMessage: string }
  | { ok: false; connectionError: true };

const verifyEmailRequests = new Map<string, Promise<VerifyResult>>();

function requestEmailVerification(token: string): Promise<VerifyResult> {
  const existing = verifyEmailRequests.get(token);
  if (existing) return existing;

  const promise = (async (): Promise<VerifyResult> => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/verificar-email?token=${encodeURIComponent(token)}`
      );

      if (res.ok) {
        return { ok: true };
      }

      return { ok: false, errorMessage: await parseErrorMessage(res) };
    } catch {
      return { ok: false, connectionError: true };
    }
  })();

  verifyEmailRequests.set(token, promise);
  return promise;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data === 'string') return data;
    return data.message || data.mensaje || 'No se pudo verificar tu cuenta.';
  } catch {
    const text = await res.text().catch(() => '');
    return text || 'No se pudo verificar tu cuenta.';
  }
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerifyState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token?.trim()) {
      setErrorMessage('El enlace de verificación no es válido o está incompleto.');
      setState('error');
      return;
    }

    let cancelled = false;

    requestEmailVerification(token).then((result) => {
      if (cancelled) return;

      if (result.ok) {
        setState('success');
        return;
      }

      if ('connectionError' in result) {
        setErrorMessage('Error de conexión. Intentá de nuevo más tarde.');
      } else {
        setErrorMessage(result.errorMessage);
      }
      setState('error');
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="relative min-h-full flex items-center justify-center p-3 sm:p-4 py-4 bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/casa-login.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-indigo-950/80" aria-hidden />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 px-5 sm:px-6 py-5 flex flex-col gap-3.5 text-center">

        {state === 'loading' && (
          <div className="flex flex-col items-center gap-3.5 py-2">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
            <p className="text-slate-600 text-sm sm:text-base">Estamos verificando tu cuenta...</p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center gap-3.5 py-2">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">¡Cuenta verificada!</h1>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tu cuenta ya está lista.
                <br />
                Ahora podés iniciar sesión y comenzar a publicar propiedades.
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

        {state === 'error' && (
          <div className="flex flex-col items-center gap-3.5 py-2">
            <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
              <XCircle className="h-9 w-9 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">No pudimos verificar tu cuenta</h1>
              <p className="text-slate-600 text-sm leading-relaxed">{errorMessage}</p>
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
