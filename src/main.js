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

  // --- i18n Language Dropdown Switcher (Redirect Engine) ---
  const supportedLocales = ['en', 'hi', 'es', 'ru', 'fr', 'de', 'it', 'pt', 'bn', 'ja', 'ko', 'ms', 'pl', 'id', 'ar', 'bg', 'tr', 'sv'];
  
  // Set initial selected value of language dropdowns based on URL prefix
  const pathParts = window.location.pathname.split('/').filter(p => p);
  let currentLocale = 'en';
  if (pathParts.length > 0 && supportedLocales.includes(pathParts[0])) {
    currentLocale = pathParts[0];
  }
  
  document.querySelectorAll('.lang-select').forEach(select => {
    select.value = currentLocale;
  });

  // Bind change listeners to dropdowns for redirecting
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
