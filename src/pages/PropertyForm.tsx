import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { UploadCloud, Home, MapPin, DollarSign, Bed, Bath, Ruler, Info, X as XIcon } from 'lucide-react';

export default function PropertyForm({ initialData, isEdit = false }: any) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // 3. Estado membresía
  const [membresiaActiva, setMembresiaActiva] = useState(true);

  // 2. Agregar zona al estado
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
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.titulo || '',
        description: initialData.descripcion || '',
        price: initialData.precio?.toString() || '',
        city: initialData.ciudad || '',
        address: initialData.direccion || '',
        bedrooms: initialData.habitaciones?.toString() || '',
        bathrooms: initialData.banios?.toString() || '',
        area: initialData.superficieM2?.toString() || '',
        status: initialData.estado || 'Venta',
        currency: initialData.moneda || 'USD',
        operation: initialData.operacion || 'Venta',
        zona: initialData.zona || '',
      });
    }
    // 3. Leer membresía activa
    const mem = localStorage.getItem('membresiaActiva');
    if (mem) {
      try {
        setMembresiaActiva(JSON.parse(mem) === true);
      } catch {
        setMembresiaActiva(true);
      }
    }
  }, [initialData]);

  const formatPrice = (value: string) => {
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('es-AR').format(Number(number));
  };

  const parsePrice = (value: string) => {
    return Number(value.replace(/\./g, ''));
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    if (name === 'price') {
      setFormData(prev => ({
        ...prev,
        price: formatPrice(value),
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.title.trim()) return 'El título es obligatorio';
    if (!formData.price) return 'El precio es obligatorio';
    if (!formData.city.trim()) return 'La ciudad es obligatoria';
    if (!formData.address.trim()) return 'La dirección es obligatoria';
    if (!formData.zona) return 'La zona es obligatoria';
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

  // 2. Eliminar imagen de la previsualización
  const removeImage = (idx: number) => {
    setImageFiles(files => files.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg('');

    const token = localStorage.getItem('token');

    const error = validate();
    if (error) {
      setErrorMsg(error);
      setLoading(false);
      return;
    }

    // Subir imágenes
    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        try {
          const url = await uploadToSupabase(file);
          if (url) imageUrls.push(url);
        } catch (err) {
          console.error('[PropertyForm] Error subiendo una imagen:', err);
        }
      }
    }

    try {
      // 1. Eliminar agenteId del payload
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
        zona: formData.zona,
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

      // Vincular imágenes en backend si existen
      if (imageUrls.length > 0 && propiedad?.id) {
        for (let i = 0; i < imageUrls.length; i++) {
          try {
            await fetch(`${import.meta.env.VITE_API_URL}/imagenes`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                url: imageUrls[i],
                propiedad: { id: propiedad.id },
                orden: i + 1,
              }),
            });
          } catch (err) {
            // Continúa con las demás imágenes
          }
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setErrorMsg('Error al guardar propiedad');
    } finally {
      setLoading(false);
    }
  };

  const input =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition";

  const label = "text-sm font-medium text-gray-600 mb-1";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  function Tooltip({ text }: { text: string }) {
    return (
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gray-900/90 text-white text-xs px-3 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-30 whitespace-nowrap">
        {text}
      </span>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/bg-saas.jpg')" }}
    >
      {/* overlay oscuro */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full px-4">
        <div className="bg-white/90 p-12 rounded-3xl shadow-2xl max-w-6xl mx-auto">

          {/* Título principal */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Home className="h-8 w-8 text-indigo-600" />
            {isEdit ? 'Editar Propiedad' : 'Nueva Propiedad'}
          </h1>
          <p className="text-gray-500 mb-10 text-lg">Completá los datos para publicar tu propiedad en minutos.</p>

          {errorMsg && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-6 text-center border border-red-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-16">

            {/* DATOS PRINCIPALES */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-wide">Datos principales</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-5 py-3 rounded-lg border ${errorMsg && !formData.title.trim() ? 'border-red-500' : 'border-gray-200'} bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition placeholder-gray-400`}
                    placeholder="Ej: Casa moderna con pileta"
                  />
                  {errorMsg && !formData.title.trim() && (
                    <span className="text-xs text-red-500 mt-1 block">El título es obligatorio</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 relative group">
                    Precio <span className="text-red-500">*</span>
                    {/* Tooltip para precio */}
                    <span className="relative group">
                      <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                      <Tooltip text="Ingresá solo números, sin puntos ni comas. Ej: 250000" />
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={`w-full px-5 py-3 rounded-lg border ${errorMsg && !formData.price ? 'border-red-500' : 'border-gray-200'} bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition placeholder-gray-400`}
                      placeholder="Ej: 250000"
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition w-24"
                    >
                      <option>USD</option>
                      <option>ARS</option>
                    </select>
                  </div>
                  {errorMsg && !formData.price && (
                    <span className="text-xs text-red-500 mt-1 block">El precio es obligatorio</span>
                  )}
                </div>
              </div>
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-5 py-3 rounded-lg border ${errorMsg && !formData.description.trim() ? 'border-red-500' : 'border-gray-200'} bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition placeholder-gray-400 h-28`}
                  placeholder="Contá los detalles más importantes de la propiedad"
                />
                {errorMsg && !formData.description.trim() && (
                  <span className="text-xs text-red-500 mt-1 block">La descripción es obligatoria</span>
                )}
              </div>
            </section>

            {/* UBICACIÓN */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="h-6 w-6 text-indigo-500" />
                <h2 className="text-2xl font-semibold text-gray-900 tracking-wide">Ubicación</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Ej: Buenos Aires"
                    className={`w-full px-5 py-3 rounded-lg border ${errorMsg && !formData.city.trim() ? 'border-red-500' : 'border-gray-200'} bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition placeholder-gray-400`}
                  />
                  {errorMsg && !formData.city.trim() && (
                    <span className="text-xs text-red-500 mt-1 block">La ciudad es obligatoria</span>
                  )}
                </div>
                {/* ZONA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="zona"
                    value={formData.zona}
                    onChange={handleChange}
                    className={`w-full px-5 py-3 rounded-lg border ${errorMsg && !formData.zona ? 'border-red-500' : 'border-gray-200'} bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition`}
                  >
                    <option value="">Seleccionar zona</option>
                    <option value="Colonia Suiza">Colonia Suiza</option>
                    <option value="Centro">Centro</option>
                    <option value="Estacion">Estacion</option>
                    <option value="Costa">Costa</option>
                  </select>
                  {errorMsg && !formData.zona && (
                    <span className="text-xs text-red-500 mt-1 block">La zona es obligatoria</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Ej: Av. Siempre Viva 123"
                    className={`w-full px-5 py-3 rounded-lg border ${errorMsg && !formData.address.trim() ? 'border-red-500' : 'border-gray-200'} bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition placeholder-gray-400`}
                  />
                  {errorMsg && !formData.address.trim() && (
                    <span className="text-xs text-red-500 mt-1 block">La dirección es obligatoria</span>
                  )}
                </div>
              </div>
            </section>

            {/* DETALLES */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Bed className="h-6 w-6 text-indigo-500" />
                <h2 className="text-2xl font-semibold text-gray-900 tracking-wide">Detalles</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    placeholder="Ej: 3"
                    className="w-full px-5 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Baños
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    placeholder="Ej: 2"
                    className="w-full px-5 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Superficie m²
                  </label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Ej: 120"
                    className="w-full px-5 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition placeholder-gray-400"
                  />
                </div>
              </div>
            </section>

            {/* TIPO DE OPERACIÓN */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="h-6 w-6 text-indigo-500" />
                <h2 className="text-2xl font-semibold text-gray-900 tracking-wide">Tipo de operación</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 relative group">
                    Estado
                    <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                    <Tooltip text="¿La propiedad está en venta o alquiler actualmente?" />
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  >
                    <option>Venta</option>
                    <option>Alquiler</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1 relative group">
                    Operación
                    <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                    <Tooltip text="Seleccioná si la publicación es para venta o alquiler." />
                  </label>
                  <select
                    name="operation"
                    value={formData.operation}
                    onChange={handleChange}
                    className="w-full px-5 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                  >
                    <option>Venta</option>
                    <option>Alquiler</option>
                  </select>
                </div>
              </div>
            </section>

            {/* IMÁGENES */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <UploadCloud className="h-6 w-6 text-indigo-500" />
                <h2 className="text-2xl font-semibold text-gray-900 tracking-wide">Imágenes</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition group"
                >
                  <UploadCloud className="h-10 w-10 text-indigo-400 mb-2 group-hover:scale-110 transition" />
                  <span className="text-indigo-700 font-medium">Arrastrá imágenes o hacé click</span>
                  <span className="text-xs text-gray-400 mt-1">Podés subir varias imágenes</span>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {imageFiles.length > 0 && (
                  <div className="flex gap-4 flex-wrap items-start">
                    {imageFiles.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`preview-${idx}`}
                          className="w-24 h-24 rounded-lg object-cover border-2 border-indigo-200 shadow-md group-hover:scale-105 transition"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-700 transition z-10"
                          title="Eliminar imagen"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* BOTÓN PRINCIPAL */}
            <div className="pt-8">
              <button
                disabled={loading || !membresiaActiva}
                className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-200 text-white py-5 rounded-2xl font-semibold text-xl tracking-wide ${!membresiaActiva ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {membresiaActiva
                  ? loading
                    ? 'Guardando...'
                    : 'Publicar propiedad'
                  : 'Activá tu membresía para publicar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}