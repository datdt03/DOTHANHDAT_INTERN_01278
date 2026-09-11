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
        title: 'Xác nhận đồng ý sửa chữa',
        contentHtml: `
          <div class="space-y-2.5 text-xs text-slate-700">
            <p>Quý khách <strong>${order.customer.name}</strong> xác nhận đồng ý với phương án và chi phí sửa chữa:</p>
            <div class="p-3 bg-sky-50 rounded-xl border border-sky-200">
              <div class="flex justify-between font-bold text-slate-900 text-sm">
                <span>Tổng chi phí duyệt:</span>
                <span class="text-sky-800 font-mono">${formatVND(quoteTotal)}</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-1">Dự kiến hoàn tất: 17:00 - 13/09/2026</div>
            </div>
            <p class="text-[11px] text-slate-500">Sau khi xác nhận, kỹ thuật viên sẽ tiến hành xử lý ngay.</p>
          </div>
        `,
        confirmText: 'Đồng ý & Bắt đầu sửa',
        cancelText: 'Xem lại',
        onConfirm: async () => {
          await approveQuote(order.id, `${order.customer.name} (Xác thực qua Link Web)`);
          showToast('Quý khách đã duyệt báo giá thành công! Minh Tâm Care xin cảm ơn.', 'success', 4000);
          onApproved();
        }
      });
    });
  }
}
