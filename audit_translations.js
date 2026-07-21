const fs = require('fs');
const path = require('path');

// Configuration
const locales = ['en','hi','es','ru','fr','de','it','pt','bn','ja','ko','ms','pl','id','ar','bg','tr','sv'];
const pages = [
  {name: 'Homepage', relPath: 'index.html'},
  {name: 'Tool Sample', relPath: path.join('miles-to-yards','index.html')},
  {name: 'Blog Listing', relPath: path.join('blog','index.html')},
  {name: 'Blog Sample', relPath: path.join('blog','how-many-feet-in-a-mile','index.html')},
  {name: 'About', relPath: path.join('about','index.html')},
];

const distRoot = path.resolve('dist');

function fileExists(p) { return fs.existsSync(p); }
function read(p) { return fs.readFileSync(p, 'utf8'); }

// ---- Audit matrix ----
let rows = [];
for (const locale of locales) {
  for (const page of pages) {
    const localePath = locale === 'en' ? path.join(distRoot, page.relPath) : path.join(distRoot, locale, page.relPath);
    const loads = fileExists(localePath) ? 'yes' : 'no';
    let status = 'N/A';
    if (loads === 'yes') {
      const enPath = path.join(distRoot, page.relPath);
      if (fileExists(enPath)) {
        const locContent = read(localePath);
        const enContent = read(enPath);
        status = locContent === enContent ? 'fully English' : 'translated (may be partial)';
      } else {
        status = 'en missing';
      }
    }
    rows.push({locale, page: page.name, loads, status});
  }
}

let auditMarkdown = '| Locale | Page Type | Route loads? | Translation status |\n|---|---|---|---|\n';
for (const r of rows) {
  auditMarkdown += `| ${r.locale} | ${r.page} | ${r.loads} | ${r.status} |\n`;
}

fs.writeFileSync('audit_report.md', auditMarkdown, 'utf8');
console.log('Generated audit_report.md');

// ---- Missing keys report ----
// Gather all translation keys used in the source (data-i18n attributes)
function collectKeysFromFile(filePath) {
  const content = read(filePath);
  const regex = /data-i18n\s*=\s*"([^"]+)"/g;
  let match;
  const keys = [];
  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

let allKeys = new Set();
function walk(dir) {
  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules and dist
      if (['node_modules','dist','.git'].includes(entry.name)) continue;
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const ks = collectKeysFromFile(full);
      ks.forEach(k=> allKeys.add(k));
    }
  }
}
walk(path.resolve('.'));

// Load each locale JSON and compare
let missingReport = '';
for (const locale of locales) {
  if (locale === 'en') continue; // English is source
  const jsonPath = path.resolve('src','locales',locale,'translations.json');
  if (!fileExists(jsonPath)) {
    missingReport += `## ${locale}\nMissing translation JSON file at ${jsonPath}\n\n`;
    continue;
  }
  const data = JSON.parse(read(jsonPath));
  const missing = [];
  for (const k of allKeys) {
    if (!(k in data)) missing.push(k);
  }
  missingReport += `## ${locale}\nMissing ${missing.length} keys\n`;
  if (missing.length) {
    missingReport += missing.map(k=>`- ${k}`).join('\n') + '\n';
  }
  missingReport += '\n';
}
fs.writeFileSync('missing_keys_report.md', missingReport, 'utf8');
console.log('Generated missing_keys_report.md');
