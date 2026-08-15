export interface WordPressPublishResponse {
  propiedadId: string;
  wordpressPageId: number | string;
  status: string;
  link: string;
  titulo: string;
  imagenesSubidas: number;
  listadoCasasActualizado: boolean;
  listadoCasasMensaje: string;
}

export interface WordPressUnpublishResponse {
  propiedadId: string;
  wordpressPageIdAnterior?: number | string;
  status?: string;
  cardsEliminadas?: number;
  listadoCasasActualizado?: boolean;
  mensaje?: string;
}

export class WordPressPublishError extends Error {
  status: number;
  wordpressPageId?: string | null;

  constructor(status: number, message: string, wordpressPageId?: string | null) {
    super(message);
    this.name = 'WordPressPublishError';
    this.status = status;
    this.wordpressPageId = wordpressPageId ?? null;
  }
}

const WP_PUBLIC_BASE = 'https://inmobiliariafortese.com.ar';

/** URL pública de la ficha en WordPress (sin tocar backend). */
export function buildWordPressPublicUrl(wordpressPageId: string | number): string {
  return `${WP_PUBLIC_BASE}/?page_id=${wordpressPageId}`;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new WordPressPublishError(401, 'No tenés permiso para esta acción en WordPress.');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message.trim()) return o.message;
    if (typeof o.mensaje === 'string' && o.mensaje.trim()) return o.mensaje;
  }
  return fallback;
}

function extractWordpressPageId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const raw = o.wordpressPageId ?? o.wordpress_page_id;
  if (raw == null || raw === '') return null;
  return String(raw);
}

function friendlyPublishMessage(status: number): string {
  if (status === 400) return 'Faltan datos para publicar esta propiedad en WordPress.';
  if (status === 401 || status === 403) return 'No tenés permiso para publicar en WordPress.';
  if (status === 404) return 'No se encontró la propiedad.';
  if (status === 409) return 'Esta propiedad ya está publicada en WordPress.';
  if (status === 502) return 'WordPress no pudo completar la publicación. Intentá de nuevo.';
  return 'Error al publicar en WordPress';
}

function friendlyUnpublishMessage(status: number): string {
  if (status === 400) return 'No se pudo despublicar esta propiedad.';
  if (status === 401 || status === 403) return 'No tenés permiso para despublicar en WordPress.';
  if (status === 404) return 'No se encontró la propiedad.';
  if (status === 409) return 'La propiedad ya no está publicada en WordPress.';
  if (status === 502) return 'WordPress no pudo completar la despublicación. Intentá de nuevo.';
  return 'Error al despublicar de WordPress';
}

/**
 * POST /integration/wordpress/propiedades/{propiedadId}/publish
 * Usa el JWT de Inmo360 (mismo patrón Bearer que el resto del panel).
 */
export async function publishPropertyToWordPress(
  propiedadId: string
): Promise<WordPressPublishResponse> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/integration/wordpress/propiedades/${propiedadId}/publish`,
    {
      method: 'POST',
      headers: authHeaders(),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (res.status === 201) {
    return data as WordPressPublishResponse;
  }

  if (res.status === 409) {
    throw new WordPressPublishError(
      409,
      errorMessage(data, friendlyPublishMessage(409)),
      extractWordpressPageId(data)
    );
  }

  throw new WordPressPublishError(
    res.status,
    errorMessage(data, friendlyPublishMessage(res.status)),
    extractWordpressPageId(data)
  );
}

/**
 * POST /integration/wordpress/propiedades/{propiedadId}/unpublish
 * Usa el JWT de Inmo360 (mismo patrón Bearer que publish).
 */
export async function unpublishPropertyFromWordPress(
  propiedadId: string
): Promise<WordPressUnpublishResponse> {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/integration/wordpress/propiedades/${propiedadId}/unpublish`,
    {
      method: 'POST',
      headers: authHeaders(),
    }
  );

  const data = await res.json().catch(() => ({}));

  if (res.status === 200 || res.ok) {
    return data as WordPressUnpublishResponse;
  }

  if (res.status === 409) {
    throw new WordPressPublishError(
      409,
      errorMessage(data, friendlyUnpublishMessage(409)),
      null
    );
  }

  throw new WordPressPublishError(
    res.status,
    errorMessage(data, friendlyUnpublishMessage(res.status)),
    null
  );
}
