/**
 * RepairFlow - Application Entry & Router
 */

import { parseRoute, ROUTES } from './config/routes.js';
import { initDashboard } from './features/dashboard/dashboard.js';
import { initOrderDetail } from './features/repair-order-detail/repair-order-detail.js';
import { initCustomerLink } from './features/customer-link/customer-link.js';
import { showToast } from './shared/components/toast.js';

const appContainer = document.getElementById('app');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const appHeader = document.getElementById('app-header');
const searchInput = document.getElementById('global-search-input');

function updateActiveNavigation(routeName) {
  // Sidebar items
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.dataset.route === routeName) {
      item.classList.add('bg-sky-700', 'text-white');
      item.classList.remove('hover:bg-sky-50', 'hover:text-sky-800', 'text-slate-600');
    } else {
      item.classList.remove('bg-sky-700', 'text-white');
      item.classList.add('text-slate-600');
    }
  });

  // Quick navigation pills
  const quickPills = document.querySelectorAll('.quick-nav-pill');
  quickPills.forEach(pill => {
    if (pill.dataset.nav === routeName) {
      pill.classList.add('bg-white', 'text-sky-800', 'shadow-xs');
      pill.classList.remove('text-slate-600');
    } else {
      pill.classList.remove('bg-white', 'text-sky-800', 'shadow-xs');
      pill.classList.add('text-slate-600');
    }
  });
}

async function handleRouting() {
  const route = parseRoute(window.location.hash);
  updateActiveNavigation(route.name);

  // Close mobile sidebar if open
  if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  }

  // Adjust layout for customer-link preview
  if (route.name === 'customer-link') {
    if (sidebar) sidebar.classList.add('md:hidden');
  } else {
    if (sidebar) sidebar.classList.remove('md:hidden');
  }

  window.scrollTo(0, 0);

  switch (route.name) {
    case 'order-detail':
      await initOrderDetail(appContainer, route.params);
      break;
    case 'customer-link':
      await initCustomerLink(appContainer, route.params);
      break;
    case 'dashboard':
    default:
      await initDashboard(appContainer, route.params);
      break;
  }
}

// Setup Event Listeners
window.addEventListener('hashchange', handleRouting);

function startApp() {
  if (!window.location.hash) {
    window.location.hash = ROUTES.DASHBOARD;
  }
  handleRouting();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// Mobile Sidebar Toggle
if (sidebarToggleBtn && sidebar && sidebarOverlay) {
  sidebarToggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    sidebarOverlay.classList.toggle('hidden');
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  });
}

// Global Search
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (!q) return;
      if (q.toUpperCase().startsWith('RF-') || q.includes('001')) {
        window.location.hash = '#/orders/RF-20260911-001';
      } else {
        showToast(`Searching for: "${q}"`, 'info');
      }
    }
  });
}


