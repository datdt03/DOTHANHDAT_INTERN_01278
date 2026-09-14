/**
 * Customer Mobile View Renderer
 */

import { formatVND, escapeHtml } from '../../shared/utils/format.js';
import { renderCustomerQuoteCard } from './customer-render-quote.js';

export function renderCustomerMobileView(order) {
  const isApproved = order.status === 'approved';
  const isRejected = order.status === 'rejected';
  const quoteData = order.quoteVersions?.[0] || {
    version: 'v1.0',
    items: [],
    subtotal: 2850000,
    discount: 142500,
    finalTotal: 2707500
  };

  return `
    <div class="customer-mobile-container pb-28">
      <!-- Top Mobile Header -->
      <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <a href="#/orders/${order.id}" class="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100" title="Trở lại interface nhân viên">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </a>
          <div>
            <div class="flex items-center gap-1">
              <span class="font-bold text-sky-800 text-sm">RepairFlow</span>
              <span class="material-symbols-outlined text-emerald-600 text-[15px]">verified</span>
            </div>
            <div class="text-[10px] text-slate-500 font-medium">Online quotation</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a href="tel:19008899" class="h-8 px-3 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center gap-1 text-xs font-semibold">
            <span class="material-symbols-outlined text-[16px]">call</span>
            <span>Hỗ trợ</span>
          </a>
        </div>
      </header>

      <!-- Main Body Content -->
      <div class="p-4 space-y-4">
        <!-- Card 1: Overview & Device -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-xs tracking-wide">
              #${escapeHtml(order.id)}
            </span>
            ${isApproved ? `
              <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                Repair approved
              </span>
            ` : isRejected ? `
              <span class="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-semibold text-xs flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-rose-600"></span>
                Customer rejected repair
              </span>
            ` : `
              <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-semibold text-xs flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Waiting for your quotation approval
              </span>
            `}
          </div>

          <div class="flex items-start justify-between gap-3">
            <div>
              <h1 class="text-lg font-bold text-slate-900">${escapeHtml(order.device.name)}</h1>
              <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(order.device.specs)}</p>
            </div>
            <div class="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-[24px]">smartphone</span>
            </div>
          </div>

          <div class="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">person</span> Customer:</span>
              <strong class="text-slate-800">${escapeHtml(order.customer.name)} (${escapeHtml(order.customer.maskedPhone)})</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> Intake:</span>
              <span>09:10 - 11/09/2026</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">event_available</span> Dự kiến xong:</span>
              <strong class="text-sky-800">17:00 - 13/09/2026</strong>
            </div>
          </div>
        </div>

        <!-- 4-step Stepper -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div class="flex items-center justify-between text-center relative px-2">
            <!-- step 1 -->
            <div class="flex flex-col items-center gap-1 z-10">
              <div class="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-bold">
                <span class="material-symbols-outlined text-[14px]">check</span>
              </div>
              <span class="text-[10.5px] font-semibold text-slate-800">Intake</span>
            </div>
            <!-- step 2 -->
            <div class="flex flex-col items-center gap-1 z-10">
              <div class="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-bold">
                <span class="material-symbols-outlined text-[14px]">check</span>
              </div>
              <span class="text-[10.5px] font-semibold text-slate-800">Diagnosis</span>
            </div>
            <!-- step 3 -->
            <div class="flex flex-col items-center gap-1 z-10">
              <div class="w-6 h-6 rounded-full ${isApproved ? 'bg-sky-700 text-white' : 'bg-amber-500 text-white ring-4 ring-amber-100'} flex items-center justify-center text-xs font-bold">
                ${isApproved ? '<span class="material-symbols-outlined text-[14px]">check</span>' : '3'}
              </div>
              <span class="text-[10.5px] font-bold ${isApproved ? 'text-slate-800' : 'text-amber-800'}">Quote approval</span>
            </div>
            <!-- step 4 -->
            <div class="flex flex-col items-center gap-1 z-10">
              <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                4
              </div>
              <span class="text-[10.5px] font-medium text-slate-500">Nhận máy</span>
            </div>
          </div>
        </div>

        <!-- Intake Photos -->
        <div class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Hình ảnh device lúc nhận</h2>
            <span class="text-[11px] text-slate-400">2 ảnh chụp macro</span>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div class="bg-white rounded-xl overflow-hidden border border-slate-200">
              <img src="${order.intakePhotos?.[0]?.url || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&h=300&fit=crop'}" class="w-full h-32 object-cover" alt="Mặt trước"/>
              <div class="p-2 text-[11px]">
                <strong class="text-sky-800 block uppercase">Mặt trước</strong>
                <span class="text-slate-500 text-[10.5px]">Nứt góc trên phải, liệt dải cảm ứng</span>
              </div>
            </div>
            <div class="bg-white rounded-xl overflow-hidden border border-slate-200">
              <img src="${order.intakePhotos?.[1]?.url || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}" class="w-full h-32 object-cover" alt="Mặt sau"/>
              <div class="p-2 text-[11px]">
                <strong class="text-sky-800 block uppercase">Nắp lưng & Khung</strong>
                <span class="text-slate-500 text-[10.5px]">Kính lưng đẹp, camera nguyên vẹn</span>
              </div>
            </div>
          </div>
          <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-800">
            <span class="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            <span>Ốc đáy and tem niêm phong remaining nguyên vẹn 100%.</span>
          </div>
        </div>

        <!-- Diagnosis Details -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 text-xs">
          <h2 class="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <span class="material-symbols-outlined text-sky-700 text-[18px]">psychology</span>
            Technical diagnosis conclusion
          </h2>
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-400">Condition ghi nhận</div>
            <p class="text-slate-700 mt-1 leading-relaxed">Màn hình va đập nứt kính ngoài and chập mạch ma trận cảm ứng OLED bên trong. Mainboard, FaceID, pin and camera hoạt động bình thường, không ẩm nước.</p>
          </div>
          <div class="pt-2 border-t border-slate-100">
            <div class="text-[10px] uppercase font-bold text-slate-400">Giải pháp kỹ thuật</div>
            <p class="text-slate-700 mt-1 leading-relaxed">Thay thế cụm màn hình OLED Zin bóc máy chính hãng Apple, nạp lại code True Tone gốc, vệ sinh bo mạch and ép lại ron kháng nước chuẩn IP68.</p>
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">HN</div>
            <div>
              <div class="font-bold text-slate-800">Trần Hoàng Nam</div>
              <div class="text-[10.5px] text-slate-400">Kỹ thuật viên Trưởng phần cứng · 8 năm kinh nghiệm</div>
            </div>
          </div>
        </div>

        <!-- Quote Details Breakdown & Commitments -->
        ${renderCustomerQuoteCard(quoteData)}
      </div>

      <!-- Sticky Bottom Action Bar -->
      <div class="customer-bottom-bar">
        <a href="tel:19008899" class="rf-btn rf-btn-outline flex-1 py-3 text-xs justify-center">
          <span class="material-symbols-outlined text-[18px]">call</span> Tư vấn
        </a>
        ${isApproved ? `
          <button type="button" disabled class="rf-btn rf-btn-success flex-2 py-3 text-xs justify-center opacity-90 cursor-not-allowed">
            <span class="material-symbols-outlined text-[18px]">check_circle</span> Repair approved
          </button>
        ` : isRejected ? `
          <button type="button" disabled class="rf-btn rf-btn-danger flex-2 py-3 text-xs justify-center opacity-90 cursor-not-allowed">
            <span class="material-symbols-outlined text-[18px]">cancel</span> Completed reject sửa
          </button>
        ` : `
          <button type="button" id="btn-customer-approve" class="rf-btn rf-btn-primary flex-2 py-3 text-xs justify-center">
            <span class="material-symbols-outlined text-[18px]">thumb_up</span> Duyệt sửa (${formatVND(quoteData.finalTotal)})
          </button>
        `}
      </div>
    </div>
  `;
}


