/**
 * Dashboard Section Renderer (Header, KPIs, Pipeline, Right Column)
 */

import { formatVND, escapeHtml } from '../../shared/utils/format.js';
export { renderOrdersTable } from './render-table.js';

export function renderDashboardHeader() {
  return `
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Tổng quan điều hành</h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <span class="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>
            Live Xưởng
          </span>
        </div>
        <p class="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
          <span class="material-symbols-outlined text-[15px]">calendar_today</span>
          Thứ Sáu, 11/09/2026 · 182 Lê Duẩn, Quận 1
        </p>
      </div>
      <div class="flex items-center gap-2.5">
        <button type="button" id="btn-export-report" class="rf-btn rf-btn-outline text-xs">
          <span class="material-symbols-outlined text-[17px]">download</span> Xuất báo cáo
        </button>
        <button type="button" id="btn-create-order" class="rf-btn rf-btn-primary text-xs">
          <span class="material-symbols-outlined text-[17px]">add</span> Tạo phiếu sửa chữa
        </button>
      </div>
    </div>
  `;
}

export function renderKpis(kpis) {
  return `
    <div class="kpi-grid mb-6">
      <!-- KPI 1: Đang xử lý -->
      <div class="rf-card p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang xử lý</span>
          <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Tiến độ tốt</span>
        </div>
        <div class="my-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-slate-900">${kpis.processing.count}</span>
          <span class="text-xs text-slate-500 font-medium">phiếu</span>
          <span class="text-xs font-bold text-emerald-600 ml-auto flex items-center">
            <span class="material-symbols-outlined text-[14px]">arrow_upward</span> ${kpis.processing.todayDelta} hôm nay
          </span>
        </div>
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Công suất xưởng</span>
          <span class="font-bold text-slate-700">${kpis.processing.capacity}</span>
        </div>
      </div>

      <!-- KPI 2: Chờ duyệt giá -->
      <div class="rf-card p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Chờ duyệt giá</span>
          <span class="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Nhắc hẹn</span>
        </div>
        <div class="my-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-slate-900">${String(kpis.waitingApproval.count).padStart(2, '0')}</span>
          <span class="text-xs text-slate-500 font-medium">phiếu</span>
          <span class="text-xs font-bold text-amber-600 ml-auto">${kpis.waitingApproval.urgent} phiếu > 4h</span>
        </div>
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng báo giá</span>
          <span class="font-bold text-slate-700">${formatVND(kpis.waitingApproval.totalValue)}</span>
        </div>
      </div>

      <!-- KPI 3: Sẵn sàng giao -->
      <div class="rf-card p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Sẵn sàng giao</span>
          <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Đã QC</span>
        </div>
        <div class="my-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-slate-900">${String(kpis.readyPickup.count).padStart(2, '0')}</span>
          <span class="text-xs text-slate-500 font-medium">máy</span>
          <span class="text-xs font-medium text-slate-500 ml-auto">${kpis.readyPickup.afternoonCount} hẹn chiều</span>
        </div>
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Thu hộ (COD)</span>
          <span class="font-bold text-emerald-600">${formatVND(kpis.readyPickup.codValue)}</span>
        </div>
      </div>

      <!-- KPI 4: Phiếu quá hạn -->
      <div class="rf-card p-4 flex flex-col justify-between border-rose-200 bg-rose-50/30">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-rose-700 uppercase tracking-wider">Phiếu quá hạn</span>
          <span class="text-[11px] font-semibold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full">Khẩn cấp</span>
        </div>
        <div class="my-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-rose-700">${String(kpis.overdue.count).padStart(2, '0')}</span>
          <span class="text-xs text-rose-600 font-medium">trễ hẹn</span>
          <span class="text-xs font-bold text-rose-700 ml-auto flex items-center gap-1">
            <span class="material-symbols-outlined text-[15px]">warning</span> Ưu tiên
          </span>
        </div>
        <div class="pt-2 border-t border-rose-100 flex items-center justify-between text-xs text-rose-700">
          <span class="truncate">Lý do: ${escapeHtml(kpis.overdue.reason)}</span>
        </div>
      </div>
    </div>
  `;
}

export function renderPipeline(pipeline) {
  return `
    <div class="rf-card p-5 mb-6">
      <div class="flex items-center justify-between mb-3.5">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sky-700 text-[20px]">timeline</span>
          <h2 class="text-sm font-bold text-slate-800">Tiến trình luồng sửa chữa (Pipeline)</h2>
        </div>
        <span class="text-xs text-slate-500 font-medium">29 phiếu trong quy trình</span>
      </div>
      <div class="pipeline-track">
        ${pipeline.map(item => `
          <div class="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col hover:border-sky-300 transition-colors">
            <div class="flex items-center justify-between text-[11px] text-slate-500 font-bold">
              <span>BƯỚC ${item.step}</span>
              <span class="w-1.5 h-1.5 rounded-full ${item.step === 3 ? 'bg-amber-500' : item.step === 6 ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
            </div>
            <div class="text-xs font-bold text-slate-800 mt-1 truncate">${escapeHtml(item.title)}</div>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-base font-extrabold text-sky-800">${item.count}</span>
              <span class="text-[11px] text-slate-500 font-medium">${escapeHtml(item.subtext)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderDashboardRightCol(technicians, activities, warranty) {
  return `
    <div class="flex flex-col gap-5">
      <!-- Technicians -->
      <div class="rf-card p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-sky-700">engineering</span>
            Kỹ thuật viên trực xưởng
          </h2>
          <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">3 KTV trực</span>
        </div>
        <div class="space-y-3">
          ${technicians.map(t => `
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div class="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>${escapeHtml(t.name)}</span>
                <span class="text-[11px] px-2 py-0.5 rounded border ${t.statusClass}">${t.statusLevel}</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-1">${escapeHtml(t.specialty)}</div>
              <div class="text-[11px] font-medium text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/60">${escapeHtml(t.breakdown)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="rf-card p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-sky-700">history</span>
            Hoạt động mới
          </h2>
          <button type="button" class="text-[11px] font-semibold text-sky-700 hover:underline">Xem tất cả</button>
        </div>
        <div class="space-y-3 text-xs">
          ${activities.map(act => `
            <div class="relative pl-3.5 border-l-2 border-sky-600">
              <div class="text-[11px] text-slate-400 font-medium">${act.time} · ${act.relative}</div>
              <div class="text-slate-700 mt-0.5">${act.content}</div>
              <div class="text-[11px] text-slate-500 mt-0.5 font-medium">${act.meta}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Warranty Metric -->
      <div class="rf-card p-4 bg-emerald-50/40 border-emerald-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
            <span class="material-symbols-outlined text-[20px]">verified</span>
          </span>
          <div>
            <div class="text-xs font-bold text-slate-800">Bảo hành linh kiện ${escapeHtml(warranty.month)}</div>
            <div class="text-[11px] text-emerald-700 font-semibold">Tỷ lệ đổi trả tái sửa: ${warranty.rate} (${warranty.rating})</div>
          </div>
        </div>
        <span class="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
      </div>
    </div>
  `;
}
