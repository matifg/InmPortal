import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

const DISALLOW = [
  '/login',
  '/register',
  '/registro',
  '/verificar-email',
  '/recuperar-password',
  '/restablecer-password',
  '/dashboard',
  '/admin',
  '/agent',
  '/propiedad/editar',
];

export type SeoStaticFilesOptions = {
  siteUrl?: string;
  apiUrl?: string;
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRobotsTxt(siteUrl: string): string {
  return [
    '# Inmo360 - public pages only (auth/panel disallowed)',
    'User-agent: *',
    'Allow: /',
    ...DISALLOW.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

/** Google acepta hasta 1000 imágenes por URL; con las primeras alcanza para indexar la galería. */
const MAX_IMAGES_PER_PROPERTY = 10;

type SitemapEntry = {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
  images?: string[];
};

type PublishedProperty = {
  id: string;
  agentId?: string;
  lastmod?: string;
  images: string[];
};

function sitemapUrlEntry({ loc, changefreq, priority, lastmod, images = [] }: SitemapEntry): string {
  const lastmodLine = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
  const imageLines = images
    .map((src) => `\n    <image:image>\n      <image:loc>${escapeXml(src)}</image:loc>\n    </image:image>`)
    .join('');
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmodLine}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageLines}
  </url>`;
}

/** Misma regla que normalizeImageUrl del front: las rutas relativas cuelgan de la API. */
function absoluteImageUrl(raw: unknown, apiUrl: string): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const url = raw.trim();
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function propertyImages(item: any, apiUrl: string): string[] {
  const gallery = Array.isArray(item.imagenes)
    ? [...item.imagenes]
        .sort((a, b) => (a?.orden ?? 0) - (b?.orden ?? 0))
        .map((img) => absoluteImageUrl(img?.url, apiUrl))
    : [];
  const all = [absoluteImageUrl(item.imageUrl, apiUrl), ...gallery].filter(
    (src): src is string => Boolean(src)
  );
  return [...new Set(all)].slice(0, MAX_IMAGES_PER_PROPERTY);
}

async function fetchPublishedProperties(apiUrl: string): Promise<PublishedProperty[]> {
  try {
    const res = await fetch(`${apiUrl}/propiedades`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((p) => p && p.id && (p.publicacionEstado == null || p.publicacionEstado === 'PUBLICADA'))
      .map((p) => ({
        id: String(p.id),
        agentId: p.agenteId != null ? String(p.agenteId) : undefined,
        lastmod: typeof p.creadoEn === 'string' ? p.creadoEn.slice(0, 10) : undefined,
        images: propertyImages(p, apiUrl),
      }));
  } catch {
    return [];
  }
}

async function buildSitemapXml(siteUrl: string, apiUrl: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  // /propiedades no va: renderiza el mismo catálogo y su canonical es /.
  const entries: SitemapEntry[] = [{ loc: `${siteUrl}/`, changefreq: 'daily', priority: '1.0', lastmod: today }];

  const props = await fetchPublishedProperties(apiUrl);
  // Solo inmobiliarias con al menos una publicación: los perfiles vacíos llevan noindex.
  const agencyLastmod = new Map<string, string>();
  for (const p of props) {
    entries.push({
      loc: `${siteUrl}/propiedad/${p.id}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: p.lastmod || today,
      images: p.images,
    });
    if (p.agentId) {
      const current = agencyLastmod.get(p.agentId);
      const candidate = p.lastmod || today;
      if (!current || candidate > current) agencyLastmod.set(p.agentId, candidate);
    }
  }

  for (const [agentId, lastmod] of agencyLastmod) {
    entries.push({ loc: `${siteUrl}/inmobiliaria/${agentId}`, changefreq: 'weekly', priority: '0.6', lastmod });
  }

  for (const legalPath of ['/politica-de-privacidad', '/terminos-y-condiciones']) {
    entries.push({ loc: `${siteUrl}${legalPath}`, changefreq: 'yearly', priority: '0.2' });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map(sitemapUrlEntry).join('\n')}
</urlset>
`;
}

/**
 * Sirve /robots.txt y /sitemap.xml en dev, y los escribe en dist al build.
 * También reemplaza __SITE_URL__ en index.html (og:image necesita URL absoluta).
 */
export function seoStaticFilesPlugin(options: SeoStaticFilesOptions = {}): Plugin {
  let siteUrl = normalizeBaseUrl(options.siteUrl || 'http://localhost:3000');
  let apiUrl = normalizeBaseUrl(options.apiUrl || 'http://localhost:8080');
  let outDir = 'dist';

  return {
    name: 'inmo360-seo-static-files',
    configResolved(config: ResolvedConfig) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl);
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0];
        if (pathname === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(buildRobotsTxt(siteUrl));
          return;
        }
        if (pathname === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(await buildSitemapXml(siteUrl, apiUrl));
          return;
        }
        next();
      });
    },
    async closeBundle() {
      try {
        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(path.join(outDir, 'robots.txt'), buildRobotsTxt(siteUrl), 'utf8');
        await fs.writeFile(
          path.join(outDir, 'sitemap.xml'),
          await buildSitemapXml(siteUrl, apiUrl),
          'utf8'
        );
      } catch (err) {
        console.warn('[seo] No se pudieron escribir robots/sitemap en dist:', err);
      }
    },
  };
}
