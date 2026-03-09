import { useEffect, useState } from 'react';
import HeroSection from '../components/HeroSection';
import PropertyCard from '../components/PropertyCard';
import { api } from '../services/api';
import { Property } from '../types';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await api.getProperties();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Propiedades Destacadas</h2>
            <p className="mt-2 text-lg text-gray-600">Descubre las mejores opciones para ti</p>
          </div>
          <button className="text-indigo-600 font-medium hover:text-indigo-700 hidden sm:block">
            Ver todas &rarr;
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
