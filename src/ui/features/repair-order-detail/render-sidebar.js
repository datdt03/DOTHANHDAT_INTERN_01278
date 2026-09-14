/**
 * Order Detail Sidebar Renderer (Feedback, Audit Log, Intake SOP)
 */

import { escapeHtml } from '../../shared/utils/dom.js';

export function renderDetailSidebar(order) {
  const isApproved = order.status === 'approved';
  const isRejected = order.status === 'rejected';
  const customerLink = `${window.location.origin}${window.location.pathname}#/customer/${order.id}`;

  return `
    <div class="flex flex-col gap-5">
      <!-- Customer Feedback Status Box -->
      <div class="rf-card p-4 border-amber-200 bg-white">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined ${isApproved ? 'text-emerald-600' : isRejected ? 'text-rose-600' : 'text-amber-600'} text-[20px]">
            ${isApproved ? 'thumb_up' : isRejected ? 'cancel' : 'contact_phone'}
          </span>
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Customer response status</h2>
        </div>

        ${isApproved ? `
          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 mb-3">
            <div class="font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">check_circle</span>
              Customer approved the quotation!
            </div>
            <p class="mt-1 text-[11px] text-emerald-700">The technician may repair according to the approved plan and parts.</p>
          </div>
        ` : isRejected ? `
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 mb-3">
            <div class="font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">cancel</span>
              Customer rejected the repair
            </div>
            <p class="mt-1 text-[11px] text-rose-700">Contact the customer to arrange return of the device in its original condition.</p>
          </div>
        ` : `
          <div class="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 mb-3">
            <div class="font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">hourglass_top</span>
              Waiting for customer quotation approval
            </div>
            <p class="mt-1 text-[11px] text-amber-800">The system automatically sends a ZNS and SMS message with the online approval link.</p>
          </div>
        `}

        <div class="mb-3">
          <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Direct quotation approval link</label>
          <div class="flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <input type="text" readonly value="${escapeHtml(customerLink)}" id="input-customer-link-val" class="text-xs bg-transparent text-slate-600 font-mono flex-1 outline-none truncate"/>
            <button type="button" id="btn-copy-link-inline" class="p-1 rounded text-sky-700 hover:bg-sky-100 transition-colors" title="Copy link">
              <span class="material-symbols-outlined text-[18px]">content_copy</span>
            </button>
          </div>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-600 mb-3.5">
          <span class="material-symbols-outlined text-sky-600 text-[18px]">visibility</span>
          <div>
            <div class="font-medium text-slate-700">Customer opened the quotation link</div>
            <div class="text-[10.5px] text-slate-400">Last viewed: ${escapeHtml(order.customerFeedback.lastViewedAt)}</div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="space-y-2">
          <button type="button" id="btn-resend-zns" class="rf-btn rf-btn-primary w-full text-xs py-2">
            <span class="material-symbols-outlined text-[16px]">send</span> Resend link via Zalo & SMS
          </button>
          ${!isApproved ? `
            <button type="button" id="btn-phone-approve" class="rf-btn rf-btn-outline w-full text-xs py-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
              <span class="material-symbols-outlined text-[16px]">check_circle</span> Customer approved by phone
            </button>
          ` : ''}
          ${!isRejected ? `
            <button type="button" id="btn-order-reject" class="rf-btn rf-btn-outline w-full text-xs py-2 text-rose-700 border-rose-300 hover:bg-rose-50">
              <span class="material-symbols-outlined text-[16px]">close</span> Customer rejected / Cancel repair
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Audit Log Timeline -->
      <div class="rf-card p-4">
        <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sky-700 text-[18px]">history</span>
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Activity log</h2>
          </div>
          <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Real time</span>
        </div>
        <div class="space-y-3.5 text-xs">
          ${(order.timeline || []).map(tl => `
            <div class="relative pl-3.5 border-l-2 border-sky-600">
              <div class="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                <span>${escapeHtml(tl.title)}</span>
                <span class="text-slate-400 font-mono text-[10px]">${escapeHtml(tl.time)}</span>
              </div>
              <p class="text-[11.5px] text-slate-600 mt-0.5">${escapeHtml(tl.note)}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Intake SOP Parameters -->
      <div class="rf-card p-4">
        <div class="flex items-center gap-1.5 pb-2 mb-3 border-b border-slate-100">
          <span class="material-symbols-outlined text-sky-700 text-[18px]">checklist</span>
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Intake details</h2>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Current battery</div>
            <div class="font-bold text-slate-800 mt-0.5">${escapeHtml(order.device.currentBattery || '87%')}</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold uppercase">iCloud / Passcode</div>
            <div class="font-bold text-slate-800 mt-0.5">${escapeHtml(order.device.icloudPasscode || 'Completed open')}</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Physical SIM tray</div>
            <div class="font-bold text-slate-800 mt-0.5">${escapeHtml(order.device.simTray || 'Removed')}</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Original True Tone</div>
            <div class="font-bold text-slate-800 mt-0.5">${escapeHtml(order.device.trueTone || 'Backup possible')}</div>
          </div>
        </div>
        <div class="mt-3 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
          <strong>SOP:</strong> Open the new screen seal only after the system records customer approval.
        </div>
      </div>
    </div>
  `;
}

