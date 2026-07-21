import fs from 'fs';
import path from 'path';

const locales = ['hi', 'es', 'ru', 'fr', 'de', 'it', 'pt', 'bn', 'ja', 'ko', 'ms', 'pl', 'id', 'ar', 'bg', 'tr', 'sv'];

const blogFile = 'blog/how-many-feet-in-a-mile/index.html';
const sourceHtml = fs.readFileSync(blogFile, 'utf8');

locales.forEach(loc => {
  const locDir = path.join(loc, 'blog', 'how-many-feet-in-a-mile');
  if (!fs.existsSync(locDir)) {
    fs.mkdirSync(locDir, { recursive: true });
  }

  let html = sourceHtml;
  const dirAttr = loc === 'ar' ? ' dir="rtl"' : ' dir="ltr"';
  html = html.replace(/<html lang="en">/, `<html lang="${loc}"${dirAttr}>`);
  html = html.replace(/<html lang="[^"]+">/, `<html lang="${loc}"${dirAttr}>`);
  html = html.replace(
    /<link rel="canonical" href="https:\/\/milestofeet.com\/blog\/how-many-feet-in-a-mile\/" \/>/,
    `<link rel="canonical" href="https://milestofeet.com/${loc}/blog/how-many-feet-in-a-mile/" />`
  );

  fs.writeFileSync(path.join(locDir, 'index.html'), html, 'utf8');
});

console.log('Synced blog/how-many-feet-in-a-mile/index.html across all 17 non-English locales!');
