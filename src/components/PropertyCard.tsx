import { Link } from 'react-router-dom';
import { Bed, Bath, Square, MapPin, Home, Car, LayoutGrid } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
}

/** Muestra conteos solo si son > 0 (null/0/undefined se ocultan). */
function hasCount(n?: number | null): n is number {
  return typeof n === 'number' && n > 0;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const coverSrc = property.images?.[0] ?? '';
  const getCurrencyInfo = (currency?: string) => {
    if (!currency) return { symbol: '€', label: 'Euros' };
    if (currency === 'USD') return { symbol: '$', label: 'Dólares' };
    if (currency === 'EUR') return { symbol: '€', label: 'Euros' };
    if (currency === 'ARS') return { symbol: '$', label: 'Pesos' };
    return { symbol: currency, label: currency };
  };

  const formatPrice = (price: number, currency?: string) => {
    const { symbol, label } = getCurrencyInfo(currency);
    return price.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' ' + symbol + ' (' + label + ')';
  };

  const stats = [
    hasCount(property.totalAmbientes)
      ? { icon: LayoutGrid, value: property.totalAmbientes, title: 'Ambientes' }
      : null,
    { icon: Bed, value: property.bedrooms, title: 'Dormitorios' },
    { icon: Bath, value: property.bathrooms, title: 'Baños' },
    hasCount(property.cocheras)
      ? { icon: Car, value: property.cocheras, title: 'Cocheras' }
      : null,
    { icon: Square, value: `${property.area}m²`, title: 'Superficie total' },
    hasCount(property.areaCubierta)
      ? { icon: Square, value: `${property.areaCubierta}m²`, title: 'Superficie cubierta' }
      : null,
  ].filter(Boolean) as { icon: typeof Bed; value: string | number; title: string }[];

  return (
    <Link to={`/propiedad/${property.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-slate-200/70 h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <Home className="h-10 w-10 opacity-40" />
              <span className="text-xs font-medium">Sin imagen</span>
            </div>
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-slate-900/85 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {property.status}
            </span>
            <span className="bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {property.propertyType}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="text-2xl font-bold text-indigo-700 mb-2">
            {property.ocultarPrecio
              ? 'Consultar precio'
              : formatPrice(property.price, property.currency)}
            {!property.ocultarPrecio && property.status === 'Alquiler' && (
              <span className="text-sm text-slate-500 font-normal">/mes</span>
            )}
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {property.title}
          </h3>
          
          <div className="flex items-center text-slate-600 text-sm mb-4">
            <MapPin className="h-4 w-4 mr-1 shrink-0" />
            <span className="truncate">{property.city} - {property.address}</span>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-2">
            {stats.map(({ icon: Icon, value, title }) => (
              <div
                key={title}
                className="flex items-center gap-2 text-slate-700"
                title={title}
              >
                <Icon className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
