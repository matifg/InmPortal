export type UbicacionItem = { id: string; nombre: string };

const base = import.meta.env.VITE_API_URL;

export async function fetchProvincias(): Promise<UbicacionItem[]> {
  const res = await fetch(`${base}/ubicaciones/provincias`);
  if (!res.ok) throw new Error('Error al cargar provincias');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchLocalidades(provinciaId: string): Promise<UbicacionItem[]> {
  const res = await fetch(
    `${base}/ubicaciones/localidades?provincia=${encodeURIComponent(provinciaId)}`
  );
  if (!res.ok) throw new Error('Error al cargar localidades');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
