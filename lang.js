// Global Language Management System
class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('siteLanguage') || 'en';
    this.init();
  }

  init() {
    const langToggle = document.getElementById('lang-toggle');
    const langText = document.getElementById('lang-text');

    if (langToggle) {
      langToggle.addEventListener('click', () => this.toggle());
    }

    window.addEventListener('load', () => this.apply());
  }

  toggle() {
    this.currentLang = this.currentLang === 'en' ? 'cn' : 'en';
    this.apply();
  }

  apply() {
    localStorage.setItem('siteLanguage', this.currentLang);
    document.documentElement.lang = this.currentLang;

    const langText = document.getElementById('lang-text');
    if (langText) {
      langText.textContent = this.currentLang === 'en' ? 'EN' : '中文';
    }

    // Translate all elements with data attributes
    document.querySelectorAll('[data-en][data-cn]').forEach(el => {
      const text = this.currentLang === 'en'
        ? el.getAttribute('data-en')
        : el.getAttribute('data-cn');
      el.textContent = text;
    });
  }

  get() {
    return this.currentLang;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.langManager = new LanguageManager();
  });
} else {
  window.langManager = new LanguageManager();
}
