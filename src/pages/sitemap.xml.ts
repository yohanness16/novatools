import type { APIRoute } from 'astro';
import { TOOLS } from '../lib/toolsData';

export const GET: APIRoute = async () => {
  const baseUrl = 'https://toolboxs.tech';
  const currentDate = new Date().toISOString().split('T')[0];

  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/about', priority: '0.8', changefreq: 'monthly' },
    { path: '/contact', priority: '0.8', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.7', changefreq: 'monthly' },
    { path: '/terms', priority: '0.7', changefreq: 'monthly' },
    { path: '/pdf', priority: '0.9', changefreq: 'weekly' },
    { path: '/image', priority: '0.9', changefreq: 'weekly' },
    { path: '/video', priority: '0.9', changefreq: 'weekly' },
    { path: '/document', priority: '0.9', changefreq: 'weekly' },
    { path: '/diagram', priority: '0.9', changefreq: 'weekly' },
    { path: '/svg', priority: '0.9', changefreq: 'weekly' },
  ];

  const toolPages = TOOLS.map((tool) => ({
    path: tool.path,
    priority: tool.badge ? '0.95' : '0.85',
    changefreq: 'weekly',
  }));

  // Deduplicate routes
  const seenPaths = new Set<string>();
  const allPages = [...staticPages, ...toolPages].filter((p) => {
    if (seenPaths.has(p.path)) return false;
    seenPaths.add(p.path);
    return true;
  });

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
