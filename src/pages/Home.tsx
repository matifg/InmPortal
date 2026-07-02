import { useEffect, useState, useMemo, useRef } from 'react';
import HeroSection from '../components/HeroSection';
import ScrollFab from '../components/ScrollFab';
import PropertyCard from '../components/PropertyCard';
import { api } from '../services/api';
import { Property } from '../types';
import {
  Loader2,
  Home as HomeIcon,
  SearchX,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  EMPTY_PROPERTY_FILTERS,
  PropertySearchFilters,
  filterProperties,
  hasActiveFilters,
} from '../lib/filterProperties';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type SortOption = 'recent' | 'price-asc' | 'price-desc';

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [draftFilters, setDraftFilters] = useState<PropertySearchFilters>(EMPTY_PROPERTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<PropertySearchFilters>(EMPTY_PROPERTY_FILTERS);

  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const listadoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setFetchError('');
      try {
        const data = await api.getProperties();
        setProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setFetchError('No se pudieron cargar las propiedades. Intentá de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    const filtered = filterProperties(properties, appliedFilters);
    if (sortBy === 'recent') return filtered;

    return [...filtered].sort((a, b) =>
      sortBy === 'price-asc' ? a.price - b.price : b.price - a.price
    );
  }, [properties, appliedFilters, sortBy]);

  const filtersActive = hasActiveFilters(appliedFilters);
  const canClearFilters =
    hasActiveFilters(draftFilters) || hasActiveFilters(appliedFilters);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / itemsPerPage));

  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProperties.slice(start, start + itemsPerPage);
  }, [filteredProperties, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setAppliedFilters({ ...draftFilters });
      setCurrentPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [draftFilters]);

  const handleFiltersChange = (patch: Partial<PropertySearchFilters>) => {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
  };

  const scrollToListado = () => {
    requestAnimationFrame(() => {
      listadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSearch = () => {
    setAppliedFilters({ ...draftFilters });
    setCurrentPage(1);
    scrollToListado();
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_PROPERTY_FILTERS);
    setAppliedFilters(EMPTY_PROPERTY_FILTERS);
    setCurrentPage(1);
    scrollToListado();
  };

  const clearSingleFilter = (key: keyof PropertySearchFilters) => {
    setDraftFilters((prev) => ({ ...prev, [key]: '' }));
    setAppliedFilters((prev) => ({ ...prev, [key]: '' }));
    setCurrentPage(1);
  };

  const filterChips = [
    appliedFilters.city
      ? { key: 'city' as const, label: `Ciudad: ${appliedFilters.city}` }
      : null,
    appliedFilters.tipoId
      ? {
          key: 'tipoId' as const,
          label:
            appliedFilters.tipoId === '1'
              ? 'Tipo: Casa'
              : appliedFilters.tipoId === '2'
                ? 'Tipo: Departamento'
                : 'Tipo: Terreno',
        }
      : null,
    appliedFilters.operacion
      ? { key: 'operacion' as const, label: `Operación: ${appliedFilters.operacion}` }
      : null,
  ].filter(Boolean) as { key: keyof PropertySearchFilters; label: string }[];

  const rangeStart =
    filteredProperties.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, filteredProperties.length);

  const resultLabel = loading
    ? 'Cargando propiedades...'
    : filtersActive
      ? `${filteredProperties.length} resultado${filteredProperties.length === 1 ? '' : 's'}`
      : `${properties.length} en catálogo`;

  return (
    <div className="min-h-screen bg-slate-50">
      <HeroSection
        filters={draftFilters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
        onClear={handleClearFilters}
        canClear={canClearFilters}
        onScrollToListado={scrollToListado}
      />

      <ScrollFab listadoRef={listadoRef} />

      <main
        id="listado"
        ref={listadoRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 scroll-mt-24"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {filtersActive ? 'Resultados' : 'Propiedades'}
              </h2>
              {!loading && (
                <span className="rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 border border-indigo-100">
                  {resultLabel}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm sm:text-base">
              {filtersActive
                ? 'Listado según los filtros aplicados.'
                : 'Explorá todas las propiedades disponibles.'}
            </p>
          </div>

          {filtersActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              title="Limpiar filtros"
              aria-label="Limpiar filtros"
              className="inline-flex h-10 w-10 items-center justify-center self-start rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        {filtersActive && filterChips.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => clearSingleFilter(chip.key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
              >
                {chip.label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-3">
            <Loader2 className="h-9 w-9 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500">Cargando propiedades...</p>
          </div>
        ) : fetchError ? (
          <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <p className="text-red-600 font-medium">{fetchError}</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm flex flex-col items-center gap-4">
            {filtersActive ? (
              <>
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <SearchX className="h-7 w-7 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Sin resultados</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  No hay propiedades con esos filtros. Probá con otros criterios.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-1 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <HomeIcon className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Catálogo vacío</h3>
                <p className="text-slate-500 text-sm">Volvé más tarde para ver nuevos avisos.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <SlidersHorizontal className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="font-medium text-slate-700">Mostrar</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 outline-none cursor-pointer"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span>por página</span>
                <span className="mx-1 text-slate-300">|</span>
                <span className="font-medium text-slate-700">Ordenar</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 outline-none cursor-pointer"
                >
                  <option value="recent">Más recientes</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                </select>
              </div>
              <p className="text-sm text-slate-500 tabular-nums">
                <span className="font-semibold text-slate-800">{rangeStart}</span>
                {' – '}
                <span className="font-semibold text-slate-800">{rangeEnd}</span>
                {' de '}
                <span className="font-semibold text-slate-800">{filteredProperties.length}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
              {paginatedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-3"
                aria-label="Paginación"
              >
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <span className="min-w-[7rem] text-center text-sm font-medium text-slate-600 tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}
