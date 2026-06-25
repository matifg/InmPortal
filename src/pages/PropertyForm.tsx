import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  UploadCloud, MapPin, Bed, Info, ArrowLeft, Eye, FileText, ImageIcon, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MembresiaBanner from '../components/MembresiaBanner';
import { useMembresia } from '../hooks/useMembresia';
import { fetchProvincias, fetchLocalidades, type UbicacionItem } from '../services/ubicaciones';
import { resolveCityToLocation } from '../lib/resolveLocation';
import PropertyFormPreview from '../components/PropertyFormPreview';
import PropertyFormProgress, { type ProgressStep } from '../components/PropertyFormProgress';
import PropertyFormSection from '../components/PropertyFormSection';
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
type SaveMode = 'BORRADOR' | 'PUBLICADA';

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
  const hydratingLocationRef = useRef(false);
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
    if (!initialData) return;

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

    if (isEdit) {
      setLocationHydrated(false);
      setProvinciaId('');
      setLocalidadId('');
      setLocalidades([]);
    }
  }, [initialData, isEdit]);

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
      if (cancelled) return;

      if (!resolved) {
        setLocationHydrated(true);
        return;
      }

      hydratingLocationRef.current = true;
      setProvinciaId(resolved.provinciaId);
      setLocalidades(resolved.localidades);
      setLocalidadId(resolved.localidadId);
      setFormData((prev) => ({ ...prev, city: resolved.cityName }));
      setLocationHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, initialData?.ciudad, initialData?.id, provincias, locationHydrated]);

  useEffect(() => {
    if (hydratingLocationRef.current) {
      hydratingLocationRef.current = false;
      return;
    }

    if (!provinciaId) {
      setLocalidades([]);
      setLocalidadId('');
      return;
    }

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
    // En edición, esperar a hidratar provincia/localidad antes de limpiar zona
    if (isEdit && !locationHydrated) return;
    if (!isBaraderoBsAs && formData.zona) {
      setFormData((prev) => ({ ...prev, zona: '' }));
    }
  }, [isBaraderoBsAs, formData.zona, isEdit, locationHydrated]);

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

  const validate = (mode: SaveMode): ValidationError | null => {
    if (mode === 'BORRADOR') return null;

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

  const handleSave = async (mode: SaveMode) => {
    if (loading) return;
    if (!membresiaActiva) return;
    setLoading(true);
    setErrorMsg('');

    const token = localStorage.getItem('token');

    const validationError = validate(mode);
    if (validationError) {
      setErrorMsg(validationError.message);
      setLoading(false);
      focusField(validationError.fieldId);
      return;
    }

    const hasNewImages = gridItems.some((i) => i.type === 'new');

    // Subir las imágenes nuevas a Supabase (mapeadas por key para respetar el orden de la grilla)
    const uploadedUrlByKey = new Map<string, string>();
    for (const item of gridItems) {
      if (item.type !== 'new') continue;
      const url = await uploadToSupabase(item.data.file);
      if (url) uploadedUrlByKey.set(item.data.key, url);
    }

    if (hasNewImages && uploadedUrlByKey.size === 0) {
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
        precio: formData.price ? parsePrice(formData.price) : 0,
        superficieM2: Number(formData.area) || 0,
        habitaciones: Number(formData.bedrooms) || 0,
        banios: Number(formData.bathrooms) || 0,
        tipoId: 1,
        estado: formData.status,
        operacion: formData.operation,
        moneda: formData.currency,
        zona: isBaraderoBsAs ? formData.zona || null : null,
        ocultarPrecio: formData.ocultarPrecio,
        publicacionEstado: mode,
      };

      const url = isEdit && initialData?.id
        ? `${import.meta.env.VITE_API_URL}/propiedades/${initialData.id}`
        : `${import.meta.env.VITE_API_URL}/propiedades`;

      const res = await fetch(url, {
        method: isEdit && initialData?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.message || data.mensaje || 'Error al guardar propiedad';
        setErrorMsg(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const propiedad = await res.json();
      const propiedadId = propiedad?.id ?? initialData?.id;
      let imageError = false;

      if (propiedadId) {
        const jsonHeaders = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const ordenFinal: { id: string; orden: number }[] = [];
        for (let i = 0; i < gridItems.length; i++) {
          const item = gridItems[i];
          const orden = i + 1;

          if (item.type === 'saved') {
            ordenFinal.push({ id: item.data.id, orden });
            continue;
          }

          const imageUrl = uploadedUrlByKey.get(item.data.key);
          if (!imageUrl) {
            imageError = true;
            continue;
          }
          try {
            const imgRes = await fetch(`${import.meta.env.VITE_API_URL}/imagenes`, {
              method: 'POST',
              headers: jsonHeaders,
              body: JSON.stringify({ url: imageUrl, propiedad: { id: propiedadId }, orden }),
            });
            if (!imgRes.ok) throw new Error('post imagen failed');
            const created = await imgRes.json();
            if (created?.id) ordenFinal.push({ id: String(created.id), orden });
          } catch {
            imageError = true;
          }
        }

        if (isEdit && ordenFinal.length > 0) {
          const ok = await persistImageOrder(propiedadId, ordenFinal, token);
          if (!ok) imageError = true;
        }
      }

      setIsDirty(false);
      if (imageError) {
        toast.error('Se guardó la propiedad, pero algunas imágenes no se actualizaron');
      } else if (mode === 'BORRADOR') {
        toast.success('Borrador guardado');
      } else {
        toast.success(isEdit ? 'Propiedad actualizada' : 'Propiedad publicada');
      }
      navigate('/dashboard');
    } catch {
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

  const totalImages = gridItems.length;
  const imagesMissing = totalImages === 0 && !!errorMsg;
  const isDraft = initialData?.publicacionEstado === 'BORRADOR';
  const publishLabel = isEdit && !isDraft ? 'Guardar cambios' : 'Publicar';

  const progressSteps = useMemo((): ProgressStep[] => [
    {
      id: 'info',
      label: 'Información',
      complete: !!(formData.title.trim() && formData.price && formData.description.trim()),
    },
    {
      id: 'location',
      label: 'Ubicación',
      complete: !!(provinciaId && formData.city.trim() && formData.address.trim() &&
        (!isBaraderoBsAs || formData.zona)),
    },
    {
      id: 'features',
      label: 'Características',
      complete: !!(formData.bedrooms || formData.bathrooms || formData.area),
    },
    {
      id: 'photos',
      label: 'Fotos',
      complete: totalImages > 0,
    },
    {
      id: 'publish',
      label: 'Publicar',
      complete: validate('PUBLICADA') === null,
    },
  ], [formData, provinciaId, isBaraderoBsAs, totalImages, gridItems.length, isEdit]);

  const previewProps = {
    title: formData.title,
    price: formData.price,
    ocultarPrecio: formData.ocultarPrecio,
    currency: formData.currency,
    city: formData.city,
    address: formData.address,
    provincia: provinciaNombre,
    status: formData.operation,
    coverUrl: coverPreviewUrl,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    area: formData.area,
  };

  const fieldInput = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
      hasError
        ? 'border-red-400 bg-red-50/30'
        : 'border-gray-200 bg-white focus:border-indigo-500 hover:border-gray-300'
    }`;

  function Tooltip({ text }: { text: string }) {
    return (
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gray-900/90 text-white text-xs px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-30 whitespace-nowrap">
        {text}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-3 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Volver al panel
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {isEdit ? 'Editar propiedad' : 'Nueva propiedad'}
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              {isEdit
                ? 'Actualizá los datos y publicá cuando estés listo.'
                : 'Completá el formulario y mirá la vista previa en tiempo real.'}
            </p>
          </div>
          {isEdit && initialData?.id && !isDraft && (
            <Link
              to={`/propiedad/${initialData.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors"
            >
              <Eye className="h-4 w-4" />
              Vista previa
            </Link>
          )}
        </div>

        <MembresiaBanner membresiaActiva={membresiaActiva} className="mb-5" />

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-5 border border-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Mobile preview */}
        <div className="lg:hidden mb-5">
          <PropertyFormPreview {...previewProps} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">
          <form id="property-form" className="space-y-4 min-w-0" onSubmit={(e) => e.preventDefault()}>

            <PropertyFormProgress steps={progressSteps} />

            {/* Información básica */}
            <PropertyFormSection
              id="info"
              title="Información básica"
              subtitle="Lo primero que verán los interesados"
              icon={FileText}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={fieldInput(!!errorMsg && !formData.title.trim())}
                    placeholder="Ej: Casa moderna con pileta y jardín"
                  />
                  {errorMsg && !formData.title.trim() && (
                    <span className="text-xs text-red-500 mt-1 block">El título es obligatorio</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`${fieldInput(!!errorMsg && !formData.description.trim())} h-24 resize-none`}
                    placeholder="Destacá lo mejor de la propiedad: ambientes, amenities, entorno..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1 relative group">
                      Precio <span className="text-red-500">*</span>
                      <Info className="h-3.5 w-3.5 text-gray-400" />
                      <Tooltip text="Solo números. Ej: 250000" />
                    </label>
                    <input
                      id="field-price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={fieldInput(!!errorMsg && !formData.price)}
                      placeholder="250.000"
                    />
                    {errorMsg && !formData.price && (
                      <span className="text-xs text-red-500 mt-1 block">El precio es obligatorio</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Moneda</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className={`${fieldInput(false)} min-w-[100px]`}
                    >
                      <option>USD</option>
                      <option>ARS</option>
                    </select>
                  </div>
                </div>
              </div>
            </PropertyFormSection>

            {/* Ubicación */}
            <PropertyFormSection
              id="location"
              title="Ubicación"
              subtitle="Provincia, localidad y dirección"
              icon={MapPin}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Provincia <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={provinciaId}
                    onChange={(e) => {
                      markDirty();
                      setProvinciaId(e.target.value);
                    }}
                    disabled={loadingProvincias}
                    className={fieldInput(false)}
                  >
                    <option value="">{loadingProvincias ? 'Cargando...' : 'Elegir provincia'}</option>
                    {provincias.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Localidad <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="field-localidad"
                    value={localidadId}
                    onChange={onLocalidadChange}
                    disabled={!provinciaId || loadingLocalidades}
                    className={fieldInput(!!errorMsg && !formData.city.trim())}
                  >
                    <option value="">
                      {loadingLocalidades ? 'Cargando...' : 'Elegir localidad'}
                    </option>
                    {localidades.map((l) => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                  {!provinciaId && (
                    <p className="text-xs text-gray-500 mt-1">Seleccioná primero la provincia</p>
                  )}
                  {errorMsg && !formData.city.trim() && provinciaId && (
                    <span className="text-xs text-red-500 mt-1 block">La localidad es obligatoria</span>
                  )}
                </div>
                {isBaraderoBsAs && (
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Zona <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="field-zona"
                      name="zona"
                      value={formData.zona}
                      onChange={handleChange}
                      className={fieldInput(!!errorMsg && !formData.zona)}
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
                <div className={`min-w-0 ${isBaraderoBsAs ? 'sm:col-span-2' : 'sm:col-span-2'}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Calle y número"
                    className={fieldInput(!!errorMsg && !formData.address.trim())}
                  />
                  {errorMsg && !formData.address.trim() && (
                    <span className="text-xs text-red-500 mt-1 block">La dirección es obligatoria</span>
                  )}
                </div>
              </div>
              {ubicacionError && (
                <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  {ubicacionError}
                </p>
              )}
            </PropertyFormSection>

            {/* Características */}
            <PropertyFormSection
              id="features"
              title="Características"
              subtitle="Ambientes y superficie"
              icon={Bed}
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Dormitorios</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    placeholder="3"
                    min={0}
                    className={fieldInput(false)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Baños</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    placeholder="2"
                    min={0}
                    className={fieldInput(false)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">m²</label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="120"
                    min={0}
                    className={fieldInput(false)}
                  />
                </div>
              </div>
            </PropertyFormSection>

            {/* Comercialización */}
            <PropertyFormSection
              id="commercial"
              title="Comercialización"
              subtitle="Tipo de operación y visibilidad del precio"
              icon={Tag}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1 relative group">
                    Estado
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                    <Tooltip text="¿En venta o alquiler actualmente?" />
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={fieldInput(false)}
                  >
                    <option>Venta</option>
                    <option>Alquiler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1 relative group">
                    Operación
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                    <Tooltip text="Tipo de publicación" />
                  </label>
                  <select
                    name="operation"
                    value={formData.operation}
                    onChange={handleChange}
                    className={fieldInput(false)}
                  >
                    <option>Venta</option>
                    <option>Alquiler</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 mt-4 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100/80 transition-colors">
                <input
                  type="checkbox"
                  name="ocultarPrecio"
                  checked={formData.ocultarPrecio}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">Ocultar precio al público</span>
                  <p className="text-xs text-gray-500">Los visitantes verán "Consultar precio"</p>
                </div>
              </label>
            </PropertyFormSection>

            {/* Multimedia */}
            <PropertyFormSection
              id="photos"
              title="Fotos"
              subtitle="La primera imagen será la portada del anuncio"
              icon={ImageIcon}
            >
              <div
                id="field-images"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverZone(true);
                }}
                onDragLeave={() => setDragOverZone(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full min-h-[11rem] border-2 border-dashed rounded-2xl cursor-pointer transition mb-4 ${
                  dragOverZone
                    ? 'border-indigo-500 bg-indigo-50'
                    : imagesMissing
                      ? 'border-red-300 bg-red-50/40'
                      : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-3">
                  <UploadCloud className="h-6 w-6 text-indigo-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Arrastrá tus fotos acá
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  o hacé click para elegir · JPG, PNG · múltiples archivos
                </p>
                {totalImages > 0 && (
                  <p className="text-xs font-medium text-indigo-600 mt-2 bg-indigo-50 px-3 py-1 rounded-full">
                    {totalImages} foto{totalImages !== 1 ? 's' : ''} cargada{totalImages !== 1 ? 's' : ''}
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {imagesMissing && (
                <p className="text-xs text-red-500 mb-3">Subí al menos una imagen para publicar</p>
              )}
              {totalImages > 0 && (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Arrastrá para reordenar · la primera es la portada
                  </p>
                  <FormImageGrid
                    items={gridItems}
                    deletingId={deletingImageId}
                    onReorder={reorderImages}
                    onRemove={removeImageAt}
                    onSetPortada={setAsPortada}
                  />
                </>
              )}
            </PropertyFormSection>
          </form>

          {/* Desktop sticky preview */}
          <aside className="hidden lg:block sticky top-20">
            <PropertyFormPreview {...previewProps} />
          </aside>
        </div>
      </div>

      {/* Footer sticky */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors shrink-0"
          >
            Cancelar
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {isDirty && (
              <span className="hidden md:inline text-xs text-amber-600 font-medium whitespace-nowrap">
                Cambios sin guardar
              </span>
            )}
            <button
              type="button"
              disabled={loading || !membresiaActiva}
              onClick={() => handleSave('BORRADOR')}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition ${
                !membresiaActiva ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Guardando...' : 'Guardar borrador'}
            </button>
            <button
              type="button"
              disabled={loading || !membresiaActiva}
              onClick={() => handleSave('PUBLICADA')}
              className={`px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition ${
                !membresiaActiva ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {membresiaActiva
                ? loading
                  ? 'Guardando...'
                  : publishLabel
                : 'Sin membresía'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}