import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Property } from '../types';
import ImageSlider from '../components/ImageSlider';
import { MapPin, Bed, Bath, Square, Home as HomeIcon, Loader2, ArrowLeft, Phone, Mail } from 'lucide-react';

const BASE_URL = "http://localhost:8080"; // Ajusta según tu backend

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
  if (!id) return;

  try {
    const data = await api.getPropertyById(id);

    const token = localStorage.getItem('token');

    const res = await fetch(`http://localhost:8080/imagenes/propiedad/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const imagenes = res.ok ? await res.json() : [];

    // 🔥 CLAVE
    setProperty({
      ...data,
      imagenes,
    });

  } catch (error) {
    console.error('Error fetching property:', error);
  } finally {
    setLoading(false);
  }
};

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Propiedad no encontrada</h2>
        <p className="text-gray-600 mb-8">La propiedad que buscas no existe o ha sido eliminada.</p>
        <Link to="/" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
          Volver al inicio
        </Link>
      </div>
    );
  }

  // LOG para debug
  console.log(property);

  // Validación y mapeo robusto de imágenes
  let images: string[] = [];
  if (property && Array.isArray(property.imagenes)) {
    console.log(property.imagenes);
    images = property.imagenes
      .map((img: any) => {
        let url = img?.url || img?.path || img?.imageUrl || "";
        if (typeof url === "string" && url.trim() !== "") {
          // Si no es absoluta, la concateno con BASE_URL
          if (!/^https?:\/\//i.test(url)) {
            url = `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
          }
          return url;
        }
        return null;
      })
      .filter((url): url is string => !!url && url.trim() !== "");
  }
  // Fallback si no hay imágenes válidas
  if (!images.length) {
    images = ["/no-image.jpg"];
  }

  // LOG para debug
  console.log(images);

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
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-indigo-600 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a resultados
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Galería de imágenes protagonista */}
          <div className="w-full">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white flex items-center justify-center h-[240px] sm:h-[320px] lg:h-[540px]">
              <ImageSlider
                images={images}
                imgClassName="object-cover w-full h-full max-h-full"
                containerClassName="w-full h-full"
              />
            </div>
          </div>
          {/* Información principal a la derecha */}
          <div className="flex flex-col justify-center h-full">
            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
                {property.status}
              </span>
              <span className="bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                {property.propertyType}
              </span>
            </div>
            {/* Título y precio juntos */}
            <div className="flex flex-col gap-2 mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                {property.title}
              </h1>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 drop-shadow-sm">
                {formatPrice(property.price, property.currency)}
                {property.status === 'Alquiler' && (
                  <span className="text-lg text-gray-500 font-normal">/mes</span>
                )}
              </div>
            </div>
            {/* Dirección */}
            <div className="flex items-center gap-2 text-base sm:text-lg text-gray-700 font-medium mb-0">
              <MapPin className="h-5 w-5 text-indigo-400 mr-1.5 shrink-0" />
              <span>{property.address}, {property.city}</span>
            </div>
          </div>
        </div>

        {/* Características y resto del contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Features Grid */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Características principales</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                  <Bed className="h-8 w-8 text-indigo-600 mb-2" />
                  <span className="text-2xl font-bold text-gray-900">{property.bedrooms}</span>
                  <span className="text-sm text-gray-500">Habitaciones</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                  <Bath className="h-8 w-8 text-indigo-600 mb-2" />
                  <span className="text-2xl font-bold text-gray-900">{property.bathrooms}</span>
                  <span className="text-sm text-gray-500">Baños</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                  <Square className="h-8 w-8 text-indigo-600 mb-2" />
                  <span className="text-2xl font-bold text-gray-900">{property.area}</span>
                  <span className="text-sm text-gray-500">m²</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                  <HomeIcon className="h-8 w-8 text-indigo-600 mb-2" />
                  <span className="text-lg font-bold text-gray-900 text-center leading-tight">{property.propertyType}</span>
                  <span className="text-sm text-gray-500">Tipo</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Descripción</h2>
              <div className="prose prose-lg text-gray-600 max-w-none">
                <p className="whitespace-pre-line">{property.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Contactar al agente</h3>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-indigo-600">A</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Agente Inmobiliario</p>
                  <p className="text-gray-500">InmoPortal Premium</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                  <Phone className="h-5 w-5" />
                  <span>Llamar ahora</span>
                </button>
                <button className="w-full flex items-center justify-center gap-2 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-medium transition-colors">
                  <Mail className="h-5 w-5" />
                  <span>Enviar mensaje</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <form className="space-y-4">
                  <div>
                    <input type="text" placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <input type="email" placeholder="Tu email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <textarea rows={4} placeholder="Me interesa esta propiedad..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none"></textarea>
                  </div>
                  <button type="button" className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                    Solicitar información
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cambios clave en ImageSlider:
// - Pasa imgClassName="object-cover w-full h-full max-h-full"
// - El contenedor del slider tiene altura fija y overflow hidden
// - Layout header+slider juntos para menos scroll
// - Espaciados verticales reducidos (mb-4, mb-8, pt-4, pb-8)
// - El contenido importante aparece arriba sin scroll excesivo
