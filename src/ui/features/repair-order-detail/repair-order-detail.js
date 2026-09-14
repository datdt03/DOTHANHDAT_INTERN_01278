/**
 * Repair Order Detail Feature Entry & Orchestrator
 */

import { fetchOrderDetail } from '../../mocks/mock-api.js';
import { renderOrderHeader } from './render-header.js';
import { renderConditionAndDiagnosis } from './render-condition.js';
import { renderQuoteTable } from './render-quote.js';
import { renderDetailSidebar } from './render-sidebar.js';
import { setupDetailActions } from './detail-actions.js';

export async function initOrderDetail(container, params = {}) {
  const orderId = params.id || 'RF-20260911-001';

  // Loading skeleton
  container.innerHTML = `
    <div class="p-8 flex items-center justify-center min-h-[400px]">
      <div class="flex flex-col items-center gap-3">
        <span class="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin"></span>
        <span class="text-xs font-semibold text-slate-500">Loading order record ${orderId}...</span>
      </div>
    </div>
  `;

  async function renderPage() {
    try {
      const order = await fetchOrderDetail(orderId);

      container.innerHTML = `
        <div class="p-6 max-w-7xl mx-auto w-full animate-[fadeIn_0.2s_ease-out]">
          ${renderOrderHeader(order)}

          <div class="order-detail-layout">
            <!-- Main Content Area -->
            <div>
              ${renderConditionAndDiagnosis(order)}
              ${renderQuoteTable(order)}
            </div>

            <!-- Right Sidebar Area -->
            <div>
              ${renderDetailSidebar(order)}
            </div>
          </div>
        </div>
      `;

      setupDetailActions(container, order, renderPage);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center text-rose-600 text-sm">
          Unable to load order details: ${err.message}
        </div>
      `;
    }
  }

  await renderPage();
}


