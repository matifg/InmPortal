import { MapPin, Bed, Bath, Square, ImageIcon, Home } from 'lucide-react';

interface PropertyFormPreviewProps {
  title: string;
  price: string;
  ocultarPrecio?: boolean;
  currency: string;
  city: string;
  address: string;
  provincia?: string;
  status: string;
  coverUrl: string | null;
  bedrooms: string;
  bathrooms: string;
  area: string;
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="text-gray-400 italic font-normal">{children}</span>;
}

export default function PropertyFormPreview({
  title,
  price,
  ocultarPrecio = false,
  currency,
  city,
  address,
  provincia,
  status,
  coverUrl,
  bedrooms,
  bathrooms,
  area,
}: PropertyFormPreviewProps) {
  const displayPrice = ocultarPrecio
    ? 'Consultar precio'
    : price
      ? new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: currency === 'USD' ? 'USD' : 'ARS',
          maximumFractionDigits: 0,
        }).format(Number(price.replace(/\./g, '')))
      : null;

  const locationParts = [city, provincia, address].filter(Boolean);
  const hasLocation = locationParts.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Vista previa
        </p>
        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
          En vivo
        </span>
      </div>

      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 relative">
        {coverUrl ? (
          <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <div className="w-14 h-14 rounded-2xl bg-white/80 border border-gray-200 flex items-center justify-center shadow-sm">
              <ImageIcon className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium">Agregá fotos para la portada</p>
          </div>
        )}
        {status && (
          <span className="absolute top-3 left-3 bg-gray-900/90 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
            {status}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        <div>
          {displayPrice ? (
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{displayPrice}</p>
          ) : (
            <p className="text-2xl font-bold text-gray-300">
              <Placeholder>Precio</Placeholder>
            </p>
          )}
          <h3 className="font-semibold text-gray-900 mt-1.5 line-clamp-2 text-base leading-snug">
            {title.trim() || <Placeholder>Título de tu propiedad</Placeholder>}
          </h3>
        </div>

        <p className="flex items-start gap-1.5 text-sm text-gray-600">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
          {hasLocation ? (
            <span className="line-clamp-2">{locationParts.join(' · ')}</span>
          ) : (
            <Placeholder>Ubicación</Placeholder>
          )}
        </p>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
          <div className="flex flex-col items-center gap-1 py-2 rounded-xl bg-gray-50">
            <Bed className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">
              {bedrooms || <span className="text-gray-300 font-normal">—</span>}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Dorm.</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-2 rounded-xl bg-gray-50">
            <Bath className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">
              {bathrooms || <span className="text-gray-300 font-normal">—</span>}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Baños</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-2 rounded-xl bg-gray-50">
            <Square className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">
              {area ? (
                <>{area} m²</>
              ) : (
                <span className="text-gray-300 font-normal">—</span>
              )}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Sup.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
          <Home className="h-3.5 w-3.5" />
          <span>Así verán tu anuncio en el listado</span>
        </div>
      </div>
    </div>
  );
}
