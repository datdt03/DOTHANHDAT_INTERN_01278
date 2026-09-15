/**
 * Dashboard Feature Entry & Orchestrator
 */

import { fetchDashboardData } from '../../mocks/mock-api.js';
import {
  renderDashboardHeader,
  renderKpis,
  renderPipeline,
  renderOrdersTable,
  renderDashboardRightCol
} from './dashboard-render.js';
import { setupDashboardActions } from './dashboard-actions.js';

export async function initDashboard(container) {
  // Show minimal loading state
  container.innerHTML = `
    <div class="p-8 flex items-center justify-center min-h-[400px]">
      <div class="flex flex-col items-center gap-3">
        <span class="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin"></span>
        <span class="text-xs font-semibold text-slate-500">Loading workshop data...</span>
      </div>
    </div>
  `;

  try {
    const data = await fetchDashboardData();

    container.innerHTML = `
      <div class="p-6 max-w-7xl mx-auto w-full animate-[fadeIn_0.2s_ease-out]">
        ${renderDashboardHeader()}
        ${renderKpis(data.kpis)}
        ${renderPipeline(data.pipeline)}
        
        <div class="dashboard-grid">
          <div id="dashboard-table-wrapper">
            ${renderOrdersTable(data.orders, 'all')}
          </div>
          <div>
            ${renderDashboardRightCol(data.technicians, data.activities, data.warranty)}
          </div>
        </div>
      </div>
    `;

    setupDashboardActions(container);
  } catch (err) {
    container.innerHTML = `
      <div class="p-8 text-center text-rose-600 text-sm">
        Unable to load the dashboard: ${err.message}
      </div>
    `;
  }
}


