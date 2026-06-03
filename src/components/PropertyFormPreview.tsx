import { MapPin, Bed, Bath, Square } from 'lucide-react';

interface PropertyFormPreviewProps {
  title: string;
  price: string;
  currency: string;
  city: string;
  address: string;
  status: string;
  coverUrl: string | null;
  bedrooms: string;
  bathrooms: string;
  area: string;
}

export default function PropertyFormPreview({
  title,
  price,
  currency,
  city,
  address,
  status,
  coverUrl,
  bedrooms,
  bathrooms,
  area,
}: PropertyFormPreviewProps) {
  const displayPrice = price
    ? `${price} ${currency === 'USD' ? 'USD' : 'ARS'}`
    : '—';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 pt-4 pb-2">
        Vista previa del listado
      </p>
      <div className="aspect-[4/3] bg-slate-100 relative">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            Sin portada
          </div>
        )}
        {status && (
          <span className="absolute top-3 left-3 bg-slate-900/85 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {status}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xl font-bold text-indigo-600 truncate">{displayPrice}</p>
        <h3 className="font-bold text-slate-900 mt-1 line-clamp-2 text-sm">
          {title || 'Título de la propiedad'}
        </h3>
        {(city || address) && (
          <p className="flex items-center gap-1 text-slate-500 text-xs mt-2 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[city, address].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          {bedrooms && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" /> {bedrooms}
            </span>
          )}
          {bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {bathrooms}
            </span>
          )}
          {area && (
            <span className="flex items-center gap-1">
              <Square className="h-3.5 w-3.5" /> {area} m²
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
