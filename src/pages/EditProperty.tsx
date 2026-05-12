import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PropertyForm from './PropertyForm';

export default function EditProperty() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!id) return;

  setLoading(true);

  const token = localStorage.getItem('token');

  fetch(`${import.meta.env.VITE_API_URL}/propiedades/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(res => {
      if (!res.ok) throw new Error('Error al obtener propiedad');
      return res.json();
    })
    .then(data => setProperty(data))
    .catch(err => {
      console.error(err);
      setProperty(null);
    })
    .finally(() => setLoading(false));
}, [id]);

  if (loading) return <div>Cargando...</div>;
  if (!property) return <div>No encontrada</div>;

  return <PropertyForm initialData={property} isEdit />;
}