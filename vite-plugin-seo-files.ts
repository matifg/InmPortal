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

function sitemapUrlEntry(loc: string, changefreq: string, priority: string, lastmod?: string): string {
  const lastmodLine = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmodLine}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchPropertyIds(apiUrl: string): Promise<{ id: string; updatedAt?: string }[]> {
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
        updatedAt: typeof p.creadoEn === 'string' ? p.creadoEn.slice(0, 10) : undefined,
      }));
  } catch {
    return [];
  }
}

async function buildSitemapXml(siteUrl: string, apiUrl: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    sitemapUrlEntry(`${siteUrl}/`, 'daily', '1.0', today),
    sitemapUrlEntry(`${siteUrl}/propiedades`, 'daily', '0.9', today),
  ];

  const props = await fetchPropertyIds(apiUrl);
  for (const p of props) {
    entries.push(
      sitemapUrlEntry(`${siteUrl}/propiedad/${p.id}`, 'weekly', '0.8', p.updatedAt || today)
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
}

/**
 * Sirve /robots.txt y /sitemap.xml en dev, y los escribe en dist al build.
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
