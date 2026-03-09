import { Search, MapPin, Home } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative bg-gray-900 h-[500px] flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Modern home exterior"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
      </div>

      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 w-full max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
          Encuentra el hogar de tus sueños
        </h1>
        <p className="mt-4 text-xl text-gray-200 max-w-2xl mx-auto mb-10">
          Descubre miles de propiedades en venta y alquiler en las mejores zonas de la ciudad.
        </p>

        {/* Search Box */}
        <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto">
          <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <MapPin className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
            <input
              type="text"
              placeholder="¿En qué ciudad buscas?"
              className="bg-transparent w-full focus:outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
          
          <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <Home className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
            <select className="bg-transparent w-full focus:outline-none text-gray-700 appearance-none">
              <option value="">Tipo de propiedad</option>
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="terreno">Terreno</option>
            </select>
          </div>

          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 sm:w-auto w-full">
            <Search className="h-5 w-5" />
            <span>Buscar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
