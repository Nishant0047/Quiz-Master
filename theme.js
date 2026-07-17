/**
 * theme.js
 * Applies and toggles light/dark mode. Preference is saved to localStorage
 * and falls back to the OS-level prefers-color-scheme on first visit.
 * Loaded on every page so the toggle button in the header always works.
 */

const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 14.7A8.6 8.6 0 1 1 9.3 3.6a7 7 0 0 0 11.1 11.1Z"/></svg>';

const Theme = {
  init() {
    const saved = Storage.getTheme();
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (systemPrefersDark ? 'dark' : 'light');
    this.apply(initial, { persist: false });
    this._bindToggle();
    this._bindSystemChange();
  },

  apply(theme, { persist = true } = {}) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) Storage.setTheme(theme);
    this._syncToggleIcon(theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    this.apply(current === 'dark' ? 'light' : 'dark');
  },

  _bindToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? ICON_SUN : ICON_MOON;
    btn.addEventListener('click', () => this.toggle());
  },

  _bindSystemChange() {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // Only follow the system if the person has never explicitly chosen a theme.
      if (Storage.getTheme() === null) {
        this.apply(e.matches ? 'dark' : 'light', { persist: false });
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
  },

  _syncToggleIcon(theme) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
};

document.addEventListener('DOMContentLoaded', () => Theme.init());
