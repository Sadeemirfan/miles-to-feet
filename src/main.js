// src/main.js

document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle Engine ---
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  // Initial apply
  applyTheme(currentTheme);

  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(theme);
    });
  });

  // --- Mobile Drawer Engine ---
  const burgerMenuBtn = document.querySelector('.burger-menu');
  const mobileNav = document.querySelector('.mobile-nav');

  if (burgerMenuBtn && mobileNav) {
    burgerMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileNav.classList.toggle('open');
    });

    // Close drawer on click outside
    document.addEventListener('click', (e) => {
      if (mobileNav.classList.contains('open') && !mobileNav.contains(e.target) && !burgerMenuBtn.contains(e.target)) {
        mobileNav.classList.remove('open');
      }
    });
  }

  // --- Newsletter Form Submission ---
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('.newsletter-input');
      const email = emailInput.value.trim();

      if (validateEmail(email)) {
        showToast('Successfully subscribed! Thank you.');
        emailInput.value = '';
      } else {
        showToast('Please enter a valid email address.');
      }
    });
  }

  // --- Universal Toast Function ---
  window.showToast = function(message) {
    // Remove existing toast if any
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    // Animate out
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // --- i18n Translation Switcher Engine ---
  const DEFAULT_LOCALE = 'en';
  const supportedLocales = ['en', 'hi', 'es', 'ru', 'fr', 'de', 'it', 'pt', 'bn', 'ja', 'ko', 'ms', 'pl', 'id', 'ar', 'bg', 'tr', 'sv'];
  
  // Try to determine initial locale from URL path e.g. /es/ -> 'es'
  let currentLocale = DEFAULT_LOCALE;
  const pathParts = window.location.pathname.split('/').filter(p => p);
  if (pathParts.length > 0 && supportedLocales.includes(pathParts[0])) {
    currentLocale = pathParts[0];
  }

  // Load English as default / fallback
  let englishTranslations = {};

  const initI18n = async () => {
    try {
      const enModule = await import('./locales/en/translations.json');
      englishTranslations = enModule.default || enModule;
    } catch (err) {
      console.error('Failed to load English fallback translations', err);
    }

    // Set initial dropdown values
    document.querySelectorAll('.lang-select').forEach(select => {
      select.value = currentLocale;
    });

    // If not English, load and translate
    if (currentLocale !== DEFAULT_LOCALE) {
      await changeLanguage(currentLocale, false);
    } else {
      // Sync lang and dir properties for default English
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
  };

  const changeLanguage = async (locale, updateUrl = true) => {
    currentLocale = locale;
    
    // Set lang dropdown selects
    document.querySelectorAll('.lang-select').forEach(select => {
      select.value = locale;
    });

    let translations = {};
    if (locale !== 'en') {
      try {
        const transModule = await import(`./locales/${locale}/translations.json`);
        translations = transModule.default || transModule;
      } catch (e) {
        console.warn(`Translation file for locale "${locale}" not found. Falling back to English.`, e);
      }
    }

    // Update <html lang> and <html dir>
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';

    // Translate DOM elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = translations[key] || englishTranslations[key];
      if (val) {
        // If element is input/textarea, update placeholder, else innerHTML / textContent
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = val;
        } else {
          el.innerHTML = val;
        }
      }
    });

    // Translate placeholder attributes specifically
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = translations[key] || englishTranslations[key];
      if (val) {
        el.placeholder = val;
      }
    });

    // Translate Document Title
    const titleVal = translations['title'] || englishTranslations['title'];
    if (titleVal) {
      document.title = `${titleVal} | Miles to Feet`;
    }

    // Translate meta description tag
    const metaDescEl = document.querySelector('meta[name="description"]');
    const metaVal = translations['meta_desc'] || englishTranslations['meta_desc'];
    if (metaDescEl && metaVal) {
      metaDescEl.setAttribute('content', metaVal);
    }

    // Update canonical and hreflang tags dynamically in the browser
    const updateSEOHead = (loc) => {
      let pathname = window.location.pathname;
      const pathParts = pathname.split('/').filter(p => p);
      if (pathParts.length > 0 && supportedLocales.includes(pathParts[0])) {
        pathParts.shift(); // remove locale prefix
      }
      const subpath = pathParts.join('/');
      const baseSubpath = subpath ? `${subpath}/` : '';

      // Update Canonical
      let canonicalEl = document.querySelector('link[rel="canonical"]');
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      const canonicalLocalePrefix = loc === 'en' ? '' : `${loc}/`;
      canonicalEl.setAttribute('href', `https://milestofeet.com/${canonicalLocalePrefix}${baseSubpath}`);

      // Update Alternates
      document.querySelectorAll('link[rel="alternate"]').forEach(el => el.remove());

      supportedLocales.forEach(l => {
        const altLink = document.createElement('link');
        altLink.setAttribute('rel', 'alternate');
        altLink.setAttribute('hreflang', l);
        const prefix = l === 'en' ? '' : `${l}/`;
        altLink.setAttribute('href', `https://milestofeet.com/${prefix}${baseSubpath}`);
        document.head.appendChild(altLink);
      });

      // Add x-default
      const defaultLink = document.createElement('link');
      defaultLink.setAttribute('rel', 'alternate');
      defaultLink.setAttribute('hreflang', 'x-default');
      defaultLink.setAttribute('href', `https://milestofeet.com/${baseSubpath}`);
      document.head.appendChild(defaultLink);
    };

    updateSEOHead(locale);

    // Update URL prefix without reloading the page
    if (updateUrl) {
      let newPath = '/';
      if (locale !== 'en') {
        newPath = `/${locale}/`;
      }
      history.pushState({ locale }, '', newPath);
    }
  };

  // Bind change listeners to dropdowns
  document.querySelectorAll('.lang-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const locale = e.target.value;
      const pathParts = window.location.pathname.split('/').filter(p => p);
      if (pathParts.length > 0 && supportedLocales.includes(pathParts[0])) {
        pathParts.shift(); // remove existing locale prefix
      }
      const subpath = pathParts.join('/');
      const baseSubpath = subpath ? `${subpath}/` : '';
      const newPath = locale === 'en' ? `/${baseSubpath}` : `/${locale}/${baseSubpath}`;
      window.location.href = newPath;
    });
  });

  // Handle browser back/forward history events
  window.addEventListener('popstate', (e) => {
    const pathParts = window.location.pathname.split('/').filter(p => p);
    let poppedLocale = DEFAULT_LOCALE;
    if (pathParts.length > 0 && supportedLocales.includes(pathParts[0])) {
      poppedLocale = pathParts[0];
    }
    changeLanguage(poppedLocale, false);
  });

  // Run initial translations
  initI18n();

  // --- Cookie Consent Banner Engine ---
  const consentBanner = document.getElementById('cookie-consent-banner');
  const acceptAllBtn = document.getElementById('cookie-accept-all');
  const rejectBtn = document.getElementById('cookie-reject-essential');

  if (consentBanner && acceptAllBtn && rejectBtn) {
    const consent = localStorage.getItem('cookie-consent');
    
    // Show banner if choice is not yet made
    if (!consent) {
      consentBanner.style.display = 'block';
    }

    const setConsent = (status) => {
      localStorage.setItem('cookie-consent', status);
      consentBanner.style.display = 'none';

      // Update Consent Mode v2 status
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          'ad_storage': status === 'accepted' ? 'granted' : 'denied',
          'ad_user_data': status === 'accepted' ? 'granted' : 'denied',
          'ad_personalization': status === 'accepted' ? 'granted' : 'denied',
          'analytics_storage': status === 'accepted' ? 'granted' : 'denied'
        });
      }
    };

    acceptAllBtn.addEventListener('click', () => setConsent('accepted'));
    rejectBtn.addEventListener('click', () => setConsent('rejected'));
  }
});


