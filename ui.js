/**
 * ui.js
 * Small shared UI helpers used across pages: toast notifications,
 * modal open/close with focus handling, and a couple of DOM shortcuts.
 */

const UI = {
  /**
   * Shows a brief toast message. Requires a <div id="toastContainer"> on the page.
   */
  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    container.appendChild(toast);

    // Force reflow so the enter transition reliably plays.
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      // Fallback removal in case transitionend doesn't fire.
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  /**
   * Opens a modal by id. Stores the previously focused element so it can be
   * restored on close, and moves focus into the modal for keyboard users.
   */
  openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal._lastFocused = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('modal-open'));
    const focusTarget = modal.querySelector('[data-autofocus]') || modal.querySelector('button, a, input');
    if (focusTarget) focusTarget.focus();
    document.addEventListener('keydown', this._escHandler);
    this._activeModalId = id;
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('modal-open');
    setTimeout(() => { modal.hidden = true; }, 200);
    if (modal._lastFocused && modal._lastFocused.focus) modal._lastFocused.focus();
    document.removeEventListener('keydown', this._escHandler);
    this._activeModalId = null;
  },

  _escHandler(e) {
    if (e.key === 'Escape' && UI._activeModalId) {
      UI.closeModal(UI._activeModalId);
    }
  },

  /**
   * Minimal element-creation helper: UI.createEl('button', {class: 'btn'}, 'Go')
   */
  createEl(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    });
    const kids = Array.isArray(children) ? children : [children];
    kids.forEach(child => {
      if (child === null || child === undefined) return;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return el;
  }
};

// Close any open modal when its overlay (not its inner card) is clicked.
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay') && !e.target.hidden) {
    UI.closeModal(e.target.id);
  }
});
