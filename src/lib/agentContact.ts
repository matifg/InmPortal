export type AgentContact = {
  id?: string;
  nombre: string;
  email?: string;
  telefono?: string;
  inmobiliaria?: string;
};

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export function parseAgentContact(data: unknown): AgentContact | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;

  const nested = o.usuario ?? o.user;
  const n = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : null;

  const fullName = [o.nombre, o.apellido, n?.nombre, n?.apellido]
    .filter((x): x is string => typeof x === 'string' && x.trim() !== '')
    .join(' ')
    .trim();

  const nombre = pickString(o.nombre, o.name, n?.nombre, n?.name, fullName || undefined);

  if (!nombre) return null;

  return {
    id: pickString(o.id, o.agenteId, o.usuarioId, n?.id),
    nombre,
    email: pickString(o.email, n?.email),
    telefono: pickString(o.telefono, o.phone, o.telefonoContacto, n?.telefono, n?.phone),
    inmobiliaria: pickString(o.inmobiliaria, o.empresa, o.agencia, 'Inmo360'),
  };
}

export async function fetchAgentContact(agentId: string): Promise<AgentContact | null> {
  if (!agentId) return null;

  const base = import.meta.env.VITE_API_URL;
  const paths = [`/agentes/${agentId}`, `/agentes/publico/${agentId}`];

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`);
      if (!res.ok) continue;
      const data = await res.json();
      const parsed = parseAgentContact(data);
      if (parsed) return parsed;
    } catch {
      // siguiente intento
    }
  }

  return null;
}

export function phoneForTel(telefono: string): string {
  return telefono.replace(/[^\d+]/g, '');
}

export function phoneForWhatsApp(telefono: string): string {
  const digits = telefono.replace(/\D/g, '');
  if (digits.startsWith('54')) return digits;
  if (digits.length >= 10) return `54${digits}`;
  return digits;
}
