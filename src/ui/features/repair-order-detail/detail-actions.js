/**
 * Order Detail Event Handlers & Actions
 */

import { showToast } from '../../shared/components/toast.js';
import { showModal } from '../../shared/components/modal.js';
import { approveQuote, rejectQuote, createQuoteVersion } from '../../mocks/mock-api.js';

export function setupDetailActions(container, order, onOrderUpdated) {
  const customerLink = `${window.location.origin}${window.location.pathname}#/customer/${order.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customerLink).then(() => {
      showToast('Đã sao chép link khách hàng vào bộ nhớ tạm!', 'success');
    }).catch(() => {
      showToast('Vui lòng sao chép link trực tiếp trong ô nhập!', 'warning');
    });
  };

  // Copy Link Buttons
  const copyBtnTop = container.querySelector('#btn-copy-customer-link');
  if (copyBtnTop) copyBtnTop.addEventListener('click', copyToClipboard);

  const copyBtnInline = container.querySelector('#btn-copy-link-inline');
  if (copyBtnInline) copyBtnInline.addEventListener('click', copyToClipboard);

  // Resend ZNS
  const resendBtn = container.querySelector('#btn-resend-zns');
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      showToast('Đang gửi tin Zalo ZNS và SMS tới khách...', 'info');
      setTimeout(() => {
        showToast(`Đã gửi lại link duyệt báo giá tới ${order.customer.phone} thành công!`, 'success');
      }, 600);
    });
  }

  // Approve By Phone
  const phoneApproveBtn = container.querySelector('#btn-phone-approve');
  if (phoneApproveBtn) {
    phoneApproveBtn.addEventListener('click', () => {
      showModal({
        title: 'Xác nhận khách duyệt qua điện thoại',
        contentHtml: `
          <p class="text-xs text-slate-600 mb-2">Bạn đang xác nhận thay cho khách hàng <strong>${order.customer.name}</strong> rằng khách đã đồng ý toàn bộ chi phí sửa chữa qua cuộc gọi ghi âm.</p>
          <div class="p-2.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
            ⚠️ Trạng thái sẽ chuyển ngay sang <strong>Đã duyệt</strong> và mở khóa công đoạn sửa chữa.
          </div>
        `,
        confirmText: 'Xác nhận duyệt',
        cancelText: 'Hủy',
        onConfirm: async () => {
          await approveQuote(order.id, 'Nhân viên tư vấn (Qua cuộc gọi điện thoại)');
          showToast('Đã ghi nhận phê duyệt báo giá từ khách hàng!', 'success');
          onOrderUpdated();
        }
      });
    });
  }

  // Reject Repair
  const rejectBtn = container.querySelector('#btn-order-reject');
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      showModal({
        title: 'Xác nhận khách từ chối sửa chữa',
        contentHtml: `
          <p class="text-xs text-slate-600 mb-2">Vui lòng xác nhận khách hàng <strong>${order.customer.name}</strong> muốn hủy phiếu sửa chữa này.</p>
          <textarea id="modal-reject-reason" class="w-full p-2 border border-slate-300 rounded text-xs" placeholder="Nhập lý do từ chối (ví dụ: Chi phí cao, đổi ý mua máy mới...)">Khách không đồng ý chi phí thay linh kiện Zin</textarea>
        `,
        confirmText: 'Ghi nhận từ chối',
        cancelText: 'Đóng',
        onConfirm: async () => {
          const reasonInput = document.querySelector('#modal-reject-reason');
          const reason = reasonInput ? reasonInput.value : 'Khách từ chối sửa chữa';
          await rejectQuote(order.id, reason);
          showToast('Đã cập nhật trạng thái phiếu: Khách từ chối sửa chữa.', 'warning');
          onOrderUpdated();
        }
      });
    });
  }

  // Create Quote Version v2.0
  const handleCreateV2 = () => {
    showModal({
      title: 'Tạo phiên bản báo giá mới',
      contentHtml: `
        <div class="space-y-3 text-xs text-slate-600">
          <p>Khi tạo phiên bản báo giá mới, báo giá cũ sẽ được lưu trữ lịch sử để kiểm toán. Khách hàng sẽ nhận thông báo duyệt lại phiên bản mới.</p>
          <div>
            <label class="font-bold text-slate-700 block mb-1">Ghi chú thay đổi cho bản mới:</label>
            <textarea id="modal-quote-v2-notes" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs" rows="3" placeholder="Ví dụ: Giảm 100.000 đ hỗ trợ khách, thay đổi loại màn hình...">Điều chỉnh ưu đãi thêm cho khách hàng thân thiết.</textarea>
          </div>
        </div>
      `,
      confirmText: 'Phát hành bản mới',
      cancelText: 'Hủy',
      onConfirm: async () => {
        const notes = document.querySelector('#modal-quote-v2-notes')?.value || '';
        const currentItems = order.quoteVersions[0]?.items || [];
        await createQuoteVersion(order.id, currentItems, notes);
        showToast('Đã tạo phiên bản báo giá mới thành công!', 'success');
        onOrderUpdated();
      }
    });
  };

  const createQuoteBtnTop = container.querySelector('#btn-create-quote-version');
  if (createQuoteBtnTop) createQuoteBtnTop.addEventListener('click', handleCreateV2);

  const createQuoteBtnInline = container.querySelector('#btn-create-v2-inline');
  if (createQuoteBtnInline) createQuoteBtnInline.addEventListener('click', handleCreateV2);

  // Tab switching
  const tabBtns = container.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => {
        b.classList.remove('border-sky-700', 'text-sky-800');
        b.classList.add('border-transparent', 'text-slate-500');
      });
      e.currentTarget.classList.add('border-sky-700', 'text-sky-800');
      e.currentTarget.classList.remove('border-transparent', 'text-slate-500');

      const targetTab = e.currentTarget.dataset.tab;
      showToast(`Chuyển sang tab: ${e.currentTarget.innerText.trim()}`, 'info', 1200);
    });
  });
}
