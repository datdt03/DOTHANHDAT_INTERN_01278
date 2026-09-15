/**
 * Customer Quote & Commitment Renderer
 */

import { formatVND, escapeHtml } from '../../shared/utils/format.js';

export function renderCustomerQuoteCard(quoteData) {
  return `
    <!-- Quote Details Breakdown -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 text-xs">
      <div class="flex items-center justify-between pb-2 border-b border-slate-100">
        <h2 class="font-bold text-slate-900 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sky-700 text-[18px]">receipt_long</span>
          Quotation details
        </h2>
        <span class="text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Phiên bản ${escapeHtml(quoteData.version)}</span>
      </div>

      <div class="space-y-3">
        <div class="flex justify-between items-start pb-2 border-b border-slate-50">
          <div>
            <strong class="text-slate-800 block">Cụm màn hình OLED Zin bóc máy</strong>
            <span class="text-[10.5px] text-emerald-700 font-medium">🛡️ Standard six-month one-for-one warranty</span>
          </div>
          <span class="font-bold font-mono text-slate-900">2.650.000 đ</span>
        </div>

        <div class="flex justify-between items-start pb-2 border-b border-slate-50">
          <div>
            <strong class="text-slate-800 block">Công tháo lắp & Nạp True Tone</strong>
            <span class="text-[10.5px] text-slate-500">Đồng bộ cảm biến gốc theo máy</span>
          </div>
          <span class="font-bold font-mono text-slate-900">200.000 đ</span>
        </div>

        <div class="flex justify-between items-start">
          <div>
            <strong class="text-slate-800 block">Vệ sinh máy & Ép ron kháng nước</strong>
            <span class="text-[10.5px] text-emerald-700 font-semibold">Hỗ trợ độc quyền tại Minh Tâm</span>
          </div>
          <div>
            <span class="font-bold text-emerald-600">0 đ</span>
            <span class="text-[10px] text-slate-400 line-through block text-right">150.000 đ</span>
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 space-y-1 text-slate-600">
        <div class="flex justify-between">
          <span>Total tạm tính:</span>
          <span class="font-mono text-slate-800 font-semibold">2.850.000 đ</span>
        </div>
        <div class="flex justify-between text-amber-700">
          <span>Ưu completedi thành viên VIP (5%):</span>
          <span class="font-mono font-bold">-142.500 đ</span>
        </div>
        <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline">
          <span class="font-bold text-slate-900">TỔNG THANH TOÁN:</span>
          <span class="text-lg font-extrabold text-sky-800 font-mono">${formatVND(quoteData.finalTotal)}</span>
        </div>
        <p class="text-[10px] text-slate-400 text-right">Completed bao gồm VAT & công thay</p>
      </div>
    </div>

    <!-- Commitments -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
      <div class="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
        <span class="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
        Cam kết từ hệ thống Minh Tâm
      </div>
      <div class="flex items-start gap-2 text-slate-600">
        <span class="material-symbols-outlined text-emerald-600 text-[16px] flex-shrink-0">check_circle</span>
        <p><strong>Genuine reclaimed part:</strong> As initially promised, with a six-month one-for-one touch warranty.</p>
      </div>
      <div class="flex items-start gap-2 text-slate-600">
        <span class="material-symbols-outlined text-emerald-600 text-[16px] flex-shrink-0">check_circle</span>
        <p><strong>Process transparency:</strong> Customers can follow the technician's work at the inspection bench.</p>
      </div>
      <div class="flex items-start gap-2 text-slate-600">
        <span class="material-symbols-outlined text-emerald-600 text-[16px] flex-shrink-0">check_circle</span>
        <p><strong>Bồi hoàn 100%:</strong> Hoàn tiền không điều kiện nếu phát hiện linh kiện tráo đổi hoặc không chuẩn zin.</p>
      </div>
    </div>
  `;
}


