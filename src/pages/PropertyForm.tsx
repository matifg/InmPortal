import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UploadCloud, Home, MapPin, DollarSign, Bed, Info, ArrowLeft, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import MembresiaBanner from '../components/MembresiaBanner';
import { useMembresia } from '../hooks/useMembresia';
import { fetchProvincias, fetchLocalidades, type UbicacionItem } from '../services/ubicaciones';
import { resolveCityToLocation } from '../lib/resolveLocation';
import PropertyFormPreview from '../components/PropertyFormPreview';
import FormImageGrid, { type ImageGridItem } from '../components/FormImageGrid';

type SavedImage = { id: string; url: string; orden?: number };

function normalizeImageUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = import.meta.env.VITE_API_URL;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

function normLocationName(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

type ValidationError = { message: string; fieldId: string };

function focusField(fieldId: string) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (el instanceof HTMLElement && typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}

function parseSavedImages(imagenes: unknown): SavedImage[] {
  if (!Array.isArray(imagenes)) return [];
  return [...imagenes]
    .sort((a: { orden?: number }, b: { orden?: number }) => (a.orden ?? 0) - (b.orden ?? 0))
    .filter((img: { id?: string; url?: string }) => img?.id && img?.url)
    .map((img: { id: string; url: string; orden?: number }) => ({
      id: String(img.id),
      url: normalizeImageUrl(img.url),
      orden: img.orden,
    }));
}

export default function PropertyForm({ initialData, isEdit = false }: any) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gridItems, setGridItems] = useState<ImageGridItem[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const newImageKeyRef = useRef(0);

  const { membresiaActiva } = useMembresia();

  const [provincias, setProvincias] = useState<UbicacionItem[]>([]);
  const [localidades, setLocalidades] = useState<UbicacionItem[]>([]);
  const [provinciaId, setProvinciaId] = useState('');
  const [localidadId, setLocalidadId] = useState('');
  const [loadingProvincias, setLoadingProvincias] = useState(true);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [ubicacionError, setUbicacionError] = useState('');
  const [locationHydrated, setLocationHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const skipCityResetRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOverZone, setDragOverZone] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    address: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    status: 'Venta',
    currency: 'USD',
    operation: 'Venta',
    zona: '',
    ocultarPrecio: false,
  });

  useEffect(() => {
    if (initialData) {
      const rawPrice = initialData.precio?.toString() || '';
      const digits = rawPrice.replace(/\D/g, '');
      setFormData({
        title: initialData.titulo || '',
        description: initialData.descripcion || '',
        price: digits ? new Intl.NumberFormat('es-AR').format(Number(digits)) : '',
        city: initialData.ciudad || '',
        address: initialData.direccion || '',
        bedrooms: initialData.habitaciones?.toString() || '',
        bathrooms: initialData.banios?.toString() || '',
        area: initialData.superficieM2?.toString() || '',
        status: initialData.estado || 'Venta',
        currency: initialData.moneda || 'USD',
        operation: initialData.operacion || 'Venta',
        zona: initialData.zona || '',
        ocultarPrecio: initialData.ocultarPrecio ?? false,
      });
      setGridItems(
        parseSavedImages(initialData.imagenes).map((data) => ({ type: 'saved' as const, data }))
      );
    }
  }, [initialData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProvincias(true);
      setUbicacionError('');
      try {
        const list = await fetchProvincias();
        if (cancelled) return;
        setProvincias(list);
        if (list.length === 0) setUbicacionError('No hay provincias disponibles.');
      } catch {
        if (!cancelled) setUbicacionError('No se pudieron cargar las provincias.');
      } finally {
        if (!cancelled) setLoadingProvincias(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isEdit || !initialData?.ciudad || provincias.length === 0 || locationHydrated) return;
    let cancelled = false;
    (async () => {
      const resolved = await resolveCityToLocation(initialData.ciudad, provincias);
      if (cancelled || !resolved) {
        setLocationHydrated(true);
        return;
      }
      skipCityResetRef.current = true;
      setProvinciaId(resolved.provinciaId);
      setLocalidades(resolved.localidades);
      setLocalidadId(resolved.localidadId);
      setFormData((prev) => ({ ...prev, city: resolved.cityName }));
      setLocationHydrated(true);
      setTimeout(() => {
        skipCityResetRef.current = false;
      }, 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, initialData, provincias, locationHydrated]);

  useEffect(() => {
    if (!provinciaId) {
      setLocalidades([]);
      if (!skipCityResetRef.current) setLocalidadId('');
      return;
    }
    if (skipCityResetRef.current) return;

    let cancelled = false;
    (async () => {
      setLoadingLocalidades(true);
      setUbicacionError('');
      setLocalidadId('');
      setFormData((prev) => ({ ...prev, city: '' }));
      try {
        const list = await fetchLocalidades(provinciaId);
        if (cancelled) return;
        setLocalidades(list);
        if (list.length === 0) setUbicacionError('No hay localidades para esta provincia.');
      } catch {
        if (!cancelled) setUbicacionError('No se pudieron cargar las localidades.');
      } finally {
        if (!cancelled) setLoadingLocalidades(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [provinciaId]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const provinciaNombre = provincias.find((p) => p.id === provinciaId)?.nombre ?? '';
  const localidadNombre =
    localidades.find((l) => l.id === localidadId)?.nombre ?? formData.city;

  const isBaraderoBsAs = useMemo(
    () =>
      normLocationName(provinciaNombre) === 'buenos aires' &&
      normLocationName(localidadNombre) === 'baradero',
    [provinciaNombre, localidadNombre]
  );

  useEffect(() => {
    if (!isBaraderoBsAs && formData.zona) {
      setFormData((prev) => ({ ...prev, zona: '' }));
    }
  }, [isBaraderoBsAs, formData.zona]);

  const onLocalidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    markDirty();
    const id = e.target.value;
    setLocalidadId(id);
    const loc = localidades.find((l) => l.id === id);
    const city = loc?.nombre ?? '';
    const prov = provincias.find((p) => p.id === provinciaId)?.nombre ?? '';
    const isBaradero =
      normLocationName(prov) === 'buenos aires' && normLocationName(city) === 'baradero';
    setFormData((prev) => ({
      ...prev,
      city,
      zona: isBaradero ? prev.zona : '',
    }));
  };

  const formatPrice = (value: string) => {
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('es-AR').format(Number(number));
  };

  const parsePrice = (value: string) => {
    return Number(value.replace(/\./g, ''));
  };

  const markDirty = () => setIsDirty(true);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    markDirty();

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (name === 'price') {
      setFormData((prev) => ({
        ...prev,
        price: formatPrice(value),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): ValidationError | null => {
    if (!formData.title.trim()) {
      return { message: 'El título es obligatorio', fieldId: 'field-title' };
    }
    if (!formData.price) {
      return { message: 'El precio es obligatorio', fieldId: 'field-price' };
    }
    if (!formData.city.trim()) {
      return { message: 'La localidad es obligatoria', fieldId: 'field-localidad' };
    }
    if (!formData.address.trim()) {
      return { message: 'La dirección es obligatoria', fieldId: 'field-address' };
    }
    if (isBaraderoBsAs && !formData.zona) {
      return { message: 'La zona es obligatoria', fieldId: 'field-zona' };
    }
    if (gridItems.length === 0) {
      return {
        message: isEdit
          ? 'La propiedad debe tener al menos una imagen'
          : 'Subí al menos una imagen de la propiedad',
        fieldId: 'field-images',
      };
    }
    return null;
  };

  // 3. Función para subir imagen a Supabase y obtener URL pública
  const uploadToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('propiedades')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase
        .storage
        .from('propiedades')
        .getPublicUrl(fileName);

      return publicUrlData?.publicUrl || null;
    } catch (err) {
      console.error('Error subiendo imagen a Supabase:', err);
      return null;
    }
  };

  // Persiste el orden de todas las imágenes: intenta el endpoint bulk y,
  // si no está disponible, cae a un PUT por imagen.
  const persistImageOrder = async (
    propiedadId: string,
    orden: { id: string; orden: number }[],
    token: string | null
  ): Promise<boolean> => {
    const jsonHeaders = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/imagenes/propiedad/${propiedadId}/orden`,
        { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(orden) }
      );
      if (res.ok) return true;
      if (res.status !== 404 && res.status !== 405) return false;
    } catch {
      // bulk no disponible, probar por imagen
    }

    const results = await Promise.all(
      orden.map((o) =>
        fetch(`${import.meta.env.VITE_API_URL}/imagenes/${o.id}`, {
          method: 'PUT',
          headers: jsonHeaders,
          body: JSON.stringify({ orden: o.orden }),
        })
          .then((r) => r.ok)
          .catch(() => false)
      )
    );
    return results.every(Boolean);
  };

  const removeNewImage = (key: string) => {
    setGridItems((items) =>
      items.filter((i) => {
        if (i.type === 'new' && i.data.key === key) {
          URL.revokeObjectURL(i.data.preview);
          return false;
        }
        return true;
      })
    );
  };

  const removeSavedImage = async (imageId: string) => {
    const token = localStorage.getItem('token');
    setDeletingImageId(imageId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/imagenes/${imageId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('delete failed');
      setGridItems((prev) => prev.filter((i) => !(i.type === 'saved' && i.data.id === imageId)));
      markDirty();
    } catch {
      setErrorMsg('No se pudo eliminar la imagen');
      toast.error('No se pudo eliminar la imagen');
    } finally {
      setDeletingImageId(null);
    }
  };

  const gridItemsRef = useRef(gridItems);
  gridItemsRef.current = gridItems;
  useEffect(() => {
    return () => {
      gridItemsRef.current.forEach((i) => {
        if (i.type === 'new') URL.revokeObjectURL(i.data.preview);
      });
    };
  }, []);

  const coverPreviewUrl = useMemo(() => {
    const first = gridItems[0];
    if (!first) return null;
    return first.type === 'saved' ? first.data.url : first.data.preview;
  }, [gridItems]);

  const reorderImages = (from: number, to: number) => {
    if (from === to) return;
    markDirty();
    setGridItems((prev) => {
      const items = [...prev];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return items;
    });
  };

  const setAsPortada = (globalIdx: number) => {
    reorderImages(globalIdx, 0);
  };

  const removeImageAt = (globalIdx: number) => {
    markDirty();
    const item = gridItems[globalIdx];
    if (!item) return;
    if (item.type === 'saved') {
      removeSavedImage(item.data.id);
    } else {
      removeNewImage(item.data.key);
    }
  };

  const addFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    markDirty();
    setGridItems((prev) => [
      ...prev,
      ...images.map((file) => ({
        type: 'new' as const,
        data: {
          file,
          preview: URL.createObjectURL(file),
          key: `new-${newImageKeyRef.current++}`,
        },
      })),
    ]);
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (loading) return;
    if (!membresiaActiva) return;
    setLoading(true);
    setErrorMsg('');

    const token = localStorage.getItem('token');

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError.message);
      setLoading(false);
      focusField(validationError.fieldId);
      return;
    }

    // Subir las imágenes nuevas a Supabase (mapeadas por key para respetar el orden de la grilla)
    const uploadedUrlByKey = new Map<string, string>();
    for (const item of gridItems) {
      if (item.type !== 'new') continue;
      const url = await uploadToSupabase(item.data.file);
      if (url) uploadedUrlByKey.set(item.data.key, url);
    }

    if (!isEdit && uploadedUrlByKey.size === 0) {
      setErrorMsg('No se pudieron subir las imágenes. Intentá de nuevo.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        titulo: formData.title,
        descripcion: formData.description,
        direccion: formData.address,
        ciudad: formData.city,
        precio: parsePrice(formData.price),
        superficieM2: Number(formData.area) || 0,
        habitaciones: Number(formData.bedrooms) || 0,
        banios: Number(formData.bathrooms) || 0,
        tipoId: 1,
        estado: formData.status,
        operacion: formData.operation,
        moneda: formData.currency,
        zona: isBaraderoBsAs ? formData.zona || null : null,
        ocultarPrecio: formData.ocultarPrecio,
      };

      let propiedad;
      if (isEdit && initialData?.id) {
        propiedad = await fetch(`${import.meta.env.VITE_API_URL}/propiedades/${initialData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }).then(r => r.json());
      } else {
        propiedad = await fetch(`${import.meta.env.VITE_API_URL}/propiedades`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }).then(r => r.json());
      }

      const propiedadId = propiedad?.id ?? initialData?.id;
      let imageError = false;

      if (propiedadId) {
        const jsonHeaders = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // Crear las imágenes nuevas con su orden según la posición en la grilla
        // y armar el orden final de TODAS las imágenes (guardadas + nuevas)
        const ordenFinal: { id: string; orden: number }[] = [];
        for (let i = 0; i < gridItems.length; i++) {
          const item = gridItems[i];
          const orden = i + 1;

          if (item.type === 'saved') {
            ordenFinal.push({ id: item.data.id, orden });
            continue;
          }

          const url = uploadedUrlByKey.get(item.data.key);
          if (!url) {
            imageError = true;
            continue;
          }
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/imagenes`, {
              method: 'POST',
              headers: jsonHeaders,
              body: JSON.stringify({ url, propiedad: { id: propiedadId }, orden }),
            });
            if (!res.ok) throw new Error('post imagen failed');
            const created = await res.json();
            if (created?.id) ordenFinal.push({ id: String(created.id), orden });
          } catch {
            imageError = true;
          }
        }

        // Persistir el orden final (solo necesario en edición; en alta el POST ya lleva el orden)
        if (isEdit && ordenFinal.length > 0) {
          const ok = await persistImageOrder(propiedadId, ordenFinal, token);
          if (!ok) imageError = true;
        }
      }

      setIsDirty(false);
      if (imageError) {
        toast.error('Se guardó la propiedad, pero algunas imágenes no se actualizaron');
      } else {
        toast.success(isEdit ? 'Propiedad actualizada' : 'Propiedad publicada');
      }
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg('Error al guardar propiedad');
      toast.error('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(false);
    if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
  };

  const imagesRequired = !isEdit;
  const totalImages = gridItems.length;
  const imagesMissing = imagesRequired && totalImages === 0;

  function Tooltip({ text }: { text: string }) {
    return (
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gray-900/90 text-white text-xs px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-30 whitespace-nowrap">
        {text}
      </span>
    );
  }

  const sectionCard =
    'bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm';

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver al panel
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Home className="h-7 w-7 text-indigo-600 shrink-0" />
              {isEdit ? 'Editar propiedad' : 'Nueva propiedad'}
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              {isEdit
                ? 'Actualizá los datos y las fotos de tu publicación.'
                : 'Completá los datos para publicar en minutos.'}
            </p>
          </div>
          {isEdit && initialData?.id && (
            <Link
              to={`/propiedad/${initialData.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-indigo-600 hover:bg-indigo-50 shadow-sm"
            >
              <Eye className="h-4 w-4" />
              Vista previa
            </Link>
          )}
        </div>

        <MembresiaBanner membresiaActiva={membresiaActiva} className="mb-6" />

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
        <form id="property-form" onSubmit={handleSubmit} className="space-y-6 min-w-0">

            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-slate-900 mb-5">Datos principales</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-5 py-3 rounded-lg border ${errorMsg && !formData.title.trim() ? 'border-red-500' : 'border-slate-200'} bg-white focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-400`}
                    placeholder="Ej: Casa moderna con pileta"
                  />
                  {errorMsg && !formData.title.trim() && (
                    <span className="text-xs text-red-500 mt-1 block">El título es obligatorio</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1 relative group">
                    Precio <span className="text-red-500">*</span>
                    {/* Tooltip para precio */}
                    <span className="relative group">
                      <Info className="h-4 w-4 text-slate-400 cursor-pointer" />
                      <Tooltip text="Ingresá solo números, sin puntos ni comas. Ej: 250000" />
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="field-price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={`w-full px-5 py-3 rounded-lg border ${errorMsg && !formData.price ? 'border-red-500' : 'border-slate-200'} bg-white focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-400`}
                      placeholder="Ej: 250000"
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition w-24"
                    >
                      <option>USD</option>
                      <option>ARS</option>
                    </select>
                  </div>
                  {errorMsg && !formData.price && (
                    <span className="text-xs text-red-500 mt-1 block">El precio es obligatorio</span>
                  )}
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ocultarPrecio"
                      checked={formData.ocultarPrecio}
                      onChange={handleChange}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600">Ocultar precio para el público</span>
                  </label>
                </div>
              </div>
              <div className="mt-8">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-5 py-3 rounded-lg border ${errorMsg && !formData.description.trim() ? 'border-red-500' : 'border-slate-200'} bg-white focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-400 h-28`}
                  placeholder="Contá los detalles más importantes de la propiedad"
                />
                {errorMsg && !formData.description.trim() && (
                  <span className="text-xs text-red-500 mt-1 block">La descripción es obligatoria</span>
                )}
              </div>
            </section>

            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-indigo-500" />
                Ubicación
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Provincia <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={provinciaId}
                    onChange={(e) => {
                      markDirty();
                      setProvinciaId(e.target.value);
                    }}
                    disabled={loadingProvincias}
                    className="w-full min-w-0 px-4 py-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  >
                    <option value="">{loadingProvincias ? 'Cargando...' : 'Elegir provincia'}</option>
                    {provincias.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Localidad <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="field-localidad"
                    value={localidadId}
                    onChange={onLocalidadChange}
                    disabled={!provinciaId || loadingLocalidades}
                    className={`w-full min-w-0 px-4 py-3 rounded-lg border text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition disabled:bg-slate-50 disabled:text-slate-400 ${
                      errorMsg && !formData.city.trim()
                        ? 'border-red-500'
                        : 'border-slate-200 bg-white focus:border-indigo-500'
                    }`}
                  >
                    <option value="">
                      {loadingLocalidades ? 'Cargando...' : 'Elegir localidad'}
                    </option>
                    {localidades.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                  {!provinciaId && (
                    <p className="text-xs text-slate-500 mt-1">Seleccioná primero la provincia</p>
                  )}
                  {errorMsg && !formData.city.trim() && provinciaId && (
                    <span className="text-xs text-red-500 mt-1 block">La localidad es obligatoria</span>
                  )}
                </div>
                {isBaraderoBsAs && (
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Zona <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="field-zona"
                      name="zona"
                      value={formData.zona}
                      onChange={handleChange}
                      className={`w-full min-w-0 px-4 py-3 rounded-lg border text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition ${
                        errorMsg && !formData.zona
                          ? 'border-red-500'
                          : 'border-slate-200 bg-white focus:border-indigo-500'
                      }`}
                    >
                      <option value="">Elegir zona</option>
                      <option value="Colonia Suiza">Colonia Suiza</option>
                      <option value="Centro">Centro</option>
                      <option value="Estacion">Estacion</option>
                      <option value="Costa">Costa</option>
                    </select>
                    {errorMsg && !formData.zona && (
                      <span className="text-xs text-red-500 mt-1 block">La zona es obligatoria</span>
                    )}
                  </div>
                )}
                <div className="min-w-0 sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Calle y número"
                    className={`w-full px-4 py-3 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-400 ${
                      errorMsg && !formData.address.trim()
                        ? 'border-red-500'
                        : 'border-slate-200 bg-white focus:border-indigo-500'
                    }`}
                  />
                  {errorMsg && !formData.address.trim() && (
                    <span className="text-xs text-red-500 mt-1 block">La dirección es obligatoria</span>
                  )}
                </div>
              </div>
              {ubicacionError && (
                <p className="mt-4 text-sm text-amber-700">{ubicacionError}</p>
              )}
            </section>

            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Bed className="h-5 w-5 text-indigo-500" />
                Detalles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    placeholder="Ej: 3"
                    className="w-full px-5 py-3 rounded-lg border border-slate-200 bg-white focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Baños
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    placeholder="Ej: 2"
                    className="w-full px-5 py-3 rounded-lg border border-slate-200 bg-white focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Superficie m²
                  </label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Ej: 120"
                    className="w-full px-5 py-3 rounded-lg border border-slate-200 bg-white focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-400"
                  />
                </div>
              </div>
            </section>

            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-500" />
                Tipo de operación
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1 relative group">
                    Estado
                    <Info className="h-4 w-4 text-slate-400 cursor-pointer" />
                    <Tooltip text="¿La propiedad está en venta o alquiler actualmente?" />
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-lg border border-slate-200 bg-white focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  >
                    <option>Venta</option>
                    <option>Alquiler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1 relative group">
                    Operación
                    <Info className="h-4 w-4 text-slate-400 cursor-pointer" />
                    <Tooltip text="Seleccioná si la publicación es para venta o alquiler." />
                  </label>
                  <select
                    name="operation"
                    value={formData.operation}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-lg border border-slate-200 bg-white focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  >
                    <option>Venta</option>
                    <option>Alquiler</option>
                  </select>
                </div>
              </div>
            </section>

            <section id="field-images" className={sectionCard}>
              <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-indigo-500" />
                Imágenes {imagesRequired && <span className="text-red-500">*</span>}
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                {totalImages > 0
                  ? `${totalImages} foto${totalImages !== 1 ? 's' : ''} · arrastrá para reordenar · la primera es la portada`
                  : 'La primera imagen será la portada del listado'}
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverZone(true);
                }}
                onDragLeave={() => setDragOverZone(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition mb-5 ${
                  dragOverZone
                    ? 'border-indigo-500 bg-indigo-50/80'
                    : imagesMissing && errorMsg
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <UploadCloud className="h-9 w-9 text-indigo-400 mb-2" />
                <span className="text-indigo-700 font-medium text-sm">Arrastrá o hacé click para subir</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {imagesMissing && errorMsg && (
                <p className="text-xs text-red-500 mb-4 -mt-3">Subí al menos una imagen</p>
              )}
              {totalImages > 0 && (
                <FormImageGrid
                  items={gridItems}
                  deletingId={deletingImageId}
                  onReorder={reorderImages}
                  onRemove={removeImageAt}
                  onSetPortada={setAsPortada}
                />
              )}
            </section>
        </form>

        <aside className="hidden lg:block sticky top-24">
          <PropertyFormPreview
            title={formData.title}
            price={formData.price}
            ocultarPrecio={formData.ocultarPrecio}
            currency={formData.currency}
            city={formData.city}
            address={formData.address}
            status={formData.operation}
            coverUrl={coverPreviewUrl}
            bedrooms={formData.bedrooms}
            bathrooms={formData.bathrooms}
            area={formData.area}
          />
        </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            Cancelar
          </Link>
          {isDirty && (
            <span className="hidden sm:inline text-xs text-amber-600 font-medium">Cambios sin guardar</span>
          )}
          <button
            type="submit"
            form="property-form"
            disabled={loading || !membresiaActiva}
            className={`px-6 sm:px-8 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition ${
              !membresiaActiva ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {membresiaActiva
              ? loading
                ? 'Guardando...'
                : isEdit
                  ? 'Guardar cambios'
                  : 'Publicar'
              : 'Sin membresía'}
          </button>
        </div>
      </div>
    </div>
  );
}