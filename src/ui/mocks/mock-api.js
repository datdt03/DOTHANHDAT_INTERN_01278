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
      overdue: { count: overdueCount, reason: 'Chờ linh kiện mainboard' }
    },
    pipeline: [
      { step: 1, title: 'Tiếp nhận', count: 4, subtext: 'Chờ phân' },
      { step: 2, title: 'Chẩn đoán', count: 3, subtext: 'Đang đo' },
      { step: 3, title: 'Duyệt giá', count: waitingApprovalCount, subtext: '11.4 tr' },
      { step: 4, title: 'Sửa chữa', count: 6, subtext: 'Bàn thợ' },
      { step: 5, title: 'Kiểm tra QC', count: 4, subtext: 'Test chức năng' },
      { step: 6, title: 'Sẵn sàng giao', count: 7, subtext: 'Hẹn trả' }
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
  if (!order) throw new Error('Không tìm thấy phiếu sửa chữa.');

  order.status = newStatus;
  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  order.timeline.unshift({
    time,
    title: `Trạng thái cập nhật: ${newStatus}`,
    note: note || 'Cập nhật từ hệ thống.'
  });

  setMockOrders([...orders]);
  return order;
}

export async function createQuoteVersion(orderId, items, note = '') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Không tìm thấy phiếu.');

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
  order.customerFeedback.lastViewedAt = 'Chưa gửi khách';

  setMockOrders([...orders]);
  return order;
}

export async function approveQuote(orderId, approvedBy = 'Khách hàng') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Không tìm thấy phiếu.');

  order.status = 'approved';
  order.customerFeedback.decision = 'approved';
  order.customerFeedback.decisionAt = new Date().toISOString();

  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  order.timeline.unshift({
    time,
    title: 'Khách đã duyệt báo giá',
    note: `${approvedBy} đã xác nhận đồng ý phương án và chi phí sửa chữa.`
  });

  setMockOrders([...orders]);
  return order;
}

export async function rejectQuote(orderId, reason = 'Khách không đồng ý chi phí') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Không tìm thấy phiếu.');

  order.status = 'rejected';
  order.customerFeedback.decision = 'rejected';
  order.customerFeedback.decisionAt = new Date().toISOString();

  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  order.timeline.unshift({
    time,
    title: 'Khách từ chối sửa chữa',
    note: `Lý do: ${reason}`
  });

  setMockOrders([...orders]);
  return order;
}
