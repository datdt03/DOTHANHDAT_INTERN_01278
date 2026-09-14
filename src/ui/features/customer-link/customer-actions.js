/**
 * Customer Mobile View Actions
 */

import { approveQuote } from '../../mocks/mock-api.js';
import { showToast } from '../../shared/components/toast.js';
import { showModal } from '../../shared/components/modal.js';
import { formatVND } from '../../shared/utils/format.js';

export function setupCustomerActions(container, order, onApproved) {
  const approveBtn = container.querySelector('#btn-customer-approve');
  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      const quoteTotal = order.quoteVersions?.[0]?.finalTotal || 2707500;

      showModal({
        title: 'Confirm repair approval',
        contentHtml: `
          <div class="space-y-2.5 text-xs text-slate-700">
            <p>You <strong>${order.customer.name}</strong> confirm that you approve the repair plan and cost:</p>
            <div class="p-3 bg-sky-50 rounded-xl border border-sky-200">
              <div class="flex justify-between font-bold text-slate-900 text-sm">
                <span>Total chi phí duyệt:</span>
                <span class="text-sky-800 font-mono">${formatVND(quoteTotal)}</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-1">Dự kiến completed: 17:00 - 13/09/2026</div>
            </div>
            <p class="text-[11px] text-slate-500">After confirmation, the technician will begin the repair.</p>
          </div>
        `,
        confirmText: 'Đồng ý & Bắt đầu sửa',
        cancelText: 'Xem lại',
        onConfirm: async () => {
          await approveQuote(order.id, `${order.customer.name} (Xác thực qua Link Web)`);
          showToast('Quotation approved successfully. Thank you from Minh Tâm Care.', 'success', 4000);
          onApproved();
        }
      });
    });
  }
}


