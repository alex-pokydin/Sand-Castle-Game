// Core internationalization system
// English phrases as keys with automatic fallback

type TranslationKey = string;
type TranslationValues = Record<string, string | number>;
type TranslationFunction = (key: TranslationKey, values?: TranslationValues) => string;

interface Language {
  code: string;
  name: string;
  translations?: Record<string, string>;
}

class I18nManager {
  private currentLanguage: Language = { code: 'en', name: 'English' };
  private languages: Map<string, Language> = new Map();
  private listeners: Array<(language: Language) => void> = [];

  constructor() {
    // Register supported languages
    this.languages.set('en', { code: 'en', name: 'English' });
    this.languages.set('ua', { code: 'ua', name: 'Українська' });
  }

  // Initialize with detected or saved language
  async init(): Promise<void> {
    const savedLanguage = this.getSavedLanguage();
    const detectedLanguage = savedLanguage || this.detectLanguage();
    await this.setLanguage(detectedLanguage);
  }

  // Get available languages
  getAvailableLanguages(): Language[] {
    return Array.from(this.languages.values());
  }

  // Get current language
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  // Set language and load translations if needed
  async setLanguage(languageCode: string): Promise<void> {
    const language = this.languages.get(languageCode);
    if (!language) {
      console.warn(`Language ${languageCode} not supported, falling back to English`);
      return;
    }

    // Load translations for non-English languages
    if (languageCode !== 'en' && !language.translations) {
      try {
        const translations = await this.loadTranslations(languageCode);
        language.translations = translations;
      } catch (error) {
        console.error(`Failed to load translations for ${languageCode}:`, error);
        return;
      }
    }

    this.currentLanguage = language;
    this.saveLanguage(languageCode);
    this.notifyLanguageChange();
  }

  // Load translation file
  private async loadTranslations(languageCode: string): Promise<Record<string, string>> {
    const module = await import(`./translations/${languageCode}.ts`);
    return module.default || module.translations;
  }

  // Translate a key with optional variable interpolation
  translate(key: TranslationKey, values?: TranslationValues): string {
    // For English, return the key as-is (English phrases as keys approach)
    if (this.currentLanguage.code === 'en') {
      return this.interpolate(key, values);
    }

    // For other languages, look up translation
    const translations = this.currentLanguage.translations;
    if (translations && translations[key]) {
      return this.interpolate(translations[key], values);
    }

    // Fallback to English key
    return this.interpolate(key, values);
  }

  // Interpolate variables in translation strings
  private interpolate(text: string, values?: TranslationValues): string {
    if (!values) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = values[key];
      return value !== undefined ? String(value) : match;
    });
  }

  // Detect browser language
  private detectLanguage(): string {
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    const langCode = browserLang.split('-')[0]; // Get base language (e.g., 'uk' from 'uk-UA')
    
    // Map some common variations
    const langMap: Record<string, string> = {
      'uk': 'ua', // Ukrainian
      'ru': 'ua'  // Russian speakers likely prefer Ukrainian in this context
    };

    const mappedLang = langMap[langCode] || langCode;
    return this.languages.has(mappedLang) ? mappedLang : 'en';
  }

  // Save language preference
  private saveLanguage(languageCode: string): void {
    try {
      localStorage.setItem('sand-castle-language', languageCode);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }

  // Get saved language preference
  private getSavedLanguage(): string | null {
    try {
      return localStorage.getItem('sand-castle-language');
    } catch (error) {
      console.warn('Failed to get saved language preference:', error);
      return null;
    }
  }

  // Add language change listener
  onLanguageChange(callback: (language: Language) => void): void {
    this.listeners.push(callback);
  }

  // Remove language change listener
  offLanguageChange(callback: (language: Language) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Notify all listeners of language change
  private notifyLanguageChange(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentLanguage);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });
  }
}

// Global i18n manager instance
const i18nManager = new I18nManager();

// Async translation function (for initial loading)
export const t = async (key: TranslationKey, values?: TranslationValues): Promise<string> => {
  return i18nManager.translate(key, values);
};

// Sync translation function (when language already loaded)
export const tSync: TranslationFunction = (key: TranslationKey, values?: TranslationValues): string => {
  return i18nManager.translate(key, values);
};

// Export manager for advanced usage
export { i18nManager };

// Language selection utilities
export const setLanguage = (languageCode: string): Promise<void> => i18nManager.setLanguage(languageCode);
export const getCurrentLanguage = (): Language => i18nManager.getCurrentLanguage();
export const getAvailableLanguages = (): Language[] => i18nManager.getAvailableLanguages();
export const initI18n = (): Promise<void> => i18nManager.init();

// Language change subscription
export const onLanguageChange = (callback: (language: Language) => void): void => {
  i18nManager.onLanguageChange(callback);
};

export const offLanguageChange = (callback: (language: Language) => void): void => {
  i18nManager.offLanguageChange(callback);
}; 