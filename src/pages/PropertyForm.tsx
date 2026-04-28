import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function PropertyForm({ initialData, isEdit = false }: any) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      });
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
    return null;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const agente = JSON.parse(localStorage.getItem('agente') || '{}');

    const error = validate();
    if (error) {
      setErrorMsg(error);
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
        agenteId: agente.id,
      };

      if (isEdit && initialData?.id) {
        await api.updateProperty(initialData.id, payload);
      } else {
        await api.createProperty(payload);
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

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/bg-saas.jpg')" }}
    >
      {/* overlay oscuro */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full px-6">

        <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-5xl mx-auto">

          <h1 className="text-3xl font-bold mb-10 text-center text-gray-900">
            {isEdit ? 'Editar Propiedad' : 'Nueva Propiedad'}
          </h1>

          {errorMsg && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-6 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">

            {/* INFO */}
            <div>
              <h2 className="text-xl font-semibold mb-6">Información básica</h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={label}>Título</label>
                  <input name="title" value={formData.title} onChange={handleChange} className={input} />
                </div>

                <div>
                  <label className={label}>Precio</label>
                  <div className="flex gap-2">
                    <input name="price" value={formData.price} onChange={handleChange} className={input} />
                    <select name="currency" value={formData.currency} onChange={handleChange} className={input + " w-24"}>
                      <option>USD</option>
                      <option>ARS</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className={label}>Descripción</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className={input + " h-28"} />
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* UBICACION */}
            <div>
              <h2 className="text-xl font-semibold mb-6">Ubicación</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <input name="city" value={formData.city} onChange={handleChange} placeholder="Ciudad" className={input} />
                <input name="address" value={formData.address} onChange={handleChange} placeholder="Dirección" className={input} />
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* DETALLES */}
            <div>
              <h2 className="text-xl font-semibold mb-6">Detalles</h2>

              <div className="grid md:grid-cols-3 gap-4">
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} placeholder="Habitaciones" className={input} />
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} placeholder="Baños" className={input} />
                <input type="number" name="area" value={formData.area} onChange={handleChange} placeholder="Superficie m²" className={input} />
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* CONFIG */}
            <div>
              <h2 className="text-xl font-semibold mb-6">Configuración</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <select name="status" value={formData.status} onChange={handleChange} className={input}>
                  <option>Venta</option>
                  <option>Alquiler</option>
                </select>

                <select name="operation" value={formData.operation} onChange={handleChange} className={input}>
                  <option>Venta</option>
                  <option>Alquiler</option>
                </select>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white py-4 rounded-xl font-semibold text-lg shadow-lg transition"
            >
              {loading ? 'Guardando...' : 'Guardar propiedad'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}