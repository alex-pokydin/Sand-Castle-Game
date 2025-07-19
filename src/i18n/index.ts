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

  // Initialize with priority: localStorage -> system language -> default (English)
  async init(): Promise<void> {
    const savedLanguage = this.getSavedLanguage();
    const detectedLanguage = this.detectSystemLanguage();
    const defaultLanguage = savedLanguage || detectedLanguage || 'en';
    await this.setLanguage(defaultLanguage);
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
    try {
      const module = await import(`./translations/${languageCode}.ts`);
      const translations = module.default || module.translations;
      return translations;
    } catch (error) {
      console.error(`Error loading translations for ${languageCode}:`, error);
      throw error;
    }
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

    // Fallback to English key with warning
    console.warn(`[I18n] Missing translation for key "${key}" in language "${this.currentLanguage.code}". Falling back to English.`);
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

  // Detect system language from browser
  private detectSystemLanguage(): string | null {
    try {
      const browserLang = navigator.language || navigator.languages?.[0] || 'en';
      const langCode = browserLang.split('-')[0]; // Get base language (e.g., 'uk' from 'uk-UA')
      
      // Map some common variations to our supported languages
      const langMap: Record<string, string> = {
        'uk': 'ua', // Ukrainian
        'ru': 'ua'  // Russian speakers likely prefer Ukrainian in this context
      };

      const mappedLang = langMap[langCode] || langCode;
      return this.languages.has(mappedLang) ? mappedLang : null;
    } catch (error) {
      console.warn('Failed to detect system language:', error);
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

// Global i18n manager instance - ensure singleton
let i18nManager: I18nManager;

// Get or create the global i18n manager instance
const getI18nManager = (): I18nManager => {
  if (!i18nManager) {
    i18nManager = new I18nManager();
  }
  return i18nManager;
};

// Async translation function (for initial loading)
export const t = async (key: TranslationKey, values?: TranslationValues): Promise<string> => {
  return getI18nManager().translate(key, values);
};

// Sync translation function (when language already loaded)
export const tSync: TranslationFunction = (key: TranslationKey, values?: TranslationValues): string => {
  return getI18nManager().translate(key, values);
};

// Export manager for advanced usage
export const getI18nManagerInstance = (): I18nManager => getI18nManager();

// Language selection utilities
export const setLanguage = (languageCode: string): Promise<void> => getI18nManager().setLanguage(languageCode);
export const getCurrentLanguage = (): Language => getI18nManager().getCurrentLanguage();
export const getAvailableLanguages = (): Language[] => getI18nManager().getAvailableLanguages();
export const initI18n = (): Promise<void> => getI18nManager().init();

// Language change subscription
export const onLanguageChange = (callback: (language: Language) => void): void => {
  getI18nManager().onLanguageChange(callback);
};

export const offLanguageChange = (callback: (language: Language) => void): void => {
  getI18nManager().offLanguageChange(callback);
};

// Debug function to check current state
export const debugI18n = (): void => {
  console.log('=== I18n Debug Info ===');
  console.log('Current language:', getI18nManager().getCurrentLanguage());
  console.log('Available languages:', getI18nManager().getAvailableLanguages());
  console.log('Saved language from localStorage:', localStorage.getItem('sand-castle-language'));
  console.log('========================');
};

// Test function to manually set language (for debugging)
export const testSetLanguage = async (languageCode: string): Promise<void> => {
  console.log(`Testing language change to: ${languageCode}`);
  await setLanguage(languageCode);
  debugI18n();
};

// Test function to check translation
export const testTranslation = (key: string): void => {
  console.log(`Testing translation for key: "${key}"`);
  const result = tSync(key);
  console.log(`Translation result: "${result}"`);
};

// Test function to clear saved language (for testing default behavior)
export const clearSavedLanguage = (): void => {
  try {
    localStorage.removeItem('sand-castle-language');
    console.log('Saved language preference cleared');
  } catch (error) {
    console.warn('Failed to clear saved language preference:', error);
  }
};

// Test function to show system language detection
export const testSystemLanguageDetection = (): void => {
  console.log('=== System Language Detection Test ===');
  console.log('navigator.language:', navigator.language);
  console.log('navigator.languages:', navigator.languages);
  
  const manager = getI18nManager();
  const savedLanguage = localStorage.getItem('sand-castle-language');
  const detectedLanguage = (manager as any).detectSystemLanguage?.() || 'Method not accessible';
  
  console.log('Saved language:', savedLanguage);
  console.log('Detected language:', detectedLanguage);
  console.log('=====================================');
};

// Test function to check for missing translations
export const checkMissingTranslations = (): void => {
  console.log('=== Missing Translations Check ===');
  const currentLang = getCurrentLanguage();
  
  if (currentLang.code === 'en') {
    console.log('Current language is English - no translations needed');
    return;
  }
  
  const translations = currentLang.translations;
  if (!translations) {
    console.log('No translations loaded for current language');
    return;
  }
  
  // Common keys that should be translated
  const commonKeys = [
    'Sand Castle', 'Play Game', 'Settings', 'High Score', 'Resume Game', 
    'New Game', 'Back to Menu', 'Language', 'Game Over', 'Level Complete',
    'Perfect Drop!', 'Great Placement!', 'Good Job!', 'Oops! Try Again'
  ];
  
  const missingKeys = commonKeys.filter(key => !translations[key]);
  
  if (missingKeys.length === 0) {
    console.log('✅ All common translations are present');
  } else {
    console.log('❌ Missing translations for keys:', missingKeys);
  }
  
  console.log('=====================================');
}; 