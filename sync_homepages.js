import fs from 'fs';
import path from 'path';

const locales = ['hi', 'es', 'ru', 'fr', 'de', 'it', 'pt', 'bn', 'ja', 'ko', 'ms', 'pl', 'id', 'ar', 'bg', 'tr', 'sv'];
const sourceHtml = fs.readFileSync('index.html', 'utf8');

locales.forEach(loc => {
  const locDir = path.resolve(loc);
  if (!fs.existsSync(locDir)) {
    fs.mkdirSync(locDir, { recursive: true });
  }

  let html = sourceHtml;
  const dirAttr = loc === 'ar' ? ' lang="ar" dir="rtl"' : ` lang="${loc}" dir="ltr"`;
  html = html.replace(/<html[^>]*>/, `<html${dirAttr}>`);
  
  html = html.replace(
    /<link rel="canonical" href="https:\/\/milestofeet.com\/" \/>/,
    `<link rel="canonical" href="https://milestofeet.com/${loc}/" />`
  );

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

  fs.writeFileSync(path.join(locDir, 'index.html'), html, 'utf8');
});

console.log('Successfully synchronized index.html across all 17 non-English locales!');
