/**
 * KrishiNirnay AI - Theme Engine (Section 68 & 78)
 * Manages Light, Dark, and System appearance preferences with instant switching.
 */

const STORAGE_KEY = 'krishi_theme';

class ThemeManager {
  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.currentPreference = this.getSavedPreference();
    this.init();
  }

  getSavedPreference() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system';
    } catch {
      return 'system';
    }
  }

  getSystemTheme() {
    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  getResolvedTheme() {
    if (this.currentPreference === 'system') {
      return this.getSystemTheme();
    }
    return this.currentPreference;
  }

  setTheme(preference) {
    if (!['light', 'dark', 'system'].includes(preference)) return;
    this.currentPreference = preference;
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch (e) {
      console.warn('Unable to persist theme preference:', e);
    }
    this.applyTheme();
  }

  applyTheme() {
    const resolved = this.getResolvedTheme();
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-theme-pref', this.currentPreference);
    
    // Dispatch event so charts and canvas can update colors immediately
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: {
        preference: this.currentPreference,
        resolved: resolved
      }
    }));
  }

  init() {
    // Apply theme immediately
    this.applyTheme();

    // Listen for OS system theme changes
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentPreference === 'system') {
        this.applyTheme();
      }
    });
  }
}

export const themeManager = new ThemeManager();
export default themeManager;
