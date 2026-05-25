import { Search, MapPin, Home as HomeIcon, RotateCcw, Tag, ChevronDown } from 'lucide-react';
import { PropertySearchFilters } from '../lib/filterProperties';

interface HeroSectionProps {
  filters: PropertySearchFilters;
  onFiltersChange: (patch: Partial<PropertySearchFilters>) => void;
  onSearch: () => void;
  onClear: () => void;
  canClear: boolean;
}

const fieldClass =
  'flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-sm transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15';

const labelClass = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 text-left';

export default function HeroSection({ filters, onFiltersChange, onSearch, onClear, canClear }: HeroSectionProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <section className="relative min-h-[420px] sm:min-h-[460px] flex items-end sm:items-center pb-10 sm:pb-0">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/60 to-slate-900/90" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center sm:text-left mb-8 sm:mb-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 border border-white/10 mb-4">
            Catálogo Inmo360
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            Encontrá tu próxima propiedad
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-xl mx-auto sm:mx-0">
            Filtrá por ciudad, tipo y operación en segundos.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/20 bg-white/95 backdrop-blur-md shadow-2xl shadow-slate-900/20 p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className={labelClass} htmlFor="search-city">
                Ciudad
              </label>
              <div className={fieldClass}>
                <MapPin className="h-4 w-4 text-indigo-500 shrink-0" aria-hidden />
                <input
                  id="search-city"
                  type="text"
                  placeholder="Ej. Rosario, CABA..."
                  value={filters.city}
                  onChange={(e) => onFiltersChange({ city: e.target.value })}
                  className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="search-tipo">
                Tipo
              </label>
              <div className={`${fieldClass} relative`}>
                <HomeIcon className="h-4 w-4 text-indigo-500 shrink-0" aria-hidden />
                <select
                  id="search-tipo"
                  value={filters.tipoId}
                  onChange={(e) => onFiltersChange({ tipoId: e.target.value })}
                  className="w-full appearance-none bg-transparent text-sm text-slate-800 focus:outline-none cursor-pointer pr-6"
                >
                  <option value="">Todos los tipos</option>
                  <option value="1">Casa</option>
                  <option value="2">Departamento</option>
                  <option value="3">Terreno</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className={labelClass} htmlFor="search-operacion">
                Operación
              </label>
              <div className={`${fieldClass} relative`}>
                <Tag className="h-4 w-4 text-indigo-500 shrink-0" aria-hidden />
                <select
                  id="search-operacion"
                  value={filters.operacion}
                  onChange={(e) => onFiltersChange({ operacion: e.target.value })}
                  className="w-full appearance-none bg-transparent text-sm text-slate-800 focus:outline-none cursor-pointer pr-6"
                >
                  <option value="">Venta o alquiler</option>
                  <option value="Venta">Venta</option>
                  <option value="Alquiler">Alquiler</option>
                  <option value="Temporario">Temporario</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 sm:justify-end">
            <button
              type="submit"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.98] transition"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={!canClear}
              title="Limpiar filtros"
              aria-label="Limpiar filtros"
              className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 hover:border-indigo-200 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:text-slate-600 disabled:hover:border-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
