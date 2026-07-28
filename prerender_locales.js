import fs from 'fs';
import path from 'path';

const locales = ['hi', 'es', 'ru', 'fr', 'de', 'it', 'pt', 'bn', 'ja', 'ko', 'ms', 'pl', 'id', 'ar', 'bg', 'tr', 'sv'];
const enJsonPath = path.resolve('src/locales/en/translations.json');
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'));

function getAllHtmlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(filePath));
    } else if (file === 'index.html') {
      results.push(filePath);
    }
  });
  return results;
}

let totalProcessed = 0;

locales.forEach(loc => {
  const jsonPath = path.resolve(`src/locales/${loc}/translations.json`);
  if (!fs.existsSync(jsonPath)) {
    console.warn(`Missing translations file: ${jsonPath}`);
    return;
  }
  const locJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const dict = { ...enJson, ...locJson };
  
  // Construct dynamic keys for diagrams initial states
  dict['ruler_tab1_info_initial'] = `<strong>${dict['ruler_tab1_name'] || 'Statute Mile'}:</strong> ${dict['ruler_tab1_info'] || 'Established in 1593 to equal 8 furlongs. Equal to exactly 5,280 feet.'}`;
  dict['scale_mark1_desc_initial'] = `<strong>${dict['scale_mark1_title'] || 'Standard 400m Lap'}:</strong> ${dict['scale_mark1_desc'] || 'About 1,320 feet. In miles, this is exactly 0.25 mi. 4 laps make a full mile!'}`;

  const htmlFiles = getAllHtmlFiles(path.resolve(loc));
  htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Normalize backslashes for path matching on Windows
    const relativePath = path.relative(path.resolve(loc), file).replace(/\\/g, '/');
    const isHomepage = relativePath === 'index.html';

    // Get page key based on directory name
    const dirParts = relativePath.split('/');
    const dirName = dirParts.slice(0, -1).join('/');
    const pageKey = 'h1_' + dirName.replace(/-/g, '_').replace(/\//g, '_');

    // 1. Update <title>
    if (isHomepage) {
      if (dict.title) {
        content = content.replace(/<title>[\s\S]*?<\/title>/, `<title>${dict.title} | Miles to Feet</title>`);
      }
    } else {
      if (dict[pageKey]) {
        content = content.replace(/<title>[\s\S]*?<\/title>/, `<title>${dict[pageKey]} | Miles to Feet</title>`);
      }
    }

    // 2. Update <meta name="description"> (only on homepage to avoid overwriting page-specific descriptions)
    if (isHomepage) {
      if (dict.meta_desc) {
        content = content.replace(/<meta name="description" content="[^"]*">/g, `<meta name="description" content="${dict.meta_desc}">`);
      }
    }

    // 3. Replace data-i18n-placeholder (strip any existing placeholder attr, before or after, to avoid duplicates)
    content = content.replace(/<([a-zA-Z0-9-]+)([^>]*\bdata-i18n-placeholder="([^"]+)"[^>]*)>/g, (match, tag, attrs, key) => {
      const val = dict[key] || enJson[key] || '';
      const cleanedAttrs = attrs.replace(/\s+placeholder="[^"]*"/g, '');
      const finalAttrs = cleanedAttrs.replace(`data-i18n-placeholder="${key}"`, `data-i18n-placeholder="${key}" placeholder="${val}"`);
      return `<${tag}${finalAttrs}>`;
    });

    // 4. Replace data-i18n elements (multi-pass to handle potential nesting)
    let prev;
    let passes = 0;
    do {
      prev = content;
      content = content.replace(/<([a-zA-Z0-9-]+)([^>]*\bdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g, (match, tag, attrs, key, oldContent) => {
        const shouldReplace = dict[key] !== undefined;

        if (shouldReplace) {
          const val = dict[key];
          if (val !== undefined) {
            return `<${tag}${attrs}>${val}</${tag}>`;
          }
        }
        return match;
      });
      passes++;
    } while (content !== prev && passes < 10);

    // 5. Inject translation dictionary for client-side JS (like calculator.js)
    const inlineScript = `<script>window.PAGE_TRANSLATIONS = ${JSON.stringify(dict).replace(/</g, '\\u003c')};</script>`;
    content = content.replace('</head>', `${inlineScript}</head>`);

    fs.writeFileSync(file, content, 'utf8');
    totalProcessed++;
  });
});

console.log(`Pre-rendered translations into ${totalProcessed} locale HTML files.`);
