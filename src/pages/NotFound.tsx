import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta('Página no encontrada', 'La página que buscás no existe o fue movida.', {
    noindex: true,
  });

  return (
    <div className="min-h-[60vh] flex flex-col justify-center items-center bg-slate-50 px-4 text-center">
      <p className="text-sm font-semibold text-indigo-600 mb-2">Error 404</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Página no encontrada</h1>
      <p className="text-slate-600 mb-8 max-w-md">
        La página que buscás no existe o fue movida.
      </p>
      <Link
        to="/propiedades"
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
      >
        Ver propiedades
      </Link>
    </div>
  );
}
