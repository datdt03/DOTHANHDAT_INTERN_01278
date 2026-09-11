/**
 * Order Detail Condition & Diagnosis Renderer
 */

import { escapeHtml } from '../../shared/utils/dom.js';

export function renderConditionAndDiagnosis(order) {
  const photos = order.intakePhotos || [];
  const diagnosis = order.diagnosis || {
    hardwareDisplay: 'Đang kiểm tra.',
    powerAndFeatures: 'Đang đo đạc.',
    proposedSolution: ['Đang đề xuất phương án.'],
    checkedItemsCount: 14
  };

  return `
    <!-- Photo Evidence Section -->
    <div class="rf-card p-4 mb-5">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sky-700 text-[18px]">photo_camera</span>
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Minh chứng hình ảnh tiếp nhận máy</h2>
        </div>
        <span class="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
          ${photos.length} ảnh đạt chuẩn
        </span>
      </div>

      <div class="photo-evidence-grid">
        ${photos.map(p => `
          <div class="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs group">
            <div class="relative h-36 bg-slate-100 overflow-hidden">
              <img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"/>
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold">
                ${escapeHtml(p.tag)}
              </span>
            </div>
            <div class="p-2.5">
              <div class="text-xs font-bold text-slate-800 truncate">${escapeHtml(p.title)}</div>
              <div class="text-[11px] text-slate-500 font-medium mt-0.5 truncate">${escapeHtml(p.subtitle)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="mt-3.5 p-3 rounded-xl bg-sky-50/50 border border-sky-100 flex items-center gap-2.5 text-xs text-slate-700">
        <span class="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
        <span><strong>Tình trạng ốc & niêm phong:</strong> ${escapeHtml(order.device.sealStatus || '2 ốc đáy hình sao Pentalobe còn nguyên tem. Khách xác nhận thiết bị chưa từng qua sửa chữa tại cửa hàng thứ ba.')}</span>
      </div>
    </div>

    <!-- Technical Diagnosis Section -->
    <div class="rf-card p-5 mb-5">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sky-700 text-[20px]">psychology</span>
          <div>
            <h2 class="text-sm font-bold text-slate-900">Kết luận chẩn đoán kỹ thuật</h2>
            <p class="text-[11px] text-slate-500">Phụ trách: <strong class="text-slate-800">${escapeHtml(order.technicianName)}</strong></p>
          </div>
        </div>
        <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Đã kiểm ${diagnosis.checkedItemsCount || 14} mục
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hiện trạng phần cứng hiển thị</div>
          <p class="text-slate-700 leading-relaxed">${escapeHtml(diagnosis.hardwareDisplay)}</p>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nguồn chính & chức năng phụ trợ</div>
          <p class="text-slate-700 leading-relaxed">${escapeHtml(diagnosis.powerAndFeatures)}</p>
        </div>
      </div>

      <div class="mt-4 p-3.5 rounded-xl bg-sky-50/50 border border-sky-200 text-xs">
        <div class="font-bold text-sky-900 mb-2 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[17px] text-sky-700">handyman</span>
          Phương án xử lý đề xuất:
        </div>
        <ul class="space-y-1.5 text-slate-700 pl-4 list-disc marker:text-sky-600">
          ${diagnosis.proposedSolution.map(sol => `<li>${escapeHtml(sol)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}
