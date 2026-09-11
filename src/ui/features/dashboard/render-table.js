/**
 * Dashboard Orders Table Renderer
 */

import { renderStatusBadge } from '../../shared/components/badge.js';
import { escapeHtml } from '../../shared/utils/dom.js';

export function renderOrdersTable(orders, currentFilter = 'all') {
  return `
    <div class="rf-card overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span class="material-symbols-outlined text-sky-700 text-[18px]">assignment</span>
            Phiếu sửa chữa cần xử lý ưu tiên
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Danh sách các phiếu cần cập nhật trạng thái hoặc trễ cam kết</p>
        </div>
        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button type="button" class="filter-btn px-3 py-1 rounded-md transition-all ${currentFilter === 'all' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-filter="all">
            Tất cả (${orders.length})
          </button>
          <button type="button" class="filter-btn px-3 py-1 rounded-md transition-all ${currentFilter === 'waiting' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-filter="waiting">
            Chờ duyệt (1)
          </button>
          <button type="button" class="filter-btn px-3 py-1 rounded-md transition-all ${currentFilter === 'overdue' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-filter="overdue">
            Quá hạn (1)
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10.5px] border-b border-slate-100">
            <tr>
              <th class="py-3 px-4">MÃ PHIẾU</th>
              <th class="py-3 px-4">KHÁCH HÀNG</th>
              <th class="py-3 px-4">THIẾT BỊ</th>
              <th class="py-3 px-4">TRẠNG THÁI XỬ LÝ</th>
              <th class="py-3 px-4">PHỤ TRÁCH</th>
              <th class="py-3 px-4">HẠN DỰ KIẾN</th>
              <th class="py-3 px-4 text-right">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            ${orders.map(order => `
              <tr class="hover:bg-sky-50/30 transition-colors cursor-pointer order-row" data-order-id="${escapeHtml(order.id)}">
                <td class="py-3 px-4">
                  <span class="font-bold text-sky-700 hover:underline">#${escapeHtml(order.id)}</span>
                  <div class="text-[11px] text-slate-400 font-normal truncate max-w-[140px]">${escapeHtml(order.device.issueReported)}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-semibold text-slate-800">${escapeHtml(order.customer.name)}</div>
                  <div class="text-[11px] text-slate-400">${escapeHtml(order.customer.maskedPhone)}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-medium text-slate-800">${escapeHtml(order.device.name)}</div>
                  <div class="text-[11px] text-slate-400 truncate max-w-[120px]">${escapeHtml(order.device.specs)}</div>
                </td>
                <td class="py-3 px-4">
                  ${renderStatusBadge(order.status)}
                </td>
                <td class="py-3 px-4">
                  <span class="font-medium text-slate-700">${escapeHtml(order.technicianName.split('(')[0].trim())}</span>
                </td>
                <td class="py-3 px-4 text-slate-600 font-medium">
                  ${order.status === 'overdue' ? '<span class="text-rose-600 font-bold">Hôm qua (Trễ)</span>' : '13/09/2026'}
                </td>
                <td class="py-3 px-4 text-right">
                  <a href="#/orders/${escapeHtml(order.id)}" class="rf-btn rf-btn-outline text-[11px] py-1 px-2.5">
                    Xem chi tiết
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <span>Hiển thị ${orders.length} phiếu</span>
        <div class="flex items-center gap-1.5">
          <button type="button" class="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs">Trước</button>
          <span class="px-2 py-0.5 rounded bg-sky-700 text-white font-bold text-xs">1</span>
          <button type="button" class="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs">Sau</button>
        </div>
      </div>
    </div>
  `;
}
