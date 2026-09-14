/**
 * Mock API Service
 * Does NOT manipulate DOM. Returns Promises.
 */

import { getMockOrders, setMockOrders, MOCK_TECHNICIANS, MOCK_ACTIVITIES, MOCK_WARRANTY_METRIC } from './ui-data.js';

function delay(ms = 60) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchDashboardData() {
  await delay();
  const orders = getMockOrders();

  const processingCount = orders.filter(o => ['received', 'diagnosing', 'repairing', 'quality_check'].includes(o.status)).length;
  const waitingApprovalCount = orders.filter(o => o.status === 'waiting_for_approval').length;
  const readyPickupCount = orders.filter(o => o.status === 'ready_for_pickup').length;
  const overdueCount = orders.filter(o => o.status === 'overdue').length;

  return {
    kpis: {
      processing: { count: 18, todayDelta: '+3', capacity: '85%' },
      waitingApproval: { count: waitingApprovalCount, urgent: 2, totalValue: 11450000 },
      readyPickup: { count: readyPickupCount, afternoonCount: 3, codValue: 9280000 },
      overdue: { count: overdueCount, reason: 'Waiting for the mainboard component' }
    },
    pipeline: [
      { step: 1, title: 'Intake', count: 4, subtext: 'Awaiting assignment' },
      { step: 2, title: 'Diagnosis', count: 3, subtext: 'Testing' },
      { step: 3, title: 'Quote approval', count: waitingApprovalCount, subtext: '11.4 tr' },
      { step: 4, title: 'Repair', count: 6, subtext: 'At repair bench' },
      { step: 5, title: 'Quality check', count: 4, subtext: 'Functional test' },
      { step: 6, title: 'Ready for pickup', count: 7, subtext: 'Pickup scheduled' }
    ],
    technicians: MOCK_TECHNICIANS,
    activities: MOCK_ACTIVITIES,
    warranty: MOCK_WARRANTY_METRIC,
    orders
  };
}

export async function fetchOrders({ filter = 'all' } = {}) {
  await delay();
  const orders = getMockOrders();
  if (filter === 'waiting') {
    return orders.filter(o => o.status === 'waiting_for_approval');
  }
  if (filter === 'overdue') {
    return orders.filter(o => o.status === 'overdue');
  }
  return orders;
}

export async function fetchOrderDetail(id) {
  await delay();
  const orders = getMockOrders();
  const found = orders.find(o => o.id === id);
  if (!found) {
    // fallback to first order
    return orders[0];
  }
  return JSON.parse(JSON.stringify(found));
}

export async function updateOrderStatus(id, newStatus, note = '') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === id);
  if (!order) throw new Error('Not found order repair.');

  order.status = newStatus;
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  order.timeline.unshift({
    time,
    title: `Status updated: ${newStatus}`,
    note: note || 'Updated by the system.'
  });

  setMockOrders([...orders]);
  return order;
}

export async function createQuoteVersion(orderId, items, note = '') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Not found order.');

  const nextVer = `v${(parseFloat(order.quoteVersion.replace('v', '')) + 1.0).toFixed(1)}`;
  order.quoteVersion = nextVer;
  
  const subtotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
  const discount = order.customer.isVip ? Math.round(subtotal * (order.customer.vipDiscountRate || 0.05)) : 0;
  const finalTotal = subtotal - discount;

  const newQuote = {
    version: nextVer,
    createdAt: new Date().toISOString(),
    status: 'draft',
    items,
    subtotal,
    discount,
    finalTotal,
    note
  };

  order.quoteVersions.unshift(newQuote);
  order.customerFeedback.decision = 'pending';
  order.customerFeedback.lastViewedAt = 'Not yet sent to customer';

  setMockOrders([...orders]);
  return order;
}

export async function approveQuote(orderId, approvedBy = 'Customers') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Not found order.');

  order.status = 'approved';
  order.customerFeedback.decision = 'approved';
  order.customerFeedback.decisionAt = new Date().toISOString();

  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  order.timeline.unshift({
    time,
    title: 'Customer approved quotation',
    note: `${approvedBy} confirmed the repair plan and cost.`
  });

  setMockOrders([...orders]);
  return order;
}

export async function rejectQuote(orderId, reason = 'Customer did not approve the repair cost') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Not found order.');

  order.status = 'rejected';
  order.customerFeedback.decision = 'rejected';
  order.customerFeedback.decisionAt = new Date().toISOString();

  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  order.timeline.unshift({
    time,
    title: 'Customer rejected the repair',
    note: `Reason: ${reason}`
  });

  setMockOrders([...orders]);
  return order;
}
