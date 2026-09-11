/**
 * Modal Component
 */

import { escapeHtml } from '../utils/dom.js';

let activeModal = null;

export function showModal({ title, contentHtml, onConfirm, confirmText = 'Xác nhận', cancelText = 'Đóng' }) {
  closeModal();

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4';
  modalOverlay.id = 'rf-active-modal';

  modalOverlay.innerHTML = `
    <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-[rfSlideIn_0.2s_ease-out]">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-base font-bold text-slate-800">${escapeHtml(title)}</h3>
        <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 close-modal-btn">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div class="px-6 py-5 text-sm text-slate-600">
        ${contentHtml}
      </div>
      <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
        <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg cancel-modal-btn">
          ${escapeHtml(cancelText)}
        </button>
        <button type="button" class="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg confirm-modal-btn">
          ${escapeHtml(confirmText)}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);
  activeModal = modalOverlay;

  const closeBtn = modalOverlay.querySelector('.close-modal-btn');
  const cancelBtn = modalOverlay.querySelector('.cancel-modal-btn');
  const confirmBtn = modalOverlay.querySelector('.confirm-modal-btn');

  const handleClose = () => closeModal();

  closeBtn.addEventListener('click', handleClose);
  cancelBtn.addEventListener('click', handleClose);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  confirmBtn.addEventListener('click', async () => {
    if (onConfirm) {
      await onConfirm();
    }
    closeModal();
  });
}

export function closeModal() {
  if (activeModal && activeModal.parentNode) {
    activeModal.parentNode.removeChild(activeModal);
    activeModal = null;
  }
}
