import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import PropertyForm from './PropertyForm';
import PropertyDetailSkeleton from '../components/PropertyDetailSkeleton';

export default function EditProperty() {
  const { id } = useParams();
  const [property, setProperty] = useState<{ id?: string; titulo?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const base = import.meta.env.VITE_API_URL;

    Promise.all([
      fetch(`${base}/propiedades/${id}`, { headers }).then(res => {
        if (!res.ok) throw new Error('Error al obtener propiedad');
        return res.json();
      }),
      fetch(`${base}/imagenes/propiedad/${id}`, { headers }).then(res =>
        res.ok ? res.json() : []
      ),
    ])
      .then(([data, imagenes]) => setProperty({ ...data, imagenes }))
      .catch(err => {
        console.error(err);
        setProperty(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <div className="bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
            <span className="text-sm text-slate-600">Cargando propiedad...</span>
          </div>
        </div>
        <PropertyDetailSkeleton />
      </>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Propiedad no encontrada</h2>
        <p className="text-slate-600 mb-6">No pudimos cargar los datos para editar.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>
      </div>
    );
  }

  return (
    <>
      {property.id && (
        <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600 truncate max-w-md">
              Editando: <span className="font-semibold text-slate-900">{property.titulo}</span>
            </p>
            <Link
              to={`/propiedad/${property.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <ExternalLink className="h-4 w-4" />
              Ver publicación
            </Link>
          </div>
        </div>
      )}
      <PropertyForm initialData={property} isEdit />
    </>
  );
}
