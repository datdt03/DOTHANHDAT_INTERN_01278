/**
 * Customer Link View Feature Entry & Orchestrator
 */

import { fetchOrderDetail } from '../../mocks/mock-api.js';
import { renderCustomerMobileView } from './customer-render.js';
import { setupCustomerActions } from './customer-actions.js';

export async function initCustomerLink(container, params = {}) {
  const orderId = params.id || 'RF-20260911-001';

  container.innerHTML = `
    <div class="p-8 flex items-center justify-center min-h-[400px]">
      <div class="flex flex-col items-center gap-3">
        <span class="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin"></span>
        <span class="text-xs font-semibold text-slate-500">Loading quotation...</span>
      </div>
    </div>
  `;

  async function render() {
    try {
      const order = await fetchOrderDetail(orderId);
      container.innerHTML = renderCustomerMobileView(order);
      setupCustomerActions(container, order, render);
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center text-rose-600 text-sm">
          This quotation link could not be found: ${err.message}
        </div>
      `;
    }
  }

  await render();
}


