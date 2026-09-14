/**
 * Order Detail Header & Pipeline Renderer
 */

import { escapeHtml } from '../../shared/utils/dom.js';
import { renderStatusBadge } from '../../shared/components/badge.js';

export function renderOrderHeader(order) {
  const currentStep = order.status === 'approved' ? 4 : order.status === 'repairing' ? 4 : order.status === 'quality_check' ? 5 : order.status === 'ready_for_pickup' || order.status === 'handed_over' ? 6 : 3;
  const stepText = order.status === 'approved' ? 'Customer approved — Ready to repair' : order.status === 'repairing' ? 'Repair in progress' : order.status === 'waiting_for_approval' ? 'Waiting for Customer Approval' : 'In progress';

  return `
    <div class="mb-5">
      <!-- Breadcrumb -->
      <div class="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1.5">
        <a href="#/dashboard" class="hover:text-sky-700">Repair Orders</a>
        <span>/</span>
        <span class="text-slate-800 font-semibold">#${escapeHtml(order.id)}</span>
        <span>·</span>
        <span>Created at 09:10, 11/09/2026</span>
      </div>

      <!-- Title & Actions -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Repair Orders #${escapeHtml(order.id)}</h1>
          ${renderStatusBadge(order.status)}
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="btn-copy-customer-link" class="rf-btn rf-btn-primary text-xs">
            <span class="material-symbols-outlined text-[17px]">link</span> Copy customer link
          </button>
          <button type="button" id="btn-edit-order" class="rf-btn rf-btn-outline text-xs">
            <span class="material-symbols-outlined text-[17px]">edit</span> Edit
          </button>
          <button type="button" id="btn-create-quote-version" class="rf-btn rf-btn-outline text-xs">
            <span class="material-symbols-outlined text-[17px]">add_circle</span> Create a new quotation version
          </button>
        </div>
      </div>

      <!-- Summary Card -->
      <div class="rf-card p-3.5 mt-4 bg-slate-50/70 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs text-slate-700">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sky-700 text-[18px]">person</span>
          <span class="font-bold text-slate-900">${escapeHtml(order.customer.name)}</span>
          <span class="text-slate-500 font-mono">${escapeHtml(order.customer.phone)}</span>
          ${order.customer.isVip ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">VIP</span>' : ''}
        </div>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sky-700 text-[18px]">smartphone</span>
          <span class="font-semibold text-slate-900">${escapeHtml(order.device.name)}</span>
          <span class="text-slate-500">${escapeHtml(order.device.specs)}</span>
          <span class="text-slate-400 font-mono">IMEI: ${escapeHtml(order.device.imei)}</span>
        </div>
        <div class="flex items-center gap-4 text-slate-600">
          <span>Intake: <strong class="text-slate-800">${escapeHtml(order.receptionist)}</strong></span>
          <span>Technician: <strong class="text-slate-800">${escapeHtml(order.technicianName.split('(')[0])}</strong></span>
          <span>Pickup scheduled: <strong class="text-sky-800 font-semibold">17:30 - 13/09/2026</strong></span>
        </div>
      </div>
    </div>

    <!-- Progress Pipeline -->
    <div class="rf-card p-4 mb-5">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Repair workflow progress</span>
        <span class="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          ${stepText}
        </span>
      </div>
      <div class="order-pipeline-track">
        <!-- Step 1 -->
        <div class="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div class="flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>STEP 01</span>
            <span class="material-symbols-outlined text-[16px]">check_circle</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Device intake</div>
          <div class="text-[11px] text-slate-500 mt-0.5">Order created at 09:10</div>
        </div>

        <!-- Step 2 -->
        <div class="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div class="flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>STEP 02</span>
            <span class="material-symbols-outlined text-[16px]">check_circle</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Diagnosis</div>
          <div class="text-[11px] text-slate-500 mt-0.5">Technician Nam completed</div>
        </div>

        <!-- Step 3 -->
        <div class="p-2.5 rounded-xl border ${currentStep === 3 ? 'border-amber-300 bg-amber-50/60 ring-2 ring-amber-400/30' : 'border-emerald-200 bg-emerald-50/40'}">
          <div class="flex items-center justify-between text-[11px] font-bold ${currentStep === 3 ? 'text-amber-800' : 'text-emerald-700'}">
            <span>STEP 03 · CURRENT</span>
            <span class="material-symbols-outlined text-[16px]">${currentStep === 3 ? 'pending_actions' : 'check_circle'}</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Waiting for approval</div>
          <div class="text-[11px] text-slate-500 mt-0.5">${order.status === 'approved' ? 'Customer approved' : 'Approval link sent'}</div>
        </div>

        <!-- Step 4 -->
        <div class="p-2.5 rounded-xl border ${currentStep >= 4 ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-slate-50/50 opacity-70'}">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>STEP 04</span>
            <span class="material-symbols-outlined text-[16px]">${currentStep >= 4 ? 'build' : 'lock'}</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Parts repair</div>
          <div class="text-[11px] text-slate-500 mt-0.5">${currentStep >= 4 ? 'In progress' : 'Waiting for customer confirmation'}</div>
        </div>

        <!-- Step 5 -->
        <div class="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 opacity-70">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>STEP 05</span>
            <span class="material-symbols-outlined text-[16px]">lock</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Quality check (36 bước)</div>
          <div class="text-[11px] text-slate-500 mt-0.5">Next after repair</div>
        </div>

        <!-- Step 6 -->
        <div class="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 opacity-70">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>STEP 06</span>
            <span class="material-symbols-outlined text-[16px]">lock</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Handover & Sign-off</div>
          <div class="text-[11px] text-slate-500 mt-0.5">Issue warranty record</div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200 mb-5 text-xs font-bold text-slate-600">
      <button type="button" class="tab-btn px-4 py-2.5 border-b-2 border-sky-700 text-sky-800 transition-colors" data-tab="quote">
        Diagnosis & Quotation ${escapeHtml(order.quoteVersion)}
      </button>
      <button type="button" class="tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors" data-tab="condition">
        Intake condition photos (${order.intakePhotos ? order.intakePhotos.length : 4})
      </button>
      <button type="button" class="tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors" data-tab="execution">
        Technical progress
      </button>
      <button type="button" class="tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors" data-tab="qc">
        QC checklist
      </button>
    </div>
  `;
}

