/**
 * Order Detail Quote Renderer
 */

import { formatVND, escapeHtml } from '../../shared/utils/format.js';

export function renderQuoteTable(order) {
  const currentVerData = (order.quoteVersions && order.quoteVersions[0]) || {
    version: order.quoteVersion || 'v1.0',
    items: [],
    subtotal: 2850000,
    discount: 142500,
    finalTotal: 2707500,
    warrantyPolicy: 'Six-month one-for-one touch warranty. Three-month display-color warranty.'
  };

  const isApproved = order.status === 'approved';

  return `
    <div class="rf-card p-5 mb-5">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-900">Repair quotation ${escapeHtml(currentVerData.version)}</h2>
            <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              ${isApproved ? 'Approved by customer' : 'Quotation published — Read only'}
            </span>
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5">This quotation has been sent to the customer and cannot be edited directly to preserve the audit trail.</p>
        </div>
        <button type="button" id="btn-create-v2-inline" class="rf-btn rf-btn-outline text-xs text-sky-800 border-sky-300 hover:bg-sky-50">
          <span class="material-symbols-outlined text-[16px]">edit_document</span> Create ${order.quoteVersion === 'v1.0' ? 'v2.0' : 'a new version'} to edit
        </button>
      </div>

      <!-- Quotation Items Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10.5px] border-b border-slate-200">
            <tr>
              <th class="py-2.5 px-3 w-12 text-center">STT</th>
              <th class="py-2.5 px-4">HẠNG MỤC DỊCH VỤ / LINH KIỆN</th>
              <th class="py-2.5 px-3 text-center">WARRANTY</th>
              <th class="py-2.5 px-3 text-center w-12">SL</th>
              <th class="py-2.5 px-3 text-right">UNIT PRICE</th>
              <th class="py-2.5 px-4 text-right">THÀNH TIỀN</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            ${(currentVerData.items || []).map((item, idx) => `
              <tr class="hover:bg-slate-50/50">
                <td class="py-3 px-3 text-center font-mono text-slate-400 font-bold">${item.stt || `0${idx + 1}`}</td>
                <td class="py-3 px-4">
                  <div class="font-bold text-slate-900">${escapeHtml(item.name)}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">${escapeHtml(item.desc)}</div>
                </td>
                <td class="py-3 px-3 text-center">
                  <span class="px-2 py-0.5 rounded text-[11px] font-bold ${item.isGift ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-50 text-sky-800 border border-sky-200'}">
                    ${escapeHtml(item.warranty)}
                  </span>
                </td>
                <td class="py-3 px-3 text-center font-bold text-slate-800">${item.quantity}</td>
                <td class="py-3 px-3 text-right font-medium text-slate-700 font-mono">${formatVND(item.unitPrice)}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                  ${item.isGift ? '<span class="text-emerald-600">0 VND</span> <span class="text-[10px] text-slate-400 line-through">150,000 VND</span>' : formatVND(item.totalPrice)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Financial Calculation & Commitments -->
      <div class="mt-5 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div class="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sky-700 text-[16px]">verified_user</span>
            Warranty policy:
          </div>
          <p class="text-slate-600 leading-relaxed">${escapeHtml(currentVerData.warrantyPolicy || 'Six-month one-for-one touch warranty. Three-month display-color warranty. Not applicable to impact, pressure, or liquid damage.')}</p>
        </div>

        <div class="space-y-2 text-slate-600 font-medium">
          <div class="flex justify-between items-center">
            <span>Subtotal for parts and labor:</span>
            <span class="font-bold text-slate-800 font-mono">${formatVND(currentVerData.subtotal)}</span>
          </div>
          <div class="flex justify-between items-center text-amber-700">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px]">stars</span>
              VIP member discount (5%):
            </span>
            <span class="font-bold font-mono">-${formatVND(currentVerData.discount)}</span>
          </div>
          <div class="flex justify-between items-center text-slate-500">
            <span>VAT (8%):</span>
            <span class="font-medium">Included</span>
          </div>
          <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span class="text-sm font-bold text-slate-900">Payment total:</span>
            <span class="text-xl font-extrabold text-sky-800 font-mono">${formatVND(currentVerData.finalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

