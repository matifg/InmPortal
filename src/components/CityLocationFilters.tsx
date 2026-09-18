import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MapPin, ChevronDown, Loader2 } from 'lucide-react';
import { fetchProvincias, fetchLocalidades, type UbicacionItem } from '../services/ubicaciones';
import { normalizeSearch } from '../lib/filterProperties';

const fieldClass =
  'flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-sm transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15';

const labelClass = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 text-left';

const ALL_PROVINCIAS = '';

interface CityLocationFiltersProps {
  city: string;
  onCityChange: (city: string) => void;
  /** Incrementar para resetear provincia/localidades (botón limpiar). */
  resetToken?: number;
}

async function fetchAllLocalidades(provincias: UbicacionItem[]): Promise<UbicacionItem[]> {
  const lists = await Promise.all(
    provincias.map((p) => fetchLocalidades(p.id).catch(() => [] as UbicacionItem[]))
  );
  // Mismo nombre en varias provincias (ej. San Pedro) → una sola sugerencia:
  // el filtro del home matchea por nombre de ciudad, no por provincia.
  const byName = new Map<string, UbicacionItem>();
  for (const loc of lists.flat()) {
    const key = normalizeSearch(loc.nombre);
    if (!key || byName.has(key)) continue;
    byName.set(key, loc);
  }
  return [...byName.values()].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  );
}

function dedupeLocalidadesByName(list: UbicacionItem[]): UbicacionItem[] {
  const byName = new Map<string, UbicacionItem>();
  for (const loc of list) {
    const key = normalizeSearch(loc.nombre);
    if (!key || byName.has(key)) continue;
    byName.set(key, loc);
  }
  return [...byName.values()];
}

/**
 * Combinación: select de provincia (misma API del ABM) + input de ciudad
 * con sugerencias. "Todas las provincias" carga todas las localidades.
 */
export default function CityLocationFilters({
  city,
  onCityChange,
  resetToken = 0,
}: CityLocationFiltersProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const allLocalidadesCache = useRef<UbicacionItem[] | null>(null);

  const [provincias, setProvincias] = useState<UbicacionItem[]>([]);
  const [localidades, setLocalidades] = useState<UbicacionItem[]>([]);
  const [provinciaId, setProvinciaId] = useState(ALL_PROVINCIAS);
  const [loadingProvincias, setLoadingProvincias] = useState(true);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [open, setOpen] = useState(false);

  const isAllProvincias = provinciaId === ALL_PROVINCIAS;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProvincias(true);
      try {
        const list = await fetchProvincias();
        if (!cancelled) setProvincias(list);
      } catch {
        if (!cancelled) setProvincias([]);
      } finally {
        if (!cancelled) setLoadingProvincias(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadingProvincias) return;
    if (isAllProvincias && provincias.length === 0) {
      setLocalidades([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingLocalidades(true);
      try {
        if (!isAllProvincias) {
          const list = await fetchLocalidades(provinciaId);
          if (!cancelled) setLocalidades(dedupeLocalidadesByName(list));
          return;
        }

        if (!allLocalidadesCache.current) {
          allLocalidadesCache.current = await fetchAllLocalidades(provincias);
        }
        if (!cancelled) setLocalidades(allLocalidadesCache.current);
      } catch {
        if (!cancelled) setLocalidades([]);
      } finally {
        if (!cancelled) setLoadingLocalidades(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provinciaId, provincias, loadingProvincias, isAllProvincias]);

  useEffect(() => {
    setProvinciaId(ALL_PROVINCIAS);
    setOpen(false);
  }, [resetToken]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const suggestions = useMemo(() => {
    const q = normalizeSearch(city);
    // Con todas las provincias: exigir texto para no listar cientos de golpe
    if (isAllProvincias && !q) return [];
    if (!q) return localidades.slice(0, 12);
    return localidades
      .filter((l) => normalizeSearch(l.nombre).includes(q))
      .slice(0, 12);
  }, [city, localidades, isAllProvincias]);

  const showList = open && !loadingLocalidades && suggestions.length > 0;

  return (
    <>
      <div>
        <label className={labelClass} htmlFor="search-provincia">
          Provincia
        </label>
        <div className={`${fieldClass} relative`}>
          <MapPin className="h-4 w-4 text-indigo-500 shrink-0" aria-hidden />
          <select
            id="search-provincia"
            value={provinciaId}
            onChange={(e) => {
              setProvinciaId(e.target.value);
              onCityChange('');
              setOpen(false);
            }}
            disabled={loadingProvincias}
            className="w-full appearance-none bg-transparent text-sm text-slate-800 focus:outline-none cursor-pointer pr-6 disabled:opacity-60"
          >
            <option value={ALL_PROVINCIAS}>
              {loadingProvincias ? 'Cargando...' : 'Todas las provincias'}
            </option>
            {provincias.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div ref={wrapRef} className="relative">
        <label className={labelClass} htmlFor="search-city">
          Ciudad
        </label>
        <div className={fieldClass}>
          <MapPin className="h-4 w-4 text-indigo-500 shrink-0" aria-hidden />
          <input
            id="search-city"
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder={
              isAllProvincias
                ? 'Escribí para buscar en todo el país...'
                : 'Escribí o elegí localidad...'
            }
            value={city}
            onChange={(e) => {
              onCityChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            disabled={loadingProvincias}
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
            autoComplete="off"
          />
          {loadingLocalidades && (
            <Loader2 className="h-4 w-4 text-indigo-500 shrink-0 animate-spin" aria-hidden />
          )}
        </div>

        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {suggestions.map((l) => (
              <li key={l.id} role="option">
                <button
                  type="button"
                  className="w-full px-3.5 py-2 text-left text-sm text-slate-800 hover:bg-indigo-50 hover:text-indigo-700"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onCityChange(l.nombre);
                    setOpen(false);
                  }}
                >
                  {l.nombre}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
