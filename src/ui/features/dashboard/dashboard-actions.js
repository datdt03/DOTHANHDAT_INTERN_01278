/**
 * Dashboard Actions
 */

import { fetchOrders } from '../../mocks/mock-api.js';
import { showToast } from '../../shared/components/toast.js';
import { showModal } from '../../shared/components/modal.js';
import { renderOrdersTable } from './dashboard-render.js';

export function setupDashboardActions(container) {
  // Export Report Button
  const exportBtn = container.querySelector('#btn-export-report');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showToast('Đang tạo báo cáo vận hành định dạng Excel/PDF...', 'info');
      setTimeout(() => {
        showToast('Đã xuất báo cáo ca làm việc thành công!', 'success');
      }, 700);
    });
  }

  // Create Order Button
  const createOrderBtn = container.querySelector('#btn-create-order');
  if (createOrderBtn) {
    createOrderBtn.addEventListener('click', () => {
      showModal({
        title: 'Tạo phiếu sửa chữa mới',
        contentHtml: `
          <div class="space-y-3 text-xs text-slate-600">
            <p>Quy trình SOP tiếp nhận gồm 3 bước bắt buộc:</p>
            <ol class="list-decimal pl-5 space-y-1 font-medium text-slate-700">
              <li>Nhập thông tin khách hàng hoặc tra cứu số điện thoại cũ.</li>
              <li>Ghi nhận thiết bị, số IMEI/Serial và triệu chứng lỗi.</li>
              <li>Chụp tối thiểu 2-4 ảnh hiện trạng và kiểm tra niêm phong ốc đáy.</li>
            </ol>
            <div class="p-2.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 mt-2">
              💡 <em>Trong bản demo, phiếu mẫu <strong>#RF-20260911-001</strong> đã được nạp sẵn dữ liệu chuẩn để kiểm nghiệm toàn bộ quy trình.</em>
            </div>
          </div>
        `,
        confirmText: 'Mở phiếu mẫu',
        cancelText: 'Đóng',
        onConfirm: () => {
          window.location.hash = '#/orders/RF-20260911-001';
        }
      });
    });
  }

  // Filter Buttons
  const filterBtns = container.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const filter = e.currentTarget.dataset.filter;
      const orders = await fetchOrders({ filter });
      const tableWrapper = container.querySelector('#dashboard-table-wrapper');
      if (tableWrapper) {
        tableWrapper.innerHTML = renderOrdersTable(orders, filter);
        setupTableInteractions(tableWrapper);
      }
    });
  });

  const tableWrapper = container.querySelector('#dashboard-table-wrapper');
  if (tableWrapper) {
    setupTableInteractions(tableWrapper);
  }
}

function setupTableInteractions(tableWrapper) {
  const rows = tableWrapper.querySelectorAll('.order-row');
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const orderId = row.dataset.orderId;
      if (orderId) {
        window.location.hash = `#/orders/${orderId}`;
      }
    });
  });
}
