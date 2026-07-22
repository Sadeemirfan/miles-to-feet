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

    // 3. Replace data-i18n-placeholder
    content = content.replace(/data-i18n-placeholder="([^"]+)"(\s+placeholder="[^"]*")?/g, (match, key) => {
      const val = dict[key] || enJson[key] || '';
      return `data-i18n-placeholder="${key}" placeholder="${val}"`;
    });

    // 4. Replace data-i18n elements (multi-pass to handle potential nesting)
    const globalUIKeys = [
      'brand_name', 'nav_miles_to_feet', 'nav_feet_to_miles', 'nav_about', 'nav_contact', 'nav_blog',
      'footer_calculators', 'footer_legal_contact', 'footer_newsletter', 'footer_newsletter_p',
      'footer_placeholder_email', 'footer_subscribe', 'footer_sitemap', 'footer_all_calculators',
      'footer_desc', 'copyright_text', 'byline_author_by', 'byline_author_team', 'byline_reviewed', 'byline_last_updated',
      'cookie_consent_text', 'cookie_consent_accept', 'cookie_consent_reject', 'cookie_privacy_link',
      'nav_terms_conditions', 'breadcrumb_home', 'breadcrumb_calculators', 'related_title', 'tables_title', 'faq_title'
    ];

    let prev;
    let passes = 0;
    do {
      prev = content;
      content = content.replace(/<([a-zA-Z0-9-]+)([^>]*\bdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g, (match, tag, attrs, key, oldContent) => {
        const isGlobal = globalUIKeys.includes(key);
        let shouldReplace = isHomepage || isGlobal;
        if (!shouldReplace) {
          const pagePrefix = dirName.replace(/-/g, '_').replace(/\//g, '_');
          shouldReplace = key.startsWith('h1_' + pagePrefix) || 
                          key.startsWith(pagePrefix + '_') ||
                          (dirName === 'about' && key.startsWith('about_')) ||
                          (dirName === 'contact' && key.startsWith('contact_')) ||
                          (dirName === 'blog' && key.startsWith('blog_'));
        }

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

    fs.writeFileSync(file, content, 'utf8');
    totalProcessed++;
  });
});

console.log(`Pre-rendered translations into ${totalProcessed} locale HTML files.`);
