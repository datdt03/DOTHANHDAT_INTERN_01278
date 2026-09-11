/**
 * Toast Notification Component
 */

import { escapeHtml } from '../utils/dom.js';

let container = null;

function ensureContainer() {
  if (!container) {
    container = document.getElementById('rf-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rf-toast-container';
      document.body.appendChild(container);
    }
  }
  return container;
}

export function showToast(message, type = 'info', duration = 3200) {
  const c = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `rf-toast rf-toast-${type}`;

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  const icon = iconMap[type] || 'info';

  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] text-${type === 'success' ? 'emerald-600' : type === 'error' ? 'red-600' : 'sky-600'}">${icon}</span>
    <span class="text-slate-800 font-medium">${escapeHtml(message)}</span>
  `;

  c.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 260);
  }, duration);
}
