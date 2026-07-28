import fs from 'fs';
import path from 'path';

const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
const matches = [...viteConfig.matchAll(/resolve\(__dirname, '([^']*)index\.html'\)/g)];

const today = new Date().toISOString().slice(0, 10);

const urls = matches.map(m => {
  const rel = m[1]; // e.g. '' or 'feet-to-yards/' or 'de/feet-to-yards/'
  const urlPath = rel === '' ? '' : rel;
  return `https://milestofeet.com/${urlPath}`;
});

// Dedupe and sort: root English pages first, then locales
const unique = [...new Set(urls)].sort((a, b) => {
  const aIsLocale = /milestofeet\.com\/[a-z]{2}\//.test(a);
  const bIsLocale = /milestofeet\.com\/[a-z]{2}\//.test(b);
  if (aIsLocale !== bIsLocale) return aIsLocale ? 1 : -1;
  return a.localeCompare(b);
});

const xmlEntries = unique.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === 'https://milestofeet.com/' ? '1.0' : '0.7'}</priority>
  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;

fs.writeFileSync('public/sitemap.xml', xml, 'utf8');
console.log(`Generated sitemap.xml with ${unique.length} URLs`);
