/**
 * Dashboard Actions
 */

import { fetchOrders } from '../../mocks/mock-api.js';
import { showToast } from '../../shared/components/toast.js';
import { showModal } from '../../shared/components/modal.js';
import { renderOrdersTable } from './dashboard-render.js';

export function setupDashboardActions(container) {
  // Export Report Button
  const exportBtn = container.querySelector('#btn-export-report');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showToast('Creating an Excel/PDF operations report...', 'info');
      setTimeout(() => {
        showToast('Shift report exported successfully!', 'success');
      }, 700);
    });
  }

  // Create Order Button
  const createOrderBtn = container.querySelector('#btn-create-order');
  if (createOrderBtn) {
    createOrderBtn.addEventListener('click', () => {
      showModal({
        title: 'Create New Repair Order',
        contentHtml: `
          <div class="space-y-3 text-xs text-slate-600">
            <p>The intake SOP has three required steps:</p>
            <ol class="list-decimal pl-5 space-y-1 font-medium text-slate-700">
              <li>Enter customer information or search by an existing phone number.</li>
              <li>Record the device, IMEI/Serial number, and reported issue.</li>
              <li>Capture at least 2–4 condition photos and check the bottom screws and seals.</li>
            </ol>
            <div class="p-2.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 mt-2">
              💡 <em>In the demo, sample order <strong>#RF-20260911-001</strong> is preloaded with representative data for the full workflow.</em>
            </div>
          </div>
        `,
        confirmText: 'Open sample order',
        cancelText: 'Close',
        onConfirm: () => {
          window.location.hash = '#/orders/RF-20260911-001';
        }
      });
    });
  }

  // Filter Buttons
  const filterBtns = container.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const filter = e.currentTarget.dataset.filter;
      const orders = await fetchOrders({ filter });
      const tableWrapper = container.querySelector('#dashboard-table-wrapper');
      if (tableWrapper) {
        tableWrapper.innerHTML = renderOrdersTable(orders, filter);
        setupTableInteractions(tableWrapper);
      }
    });
  });

  const tableWrapper = container.querySelector('#dashboard-table-wrapper');
  if (tableWrapper) {
    setupTableInteractions(tableWrapper);
  }
}

function setupTableInteractions(tableWrapper) {
  const rows = tableWrapper.querySelectorAll('.order-row');
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const orderId = row.dataset.orderId;
      if (orderId) {
        window.location.hash = `#/orders/${orderId}`;
      }
    });
  });
}

