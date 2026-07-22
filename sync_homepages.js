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

  fs.writeFileSync(path.join(locDir, 'index.html'), html, 'utf8');
});

console.log('Successfully synchronized index.html across all 17 non-English locales!');
