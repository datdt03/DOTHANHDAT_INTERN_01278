/**
 * RepairFlow - Route Definitions
 */

export const ROUTES = {
  DASHBOARD: '#/dashboard',
  ORDERS: '#/orders',
  ORDER_DETAIL: '#/orders/:id',
  CUSTOMER_VIEW: '#/customer/:id',
  CUSTOMERS: '#/customers',
  DEVICES: '#/devices',
  NOTIFICATIONS: '#/notifications',
  SETTINGS: '#/settings'
};

export function parseRoute(hash) {
  const cleanHash = hash || ROUTES.DASHBOARD;
  
  // Match #/orders/:id
  const orderDetailMatch = cleanHash.match(/^#\/orders\/([A-Za-z0-9-]+)$/);
  if (orderDetailMatch) {
    return { name: 'order-detail', params: { id: orderDetailMatch[1] } };
  }

  // Match #/customer/:id
  const customerViewMatch = cleanHash.match(/^#\/customer\/([A-Za-z0-9-]+)$/);
  if (customerViewMatch) {
    return { name: 'customer-link', params: { id: customerViewMatch[1] } };
  }

  if (cleanHash.startsWith('#/orders')) {
    return { name: 'dashboard', params: { filter: 'orders' } };
  }

  return { name: 'dashboard', params: {} };
}
