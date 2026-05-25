import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { MEMBRESIA_BANNER_DISMISS_KEY } from '../lib/membresia';

interface MembresiaBannerProps {
  membresiaActiva: boolean;
  className?: string;
}

export default function MembresiaBanner({ membresiaActiva, className = '' }: MembresiaBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(MEMBRESIA_BANNER_DISMISS_KEY) === '1');
  }, []);

  useEffect(() => {
    if (!membresiaActiva) {
      setDismissed(sessionStorage.getItem(MEMBRESIA_BANNER_DISMISS_KEY) === '1');
    }
  }, [membresiaActiva]);

  if (membresiaActiva || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(MEMBRESIA_BANNER_DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm ${className}`}
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm sm:text-base">Membresía inactiva</p>
        <p className="text-sm text-amber-900/90 mt-0.5">
          No podés publicar propiedades nuevas hasta que un administrador active tu membresía.
          Contactá al administrador si necesitás ayuda.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-lg p-1 text-amber-700 hover:bg-amber-100 transition"
        aria-label="Cerrar aviso"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
