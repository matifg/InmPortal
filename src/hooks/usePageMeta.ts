import { useEffect } from 'react';

const DEFAULT_TITLE = 'Inmo360 | Casas, departamentos y terrenos en venta y alquiler';
const DEFAULT_DESCRIPTION =
  'Encontrá casas, departamentos y terrenos en venta y alquiler en Argentina. Filtrá por provincia, ciudad, zona y operación y contactá directo a la inmobiliaria.';
const DEFAULT_OG_IMAGE_PATH = '/og-image.jpg';
const DEFAULT_OG_IMAGE_WIDTH = '1200';
const DEFAULT_OG_IMAGE_HEIGHT = '630';

export type PageMetaExtras = {
  /** Imagen de portada (absoluta o relativa). */
  image?: string | null;
  /** URL canónica; por defecto location.href sin hash. */
  url?: string | null;
  /** og:type — website (home) o article (ficha). */
  type?: 'website' | 'article';
  /** Excluye la página del índice (404, borradores, perfiles inexistentes). */
  noindex?: boolean;
};

function upsertMetaByName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMetaByProperty(property: string) {
  document.querySelector(`meta[property="${property}"]`)?.remove();
}

/** Las medidas solo se conocen para la imagen por defecto; con fotos de propiedades se omiten. */
function setOgImageSize(isDefaultImage: boolean) {
  if (isDefaultImage) {
    upsertMetaByProperty('og:image:width', DEFAULT_OG_IMAGE_WIDTH);
    upsertMetaByProperty('og:image:height', DEFAULT_OG_IMAGE_HEIGHT);
  } else {
    removeMetaByProperty('og:image:width');
    removeMetaByProperty('og:image:height');
  }
}

function upsertCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setRobots(noindex: boolean) {
  const el = document.querySelector('meta[name="robots"]');
  if (noindex) upsertMetaByName('robots', 'noindex, follow');
  else el?.remove();
}

function toAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (typeof window === 'undefined') return trimmed;
  try {
    return new URL(trimmed, window.location.origin).href;
  } catch {
    return trimmed;
  }
}

function defaultPageUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
}

function defaultOgImage(): string {
  return toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

/**
 * Actualiza <title>, meta description, Open Graph y Twitter Cards.
 * Compatible con la firma del paso 1: usePageMeta(title, description?).
 * Al desmontar no pisa a ciegas: deja defaults del sitio.
 */
export function usePageMeta(
  title: string,
  description?: string,
  extras: PageMetaExtras = {}
) {
  const { image, url, type = 'website', noindex = false } = extras;

  useEffect(() => {
    const fullTitle = title.includes('Inmo360') ? title : `${title} | Inmo360`;
    const desc = (description?.trim() || DEFAULT_DESCRIPTION).slice(0, 160);
    const pageUrl = toAbsoluteUrl(url?.trim() || defaultPageUrl());
    const rawImage = image?.trim();
    const hasOwnImage = Boolean(rawImage && rawImage !== '/no-image.jpg');
    const imageUrl = hasOwnImage ? toAbsoluteUrl(rawImage!) : defaultOgImage();

    document.title = fullTitle;
    upsertMetaByName('description', desc);
    setRobots(noindex);
    // Una URL explícita conserva su query (ej. ?page=2); la de location se limpia de parámetros arbitrarios.
    if (pageUrl) {
      upsertCanonical(url?.trim() ? pageUrl.split('#')[0] : pageUrl.split(/[?#]/)[0]);
    }

    // Open Graph
    upsertMetaByProperty('og:site_name', 'Inmo360');
    upsertMetaByProperty('og:type', type);
    upsertMetaByProperty('og:title', fullTitle);
    upsertMetaByProperty('og:description', desc);
    if (pageUrl) upsertMetaByProperty('og:url', pageUrl);
    if (imageUrl) {
      upsertMetaByProperty('og:image', imageUrl);
      upsertMetaByProperty('og:image:alt', fullTitle);
      setOgImageSize(!hasOwnImage);
    }

    // Twitter / X
    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', fullTitle);
    upsertMetaByName('twitter:description', desc);
    if (imageUrl) upsertMetaByName('twitter:image', imageUrl);

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMetaByName('description', DEFAULT_DESCRIPTION);
      setRobots(false);
      upsertCanonical(toAbsoluteUrl('/'));
      upsertMetaByProperty('og:site_name', 'Inmo360');
      upsertMetaByProperty('og:type', 'website');
      upsertMetaByProperty('og:title', DEFAULT_TITLE);
      upsertMetaByProperty('og:description', DEFAULT_DESCRIPTION);
      upsertMetaByProperty('og:url', toAbsoluteUrl('/'));
      upsertMetaByProperty('og:image', defaultOgImage());
      upsertMetaByProperty('og:image:alt', DEFAULT_TITLE);
      setOgImageSize(true);
      upsertMetaByName('twitter:card', 'summary_large_image');
      upsertMetaByName('twitter:title', DEFAULT_TITLE);
      upsertMetaByName('twitter:description', DEFAULT_DESCRIPTION);
      upsertMetaByName('twitter:image', defaultOgImage());
    };
  }, [title, description, image, url, type, noindex]);
}

export { DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE_PATH };
