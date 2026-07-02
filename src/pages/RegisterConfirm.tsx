import { Link, Navigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';

type LocationState = {
  email?: string;
  role?: 'CLIENTE' | 'AGENTE';
};

export default function RegisterConfirm() {
  const location = useLocation();
  const state = (location.state as LocationState) ?? {};
  const email = state.email?.trim();

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const isAgente = state.role === 'AGENTE';
  const primaryBtn = isAgente
    ? 'bg-indigo-600 hover:bg-indigo-700'
    : 'bg-emerald-600 hover:bg-emerald-700';

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4 sm:p-6 bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('${isAgente ? '/casa-register.png' : '/casa-login.jpg'}')` }}
        aria-hidden
      />
      <div
        className={`absolute inset-0 ${isAgente ? 'bg-indigo-950/80' : 'bg-emerald-950/75'}`}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 px-6 sm:px-8 py-8">
        <div className="text-center mb-6">
          <span className="text-2xl font-extrabold text-slate-800 tracking-tight">Inmo360</span>
        </div>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-3">Cuenta creada correctamente</h1>
            <div className="flex items-start gap-2 text-left rounded-xl bg-indigo-50/80 border border-indigo-100 px-4 py-3 mb-3">
              <Mail className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">
                Te enviamos un correo de verificación a{' '}
                <span className="font-semibold text-slate-800 break-all">{email}</span>.
              </p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Revisá tu bandeja de entrada y hacé clic en el enlace para activar tu cuenta.
            </p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Si no encontrás el correo, revisá Spam o Correo no deseado.
            </p>
          </div>

          <div className="w-full space-y-2.5 pt-2">
            <Link
              to="/login"
              className={`w-full inline-flex items-center justify-center ${primaryBtn} text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors shadow-md`}
            >
              Ir al login
            </Link>
            <button
              type="button"
              disabled
              title="Próximamente"
              className="w-full inline-flex items-center justify-center border border-gray-200 bg-gray-50 text-gray-400 px-5 py-3 rounded-xl font-semibold text-sm cursor-not-allowed opacity-70"
            >
              {/* TODO: Implementar reenvío cuando exista POST /auth/reenviar-verificacion */}
              Reenviar correo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
