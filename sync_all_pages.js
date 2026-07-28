import fs from 'fs';
import path from 'path';

const locales = ['hi', 'es', 'ru', 'fr', 'de', 'it', 'pt', 'bn', 'ja', 'ko', 'ms', 'pl', 'id', 'ar', 'bg', 'tr', 'sv'];

// Exclude these directories when scanning root for templates
const excludeDirs = [
  '.git', 'node_modules', 'public', 'src', 'dist', 'zh',
  ...locales
];

// Recursive scanner to find all html templates in the root subdirectories
function getRootHtmlTemplates(dir, rootDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      const relDir = path.relative(rootDir, filePath).replace(/\\/g, '/');
      const baseDir = relDir.split('/')[0];
      if (!excludeDirs.includes(baseDir)) {
        results = results.concat(getRootHtmlTemplates(filePath, rootDir));
      }
    } else if (file === 'index.html' && dir !== rootDir) {
      results.push(filePath);
    }
  });
  return results;
}

const rootTemplates = getRootHtmlTemplates(path.resolve('.'));
console.log(`Found ${rootTemplates.length} root HTML templates to synchronize:`);
rootTemplates.forEach(t => console.log(` - ${path.relative(path.resolve('.'), t)}`));

locales.forEach(loc => {
  rootTemplates.forEach(templatePath => {
    const relPath = path.relative(path.resolve('.'), templatePath).replace(/\\/g, '/');
    const destPath = path.join(path.resolve(loc), relPath);
    const destDir = path.dirname(destPath);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const sourceHtml = fs.readFileSync(templatePath, 'utf8');
    let html = sourceHtml;

    // Set correct lang and dir attributes on <html lang="en"> or <html lang="en" dir="ltr">
    const dirAttr = loc === 'ar' ? ' lang="ar" dir="rtl"' : ` lang="${loc}" dir="ltr"`;
    html = html.replace(/<html[^>]*>/, `<html${dirAttr}>`);

    // Update canonical link
    // e.g. <link rel="canonical" href="https://milestofeet.com/about/" />
    // to <link rel="canonical" href="https://milestofeet.com/es/about/" />
    const canonicalRegex = /<link rel="canonical" href="https:\/\/milestofeet.com\/([^"]*)" \/>/;
    html = html.replace(canonicalRegex, (match, subpath) => {
      return `<link rel="canonical" href="https://milestofeet.com/${loc}/${subpath}" />`;
    });

    // Localize URLs inside JSON-LD schema blocks (url/item/@id fields) so
    // structured data on locale pages points to the locale-prefixed URL
    // instead of the bare English one. Skip image/asset URLs.
    const assetExt = /\.(png|svg|ico|jpg|jpeg)$/;
    html = html.replace(
      /("(?:url|item|@id)":\s*")https:\/\/milestofeet\.com\/([^"]*)"/g,
      (match, prefix, subpath) => {
        if (assetExt.test(subpath)) return match;
        return `${prefix}https://milestofeet.com/${loc}/${subpath}"`;
      }
    );

    // Inject data-i18n tags for presets and history labels dynamically
    html = html.replace('<div class="presets-label">Quick Presets:</div>', '<div class="presets-label" data-i18n="presets_label">Quick Presets:</div>');
    html = html.replace('<span class="history-label">Recent Calculations:</span>', '<span class="history-label" data-i18n="history_label">Recent Calculations:</span>');
    html = html.replace('<button class="history-clear-btn" id="history-clear">Clear</button>', '<button class="history-clear-btn" id="history-clear" data-i18n="history_clear_btn">Clear</button>');

    fs.writeFileSync(destPath, html, 'utf8');
  });
});

console.log(`Successfully synchronized all pages across all 17 non-English locales!`);
