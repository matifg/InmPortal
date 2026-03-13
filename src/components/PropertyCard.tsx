import { Link } from 'react-router-dom';
import { Bed, Bath, Square, MapPin } from 'lucide-react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
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

  return (
    <Link to={`/propiedad/${property.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={(property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {property.status}
            </span>
            <span className="bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {property.propertyType}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="text-2xl font-bold text-indigo-600 mb-2">
            {formatPrice(property.price, property.currency)}
            {property.status === 'Alquiler' && <span className="text-sm text-gray-500 font-normal">/mes</span>}
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {property.title}
          </h3>
          
          <div className="flex items-center text-gray-500 text-sm mb-4">
            <MapPin className="h-4 w-4 mr-1 shrink-0" />
            <span className="truncate">{property.city} - {property.address}</span>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Bed className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Bath className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Square className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{property.area}m²</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
