export const AR_MOBILE_PHONE_PLACEHOLDER = '11 2345-6789';

export const AR_MOBILE_PHONE_EXAMPLE = '+54 9 11 2345-6789';

export const AR_MOBILE_PHONE_ERROR = `Formato inválido. Ej: ${AR_MOBILE_PHONE_EXAMPLE}`;

export function isValidArMobilePhone(value: string): boolean {
  let digits = value.replace(/\D/g, '');
  if (!digits) return false;

  if (digits.startsWith('549') && digits.length === 13) return true;
  if (digits.startsWith('54') && digits.length === 12 && digits[2] === '9') return true;
  if (digits.startsWith('9') && digits.length === 11) return true;
  if (digits.length === 10) return true;

  return false;
}

export function normalizeArMobileDigits(value: string): string {
  return value.replace(/\D/g, '');
}

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

export async function fetchAgentContact(
  agentId: string,
  token?: string | null
): Promise<AgentContact | null> {
  if (!agentId) return null;

  const base = import.meta.env.VITE_API_URL;
  const paths = [`/agentes/publico/${agentId}`, `/agentes/${agentId}`];
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, authHeaders ? { headers: authHeaders } : undefined);
      if (!res.ok) continue;
      const data = await res.json();
      const parsed = parseAgentContact(data);
      if (parsed?.telefono) return parsed;
      if (parsed) return parsed;
    } catch {
      // siguiente intento
    }
  }

  return null;
}

export async function resolveAgentContact(
  agentId: string,
  embedded?: AgentContact | null,
  token?: string | null
): Promise<AgentContact | null> {
  let contact = embedded ?? null;

  if (agentId && !contact?.telefono) {
    const fetched = await fetchAgentContact(agentId, token);
    if (fetched) {
      contact = contact
        ? {
            ...fetched,
            ...contact,
            nombre: contact.nombre || fetched.nombre,
            telefono: fetched.telefono ?? contact.telefono,
            email: fetched.email ?? contact.email,
          }
        : fetched;
    }
  }

  if (agentId && !contact?.telefono && token) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/agentes/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const me = parseAgentContact(await res.json());
        if (me && String(me.id) === String(agentId) && me.telefono) {
          contact = {
            ...(contact ?? me),
            nombre: contact?.nombre ?? me.nombre,
            telefono: me.telefono,
            email: contact?.email ?? me.email,
          };
        }
      }
    } catch {
      // sin teléfono del perfil
    }
  }

  return contact;
}

export function phoneForTel(telefono: string): string {
  return telefono.replace(/[^\d+]/g, '');
}

export function phoneForWhatsApp(telefono: string): string {
  let digits = telefono.replace(/\D/g, '');
  if (!digits) return digits;

  if (digits.startsWith('549')) return digits;

  if (digits.startsWith('54')) {
    const afterCountry = digits.slice(2);
    return afterCountry.startsWith('9') ? digits : `549${afterCountry}`;
  }

  if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.startsWith('9') && digits.length >= 11) return `54${digits}`;

  if (digits.length >= 10) return `549${digits}`;

  return digits;
}
