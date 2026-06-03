const BASE_URL = import.meta.env.VITE_API_URL;

export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function collectPropertyImages(property: {
  imagenes?: { url?: string }[];
  images?: string[];
}): string[] {
  let images: string[] = [];
  if (Array.isArray(property.imagenes) && property.imagenes.length > 0) {
    images = property.imagenes
      .map((img) => {
        const raw = img?.url || '';
        return raw ? normalizeImageUrl(raw) : null;
      })
      .filter((url): url is string => !!url);
  }
  if (!images.length && property.images?.length) {
    images = property.images.filter(Boolean) as string[];
  }
  if (!images.length) {
    images = ['/no-image.jpg'];
  }
  return images;
}
