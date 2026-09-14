(function() {
"use strict";

// --- src/ui/config/routes.js ---
/**
 * RepairFlow - Route Definitions
 */

const ROUTES = {
  DASHBOARD: '#/dashboard',
  ORDERS: '#/orders',
  ORDER_DETAIL: '#/orders/:id',
  CUSTOMER_VIEW: '#/customer/:id',
  CUSTOMERS: '#/customers',
  DEVICES: '#/devices',
  NOTIFICATIONS: '#/notifications',
  SETTINGS: '#/settings'
};

function parseRoute(hash) {
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


// --- src/ui/config/ui.config.js ---
/**
 * RepairFlow - UI Configuration & Constants
 */

const UI_CONFIG = {
  appName: 'RepairFlow',
  shopName: 'Minh Tâm Store',
  shopAddress: '182 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
  shopPhone: '1900 8899',
  shopStatus: 'Store is open',
  currentUser: {
    name: 'Minh Tâm',
    role: 'Operations Manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
  }
};

const STATUS_LABELS = {
  received: { label: 'New intake', color: 'blue', step: 1 },
  diagnosing: { label: 'Diagnosing', color: 'sky', step: 2 },
  waiting_for_approval: { label: 'Waiting for customer approval', color: 'amber', step: 3 },
  approved: { label: 'Quotation approved', color: 'indigo', step: 3 },
  repairing: { label: 'Repairing', color: 'purple', step: 4 },
  quality_check: { label: 'Quality check', color: 'teal', step: 5 },
  ready_for_pickup: { label: 'Ready for Handover', color: 'emerald', step: 6 },
  handed_over: { label: 'Handed over', color: 'green', step: 6 },
  rejected: { label: 'Customer rejected', color: 'rose', step: 3 },
  overdue: { label: 'Overdue', color: 'red', step: 4 }
};

const PIPELINE_STEPS = [
  { step: 1, title: 'Intake', subtext: 'Awaiting assignment' },
  { step: 2, title: 'Diagnosis', subtext: 'Testing' },
  { step: 3, title: 'Quote approval', subtext: '11.4 tr' },
  { step: 4, title: 'Repair', subtext: 'At repair bench' },
  { step: 5, title: 'Quality check', subtext: 'Functional test...' },
  { step: 6, title: 'Sẵn sàng...', subtext: 'Pickup scheduled' }
];


// --- src/ui/mocks/mock-orders.js ---
/**
 * Centralized Mock Orders Data
 */

const INITIAL_ORDERS = [
  {
    id: 'RF-20260911-001',
    createdAt: '2026-09-11T09:10:00',
    dueDate: '2026-09-13T17:30:00',
    status: 'waiting_for_approval',
    receptionist: 'Linh',
    technicianId: 'ktv-nam',
    technicianName: 'Trần Hoàng Nam (Technician Trưởng Phần Cứng Bậc 3)',
    customer: {
      id: 'c-01',
      name: 'Nguyễn Minh Anh',
      phone: '0912849888',
      maskedPhone: '0912***888',
      isVip: true,
      vipDiscountRate: 0.05
    },
    device: {
      id: 'd-01',
      name: 'iPhone 13 Pro',
      specs: '128GB · Xanh Sierra',
      imei: '356891104829104',
      issueReported: 'Error nguồn, sập nguồn, nứt kính màn hình góc trên phải, loạn cảm ứng',
      currentBattery: '87% (Zin Apple)',
      icloudPasscode: 'Completed open mật khẩu',
      simTray: 'Completed tháo trả customer',
      trueTone: 'Có thể sao lưu',
      sealStatus: '2 ốc đáy hình sao Pentalobe remaining nguyên tem Minh Tâm Care. Chưa qua repair bên ngoài.'
    },
    intakePhotos: [
      {
        title: 'Mặt trước',
        subtitle: 'Nứt góc trên phải, loạn cảm ứng',
        tag: 'Mặt trước',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDr_GkZDzwoVqXkluXjIMyaDK3NkziLLZ6ea_bLKPjp-3B7CNhqARWwllrTzg6EU1hcdWLXLBrnW5zjqN9gWFCUGPklz4rCLHS9afCs4AAg5-3JMFgs2TTs6SomyXMe4ijIYLdo2HXlVI75PwBZUujWUw0jyRYz4MEc7sf6-P28TXACy83q-3oBhgVn986JBj7BhrJlE8xGOp-0bEkYcKtmRvfvI9urRNv8H9NC8QGu8O8_bLYqlROL'
      },
      {
        title: 'Mặt sau & Cụm Cam',
        subtitle: 'Kính lưng đẹp, camera nguyên vẹn',
        tag: 'Mặt sau',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBztxj9N196JM_T2rrwWsieyyBMkEkJ03SVaiZauJ9KWpTdHKDyvtkCZbKSV0o9dZDM8XkTMFWlQSGQSDDUY-UCUchZGIfrL98pOngztoEaj3mb_8uPGN64ZGXsMOjzlX7Fk0oI8SOkGNT763qGOtw1DUsYfeN3Ng56vEgMDO44o4TQ_RB_tN8aa1xwio4_EGCJ_Ya94ilVGyrbyt6U6rtno-99eOSz2s17dhxwsEY3LxEQ7xfSEhbJ'
      },
      {
        title: 'Khung sườn',
        subtitle: 'Cấn nhẹ 0.5mm, không cong vênh',
        tag: 'Khung sườn',
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'
      },
      {
        title: 'Vùng chấn thương OLED',
        subtitle: 'Đứt mạch số hóa Digitizer',
        tag: 'Error OLED',
        url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&h=300&fit=crop'
      }
    ],
    diagnosis: {
      hardwareDisplay: 'Màn hình vỡ góc trên phải, xuất hiện sọc tím mảnh dọc panel OLED. Cảm ứng nhảy loạn khu vực phím 7, 8, 9 and đơ dải phím dưới.',
      powerAndFeatures: 'Dòng cấp nguồn Boot current chuẩn 0.12A ~ 0.85A. Cụm Face ID, cảm biến tiệm cận nguyên bản hoạt động tốt. Pin zin 87% dung lượng.',
      proposedSolution: [
        'Thay Màn hình iPhone 13 Pro OLED Zin Apple (giữ nguyên ProMotion 120Hz mượt mà).',
        'Dùng device chuyên dụng JCID nạp lại dữ liệu màn gốc, bảo toàn tính năng True Tone.',
        'Vệ sinh màng loa thoại, ép lại ron cao su chống nước & bụi chuẩn IP68.',
        'Repair time: 90 phút as soon as customer hàng confirm duyệt giá.'
      ],
      checkedItemsCount: 14
    },
    quoteVersion: 'v1.0',
    quoteVersions: [
      {
        version: 'v1.0',
        createdAt: '2026-09-11T10:20:00',
        status: 'published',
        items: [
          {
            stt: '01',
            name: 'Cụm Màn hình iPhone 13 Pro OLED Zin Apple',
            desc: 'Linh kiện bóc máy nguyên bản, hỗ trợ ProMotion 120Hz',
            warranty: '6 month (1 đổi 1)',
            quantity: 1,
            unitPrice: 2650000,
            totalPrice: 2650000
          },
          {
            stt: '02',
            name: 'Công tháo lắp kỹ thuật & Đồng bộ True Tone',
            desc: 'Nạp ROM hiển thị qua máy JCID, test áp suất',
            warranty: 'Theo máy',
            quantity: 1,
            unitPrice: 200000,
            totalPrice: 200000
          },
          {
            stt: '03',
            name: 'Vệ sinh vi mạch & Thay ron chống nước IP68',
            desc: 'Gói bảo dưỡng viền khung phục hồi chống nước',
            warranty: 'Trọn đời',
            quantity: 1,
            unitPrice: 150000,
            totalPrice: 0,
            isGift: true
          }
        ],
        subtotal: 2850000,
        discount: 142500,
        finalTotal: 2707500,
        warrantyPolicy: 'Six-month one-for-one touch warranty. Three-month display-color warranty. Not applicable to impact, drops, or liquid damage after handover.'
      }
    ],
    customerFeedback: {
      lastViewedAt: '10:28 - 12 minutes ago',
      openedPlatform: 'Safari Mobile',
      decision: 'pending', // 'pending' | 'approved' | 'rejected'
      decisionAt: null
    },
    timeline: [
      { time: '10:28', title: 'Customer opened the quotation link', note: 'Nguyễn Minh Anh open link quotation trên Safari Mobile.' },
      { time: '10:20', title: 'Sent quotation v1.0', note: 'Receptionist Linh publish quotation 2.707.500 đ qua tin nhắn ZNS.' },
      { time: '09:45', title: 'Diagnosis completed', note: 'Technician Nam hoàn thành đo đạc bo mạch, đề xuất thay màn Zin.' },
      { time: '09:25', title: 'Chuyển sang Bàn 04', note: 'Máy được chuyển từ quầy tiếp tân ando khu kỹ thuật check.' },
      { time: '09:10', title: 'Intake máy', note: 'Lập order RF-20260911-001, chụp 4 ảnh condition ban đầu.' }
    ]
  },
  {
    id: 'RF-20260911-004',
    createdAt: '2026-09-11T09:30:00',
    dueDate: '2026-09-12T11:30:00',
    status: 'diagnosing',
    receptionist: 'Linh',
    technicianId: 'ktv-phong',
    technicianName: 'Technician Phong (Diagnosis sơ bộ & đo đạc)',
    customer: { id: 'c-02', name: 'Trần Văn Phúc', phone: '0988234567', maskedPhone: '0988***234', isVip: false },
    device: { id: 'd-02', name: 'iPad Pro M1 11"', specs: '256GB · Xám Không Gian', imei: '358901239841209', issueReported: 'Loạn cảm ứng nửa dưới màn hình' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1850000 }],
    timeline: [{ time: '09:30', title: 'Intake máy', note: 'Lập order check socket cáp cảm ứng iPad.' }]
  },
  {
    id: 'RF-20260910-019',
    createdAt: '2026-09-10T14:00:00',
    dueDate: '2026-09-11T17:30:00',
    status: 'repairing',
    receptionist: 'Linh',
    technicianId: 'ktv-tuan',
    technicianName: 'Technician Tuấn (Ép kính & Màn hình)',
    customer: { id: 'c-03', name: 'Lê Thị Hoa', phone: '0903567890', maskedPhone: '0903***567', isVip: false },
    device: { id: 'd-03', name: 'Galaxy S23 Ultra', specs: '512GB · Xanh Botanic', imei: '351290384719203', issueReported: 'Thay cụm sạc & pin zin' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1950000 }],
    timeline: [{ time: '14:20', title: 'Customer duyệt quotation', note: 'Bắt đầu tiến hành thay pin and cụm sạc.' }]
  },
  {
    id: 'RF-20260910-012',
    createdAt: '2026-09-10T08:30:00',
    dueDate: '2026-09-10T18:00:00',
    status: 'overdue',
    receptionist: 'Linh',
    technicianId: 'ktv-nam',
    technicianName: 'Technician Nam (Trưởng nhóm)',
    customer: { id: 'c-04', name: 'Vũ Đình Quân', phone: '0977991234', maskedPhone: '0977***991', isVip: false },
    device: { id: 'd-04', name: 'MacBook Pro 14" M2', specs: 'Mất nguồn sạc MagSafe', imei: 'C02G9014Q05D', issueReported: 'Waiting IC nguồn mainboard' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 3400000 }],
    timeline: [{ time: 'Hôm qua', title: 'Overdue', note: 'The power IC was delayed by one day; the customer was notified by phone.' }]
  },
  {
    id: 'RF-20260909-008',
    createdAt: '2026-09-09T11:00:00',
    dueDate: '2026-09-11T12:00:00',
    status: 'ready_for_pickup',
    receptionist: 'Linh',
    technicianId: 'ktv-tuan',
    technicianName: 'Technician Tuấn (Ép kính)',
    customer: { id: 'c-05', name: 'Hoàng Bích Ngà', phone: '0934112345', maskedPhone: '0934***112', isVip: false },
    device: { id: 'd-05', name: 'Xiaomi 13 Ultra', specs: 'Màu Trắng Gốm', imei: '867192038471920', issueReported: 'Ép kính màn hình cong' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1450000 }],
    timeline: [{ time: '11:15', title: 'QC passed', note: 'SMS sent to notify the customer that the device is ready for pickup.' }]
  },
  {
    id: 'RF-20260908-003',
    createdAt: '2026-09-08T10:00:00',
    dueDate: '2026-09-09T16:00:00',
    status: 'handed_over',
    receptionist: 'Linh',
    technicianId: 'ktv-nam',
    technicianName: 'Technician Nam',
    customer: { id: 'c-06', name: 'Phạm Quốc Tuấn', phone: '0918777888', maskedPhone: '0918***777', isVip: true },
    device: { id: 'd-06', name: 'iPhone 14 Pro Max', specs: '256GB Vàng Gold', imei: '357192039485712', issueReported: 'Thay pin Pisen chính hãng' },
    quoteVersion: 'v1.0',
    quoteVersions: [{ version: 'v1.0', finalTotal: 1200000 }],
    timeline: [{ time: '09/09', title: 'Device handed over', note: 'Twelve-month warranty activated from 09/09/2026.' }]
  }
];


// --- src/ui/mocks/ui-data.js ---
/**
 * Centralized UI Data Store
 */


const MOCK_TECHNICIANS = [
  {
    id: 'ktv-nam',
    name: 'Technician Nam (Trưởng nhóm)',
    specialty: 'Phần cứng Apple & Mainboard',
    assignedCount: 5,
    statusLevel: 'BẬN RỘN (80%)',
    statusClass: 'text-amber-700 bg-amber-50 border-amber-200',
    breakdown: 'Sửa: 2 máy · Waiting LK: 1 · QC: 2',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
  },
  {
    id: 'ktv-tuan',
    name: 'Technician Tuấn',
    specialty: 'Ép kính, màn hình cong OLED',
    assignedCount: 4,
    statusLevel: 'BÌNH THƯỜNG (60%)',
    statusClass: 'text-sky-700 bg-sky-50 border-sky-200',
    breakdown: 'Sửa: 3 máy · Diagnosis: 1 máy · QC: 0',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop'
  },
  {
    id: 'ktv-phong',
    name: 'Technician Phong',
    specialty: 'Diagnosis sơ bộ & module',
    assignedCount: 2,
    statusLevel: 'SẴN SÀNG (30%)',
    statusClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    breakdown: 'Diagnosis: 2 máy · Có thể nhận thêm',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop'
  }
];

const MOCK_ACTIVITIES = [
  {
    time: '10:20',
    relative: '15 minutes ago',
    content: 'Quotation sent for order <strong class="text-sky-800 font-semibold">RF-20260911-001</strong> cho customer <strong class="text-slate-800">Nguyễn Minh Anh</strong> through the customer channel.',
    meta: '2.850.000 đ · Thay IC nguồn & Màn hình'
  },
  {
    time: '09:55',
    relative: '40 minutes ago',
    content: 'Technician Tuấn completed completed repair <strong class="text-slate-800">Samsung S23 Ultra</strong>, and moved to functional QC testing.',
    meta: 'Order RF-20260910-019'
  },
  {
    time: '09:10',
    relative: '1 hours ago',
    content: 'Tiếp tân Linh create mới tiếp nhận máy <strong class="text-slate-800">iPhone 13 Pro</strong> (Order RF-20260911-001).',
    meta: 'VIP customer'
  }
];

const MOCK_WARRANTY_METRIC = {
  month: 'Tháng 09/2026',
  rate: '1.2%',
  rating: 'Rất tốt',
  desc: 'Tỷ lệ đổi trả tái sửa thấp hơn chuẩn mục tiêu 2.5%'
};

// In-Memory Persistent State for Demo Session
let currentOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));

function getMockOrders() {
  return currentOrders;
}

function setMockOrders(newOrders) {
  currentOrders = newOrders;
}


// --- src/ui/mocks/mock-api.js ---
/**
 * Mock API Service
 * Does NOT manipulate DOM. Returns Promises.
 */


function delay(ms = 60) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDashboardData() {
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
      overdue: { count: overdueCount, reason: 'Waiting linh kiện mainboard' }
    },
    pipeline: [
      { step: 1, title: 'Intake', count: 4, subtext: 'Awaiting assignment' },
      { step: 2, title: 'Diagnosis', count: 3, subtext: 'Testing' },
      { step: 3, title: 'Quote approval', count: waitingApprovalCount, subtext: '11.4 tr' },
      { step: 4, title: 'Repair', count: 6, subtext: 'At repair bench' },
      { step: 5, title: 'Quality check', count: 4, subtext: 'Test chức năng' },
      { step: 6, title: 'Sẵn sàng giao', count: 7, subtext: 'Pickup scheduled' }
    ],
    technicians: MOCK_TECHNICIANS,
    activities: MOCK_ACTIVITIES,
    warranty: MOCK_WARRANTY_METRIC,
    orders
  };
}

async function fetchOrders({ filter = 'all' } = {}) {
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

async function fetchOrderDetail(id) {
  await delay();
  const orders = getMockOrders();
  const found = orders.find(o => o.id === id);
  if (!found) {
    // fallback to first order
    return orders[0];
  }
  return JSON.parse(JSON.stringify(found));
}

async function updateOrderStatus(id, newStatus, note = '') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === id);
  if (!order) throw new Error('Not found order repair.');

  order.status = newStatus;
  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  order.timeline.unshift({
    time,
    title: `Status cập nhật: ${newStatus}`,
    note: note || 'Cập nhật từ hệ thống.'
  });

  setMockOrders([...orders]);
  return order;
}

async function createQuoteVersion(orderId, items, note = '') {
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
  order.customerFeedback.lastViewedAt = 'Chưa send customer';

  setMockOrders([...orders]);
  return order;
}

async function approveQuote(orderId, approvedBy = 'Customers') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Not found order.');

  order.status = 'approved';
  order.customerFeedback.decision = 'approved';
  order.customerFeedback.decisionAt = new Date().toISOString();

  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  order.timeline.unshift({
    time,
    title: 'Customer completed duyệt quotation',
    note: `${approvedBy} completed confirm approve phương án and chi phí repair.`
  });

  setMockOrders([...orders]);
  return order;
}

async function rejectQuote(orderId, reason = 'Customer không approve chi phí') {
  await delay();
  const orders = getMockOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Not found order.');

  order.status = 'rejected';
  order.customerFeedback.decision = 'rejected';
  order.customerFeedback.decisionAt = new Date().toISOString();

  const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  order.timeline.unshift({
    time,
    title: 'Customer rejected repair chữa',
    note: `Reason: ${reason}`
  });

  setMockOrders([...orders]);
  return order;
}


// --- src/ui/shared/utils/format.js ---
/**
 * Format Utilities
 */

function formatVND(amount) {
  if (typeof amount !== 'number') return '0 đ';
  return new Intl.NumberFormat('en-US').format(amount) + ' VND';
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || '';
  return phone.slice(0, 4) + '***' + phone.slice(-3);
}

function formatRelativeTime(minutesAgo) {
  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
  const hours = Math.floor(minutesAgo / 60);
  return `${hours} hours ago`;
}


// --- src/ui/shared/utils/dom.js ---
/**
 * DOM Helper Utilities
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

function on(element, event, handler, options) {
  if (element) {
    element.addEventListener(event, handler, options);
  }
}

function delegate(parent, eventType, selector, handler) {
  if (!parent) return;
  parent.addEventListener(eventType, (event) => {
    const target = event.target.closest(selector);
    if (target && parent.contains(target)) {
      handler(event, target);
    }
  });
}


// --- src/ui/shared/components/badge.js ---
/**
 * Status Badge Component
 */


function renderStatusBadge(status) {
  const conf = STATUS_LABELS[status] || { label: status, color: 'blue' };
  
  const colorClassMap = {
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    sky: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  const dotColorMap = {
    blue: 'bg-sky-500',
    sky: 'bg-cyan-500',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
    emerald: 'bg-emerald-500',
    green: 'bg-green-500',
    rose: 'bg-rose-500',
    red: 'bg-red-500'
  };

  const badgeClass = colorClassMap[conf.color] || colorClassMap.blue;
  const dotClass = dotColorMap[conf.color] || dotColorMap.blue;

  return `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeClass}">
      <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
      ${escapeHtml(conf.label)}
    </span>
  `;
}


// --- src/ui/shared/components/toast.js ---
/**
 * Toast Notification Component
 */


let container = null;

function ensureContainer() {
  if (!container) {
    container = document.getElementById('rf-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rf-toast-container';
      document.body.appendChild(container);
    }
  }
  return container;
}

function showToast(message, type = 'info', duration = 3200) {
  const c = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `rf-toast rf-toast-${type}`;

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  const icon = iconMap[type] || 'info';

  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] text-${type === 'success' ? 'emerald-600' : type === 'error' ? 'red-600' : 'sky-600'}">${icon}</span>
    <span class="text-slate-800 font-medium">${escapeHtml(message)}</span>
  `;

  c.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 260);
  }, duration);
}


// --- src/ui/shared/components/modal.js ---
/**
 * Modal Component
 */


let activeModal = null;

function showModal({ title, contentHtml, onConfirm, confirmText = 'Confirm', cancelText = 'Đóng' }) {
  closeModal();

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4';
  modalOverlay.id = 'rf-active-modal';

  modalOverlay.innerHTML = `
    <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-[rfSlideIn_0.2s_ease-out]">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-base font-bold text-slate-800">${escapeHtml(title)}</h3>
        <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 close-modal-btn">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div class="px-6 py-5 text-sm text-slate-600">
        ${contentHtml}
      </div>
      <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
        <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg cancel-modal-btn">
          ${escapeHtml(cancelText)}
        </button>
        <button type="button" class="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg confirm-modal-btn">
          ${escapeHtml(confirmText)}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);
  activeModal = modalOverlay;

  const closeBtn = modalOverlay.querySelector('.close-modal-btn');
  const cancelBtn = modalOverlay.querySelector('.cancel-modal-btn');
  const confirmBtn = modalOverlay.querySelector('.confirm-modal-btn');

  const handleClose = () => closeModal();

  closeBtn.addEventListener('click', handleClose);
  cancelBtn.addEventListener('click', handleClose);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  confirmBtn.addEventListener('click', async () => {
    if (onConfirm) {
      await onConfirm();
    }
    closeModal();
  });
}

function closeModal() {
  if (activeModal && activeModal.parentNode) {
    activeModal.parentNode.removeChild(activeModal);
    activeModal = null;
  }
}


// --- src/ui/features/dashboard/render-table.js ---
/**
 * Dashboard Orders Table Renderer
 */


function renderOrdersTable(orders, currentFilter = 'all') {
  return `
    <div class="rf-card overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span class="material-symbols-outlined text-sky-700 text-[18px]">assignment</span>
            Repair orders requiring priority attention
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Danh sách các order cần cập nhật status hoặc trễ cam kết</p>
        </div>
        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button type="button" class="filter-btn px-3 py-1 rounded-md transition-all ${currentFilter === 'all' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-filter="all">
            Tất cả (${orders.length})
          </button>
          <button type="button" class="filter-btn px-3 py-1 rounded-md transition-all ${currentFilter === 'waiting' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-filter="waiting">
            Waiting duyệt (1)
          </button>
          <button type="button" class="filter-btn px-3 py-1 rounded-md transition-all ${currentFilter === 'overdue' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}" data-filter="overdue">
            Quá hạn (1)
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10.5px] border-b border-slate-100">
            <tr>
              <th class="py-3 px-4">MÃ PHIẾU</th>
              <th class="py-3 px-4">CUSTOMER</th>
              <th class="py-3 px-4">THIẾT BỊ</th>
              <th class="py-3 px-4">TRẠNG THÁI XỬ LÝ</th>
              <th class="py-3 px-4">PHỤ TRÁCH</th>
              <th class="py-3 px-4">HẠN DỰ KIẾN</th>
              <th class="py-3 px-4 text-right">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            ${orders.map(order => `
              <tr class="hover:bg-sky-50/30 transition-colors cursor-pointer order-row" data-order-id="${escapeHtml(order.id)}">
                <td class="py-3 px-4">
                  <span class="font-bold text-sky-700 hover:underline">#${escapeHtml(order.id)}</span>
                  <div class="text-[11px] text-slate-400 font-normal truncate max-w-[140px]">${escapeHtml(order.device.issueReported)}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-semibold text-slate-800">${escapeHtml(order.customer.name)}</div>
                  <div class="text-[11px] text-slate-400">${escapeHtml(order.customer.maskedPhone)}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-medium text-slate-800">${escapeHtml(order.device.name)}</div>
                  <div class="text-[11px] text-slate-400 truncate max-w-[120px]">${escapeHtml(order.device.specs)}</div>
                </td>
                <td class="py-3 px-4">
                  ${renderStatusBadge(order.status)}
                </td>
                <td class="py-3 px-4">
                  <span class="font-medium text-slate-700">${escapeHtml(order.technicianName.split('(')[0].trim())}</span>
                </td>
                <td class="py-3 px-4 text-slate-600 font-medium">
                  ${order.status === 'overdue' ? '<span class="text-rose-600 font-bold">Yesterday (Overdue)</span>' : '13/09/2026'}
                </td>
                <td class="py-3 px-4 text-right">
                  <a href="#/orders/${escapeHtml(order.id)}" class="rf-btn rf-btn-outline text-[11px] py-1 px-2.5">
                    View details
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <span>Showing ${orders.length} order</span>
        <div class="flex items-center gap-1.5">
          <button type="button" class="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs">Previous</button>
          <span class="px-2 py-0.5 rounded bg-sky-700 text-white font-bold text-xs">1</span>
          <button type="button" class="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs">Next</button>
        </div>
      </div>
    </div>
  `;
}


// --- src/ui/features/dashboard/dashboard-render.js ---
/**
 * Dashboard Section Renderer (Header, KPIs, Pipeline, Right Column)
 */


function renderDashboardHeader() {
  return `
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Overview điều hành</h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <span class="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse"></span>
            Live Xưởng
          </span>
        </div>
        <p class="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
          <span class="material-symbols-outlined text-[15px]">calendar_today</span>
          Thứ Sáu, 11/09/2026 · 182 Lê Duẩn, Quận 1
        </p>
      </div>
      <div class="flex items-center gap-2.5">
        <button type="button" id="btn-export-report" class="rf-btn rf-btn-outline text-xs">
          <span class="material-symbols-outlined text-[17px]">download</span> Xuất báo cáo
        </button>
        <button type="button" id="btn-create-order" class="rf-btn rf-btn-primary text-xs">
          <span class="material-symbols-outlined text-[17px]">add</span> Create Repair Order
        </button>
      </div>
    </div>
  `;
}

function renderKpis(kpis) {
  return `
    <div class="kpi-grid mb-6">
      <!-- KPI 1: In progress xử lý -->
      <div class="rf-card p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">In progress xử lý</span>
          <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Tiến độ tốt</span>
        </div>
        <div class="my-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-slate-900">${kpis.processing.count}</span>
          <span class="text-xs text-slate-500 font-medium">order</span>
          <span class="text-xs font-bold text-emerald-600 ml-auto flex items-center">
            <span class="material-symbols-outlined text-[14px]">arrow_upward</span> ${kpis.processing.todayDelta} hôm nay
          </span>
        </div>
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Công suất workshop</span>
          <span class="font-bold text-slate-700">${kpis.processing.capacity}</span>
        </div>
      </div>

      <!-- KPI 2: Waiting duyệt giá -->
      <div class="rf-card p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Waiting duyệt giá</span>
          <span class="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Nhắc hẹn</span>
        </div>
        <div class="my-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-slate-900">${String(kpis.waitingApproval.count).padStart(2, '0')}</span>
          <span class="text-xs text-slate-500 font-medium">order</span>
          <span class="text-xs font-bold text-amber-600 ml-auto">${kpis.waitingApproval.urgent} order > 4h</span>
        </div>
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Total Quotation Value</span>
          <span class="font-bold text-slate-700">${formatVND(kpis.waitingApproval.totalValue)}</span>
        </div>
      </div>

      <!-- KPI 3: Sẵn sàng giao -->
      <div class="rf-card p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Sẵn sàng giao</span>
          <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Completed QC</span>
        </div>
        <div class="my-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-slate-900">${String(kpis.readyPickup.count).padStart(2, '0')}</span>
          <span class="text-xs text-slate-500 font-medium">máy</span>
          <span class="text-xs font-medium text-slate-500 ml-auto">${kpis.readyPickup.afternoonCount} hẹn chiều</span>
        </div>
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Thu hộ (COD)</span>
          <span class="font-bold text-emerald-600">${formatVND(kpis.readyPickup.codValue)}</span>
        </div>
      </div>

      <!-- KPI 4: Order quá hạn -->
      <div class="rf-card p-4 flex flex-col justify-between border-rose-200 bg-rose-50/30">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-rose-700 uppercase tracking-wider">Order quá hạn</span>
          <span class="text-[11px] font-semibold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full">Khẩn cấp</span>
        </div>
        <div class="my-3 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold text-rose-700">${String(kpis.overdue.count).padStart(2, '0')}</span>
          <span class="text-xs text-rose-600 font-medium">trễ hẹn</span>
          <span class="text-xs font-bold text-rose-700 ml-auto flex items-center gap-1">
            <span class="material-symbols-outlined text-[15px]">warning</span> Ưu tiên
          </span>
        </div>
        <div class="pt-2 border-t border-rose-100 flex items-center justify-between text-xs text-rose-700">
          <span class="truncate">Reason: ${escapeHtml(kpis.overdue.reason)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderPipeline(pipeline) {
  return `
    <div class="rf-card p-5 mb-6">
      <div class="flex items-center justify-between mb-3.5">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sky-700 text-[20px]">timeline</span>
          <h2 class="text-sm font-bold text-slate-800">Repair workflow pipeline</h2>
        </div>
        <span class="text-xs text-slate-500 font-medium">29 order trong quy trình</span>
      </div>
      <div class="pipeline-track">
        ${pipeline.map(item => `
          <div class="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col hover:border-sky-300 transition-colors">
            <div class="flex items-center justify-between text-[11px] text-slate-500 font-bold">
              <span>BƯỚC ${item.step}</span>
              <span class="w-1.5 h-1.5 rounded-full ${item.step === 3 ? 'bg-amber-500' : item.step === 6 ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
            </div>
            <div class="text-xs font-bold text-slate-800 mt-1 truncate">${escapeHtml(item.title)}</div>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-base font-extrabold text-sky-800">${item.count}</span>
              <span class="text-[11px] text-slate-500 font-medium">${escapeHtml(item.subtext)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDashboardRightCol(technicians, activities, warranty) {
  return `
    <div class="flex flex-col gap-5">
      <!-- Technicians -->
      <div class="rf-card p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-sky-700">engineering</span>
            Kỹ thuật viên trực workshop
          </h2>
          <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">3 Technician trực</span>
        </div>
        <div class="space-y-3">
          ${technicians.map(t => `
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div class="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>${escapeHtml(t.name)}</span>
                <span class="text-[11px] px-2 py-0.5 rounded border ${t.statusClass}">${t.statusLevel}</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-1">${escapeHtml(t.specialty)}</div>
              <div class="text-[11px] font-medium text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/60">${escapeHtml(t.breakdown)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="rf-card p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px] text-sky-700">history</span>
            Hoạt động mới
          </h2>
          <button type="button" class="text-[11px] font-semibold text-sky-700 hover:underline">Xem tất cả</button>
        </div>
        <div class="space-y-3 text-xs">
          ${activities.map(act => `
            <div class="relative pl-3.5 border-l-2 border-sky-600">
              <div class="text-[11px] text-slate-400 font-medium">${act.time} · ${act.relative}</div>
              <div class="text-slate-700 mt-0.5">${act.content}</div>
              <div class="text-[11px] text-slate-500 mt-0.5 font-medium">${act.meta}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Warranty Metric -->
      <div class="rf-card p-4 bg-emerald-50/40 border-emerald-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
            <span class="material-symbols-outlined text-[20px]">verified</span>
          </span>
          <div>
            <div class="text-xs font-bold text-slate-800">Warranty linh kiện ${escapeHtml(warranty.month)}</div>
            <div class="text-[11px] text-emerald-700 font-semibold">Tỷ lệ đổi trả tái sửa: ${warranty.rate} (${warranty.rating})</div>
          </div>
        </div>
        <span class="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
      </div>
    </div>
  `;
}


// --- src/ui/features/dashboard/dashboard-actions.js ---
/**
 * Dashboard Actions
 */


function setupDashboardActions(container) {
  // Export Report Button
  const exportBtn = container.querySelector('#btn-export-report');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      showToast('In progress create báo cáo vận hành định dạng Excel/PDF...', 'info');
      setTimeout(() => {
        showToast('Completed xuất báo cáo ca làm việc successfully!', 'success');
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
            <p>Quy trình SOP tiếp nhận gồm 3 bước bắt buộc:</p>
            <ol class="list-decimal pl-5 space-y-1 font-medium text-slate-700">
              <li>Nhập thông tin customer hàng hoặc tra cứu số phone cũ.</li>
              <li>Ghi nhận device, số IMEI/Serial and triệu chứng error.</li>
              <li>Chụp tối thiểu 2-4 ảnh condition and check niêm phong ốc đáy.</li>
            </ol>
            <div class="p-2.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 mt-2">
              💡 <em>Trong bản demo, order mẫu <strong>#RF-20260911-001</strong> completed được nạp sẵn dữ liệu chuẩn để kiểm nghiệm toàn bộ quy trình.</em>
            </div>
          </div>
        `,
        confirmText: 'Open order mẫu',
        cancelText: 'Đóng',
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


// --- src/ui/features/dashboard/dashboard.js ---
/**
 * Dashboard Feature Entry & Orchestrator
 */


async function initDashboard(container) {
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


// --- src/ui/features/repair-order-detail/render-header.js ---
/**
 * Order Detail Header & Pipeline Renderer
 */


function renderOrderHeader(order) {
  const currentStep = order.status === 'approved' ? 4 : order.status === 'repairing' ? 4 : order.status === 'quality_check' ? 5 : order.status === 'ready_for_pickup' || order.status === 'handed_over' ? 6 : 3;
  const stepText = order.status === 'approved' ? 'Customer approved — Ready to repair' : order.status === 'repairing' ? 'Repair in progress' : order.status === 'waiting_for_approval' ? 'Waiting for Customer Approval' : 'In progress xử lý';

  return `
    <div class="mb-5">
      <!-- Breadcrumb -->
      <div class="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1.5">
        <a href="#/dashboard" class="hover:text-sky-700">Repair Orders</a>
        <span>/</span>
        <span class="text-slate-800 font-semibold">#${escapeHtml(order.id)}</span>
        <span>·</span>
        <span>Create lúc 09:10, 11/09/2026</span>
      </div>

      <!-- Title & Actions -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">Repair Orders #${escapeHtml(order.id)}</h1>
          ${renderStatusBadge(order.status)}
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="btn-copy-customer-link" class="rf-btn rf-btn-primary text-xs">
            <span class="material-symbols-outlined text-[17px]">link</span> Sao chép link customer hàng
          </button>
          <button type="button" id="btn-edit-order" class="rf-btn rf-btn-outline text-xs">
            <span class="material-symbols-outlined text-[17px]">edit</span> Chỉnh sửa
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
            <span>BƯỚC 01</span>
            <span class="material-symbols-outlined text-[16px]">check_circle</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Intake máy</div>
          <div class="text-[11px] text-slate-500 mt-0.5">Lập order 09:10</div>
        </div>

        <!-- Step 2 -->
        <div class="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div class="flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>BƯỚC 02</span>
            <span class="material-symbols-outlined text-[16px]">check_circle</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Diagnosis</div>
          <div class="text-[11px] text-slate-500 mt-0.5">Technician Nam completed</div>
        </div>

        <!-- Step 3 -->
        <div class="p-2.5 rounded-xl border ${currentStep === 3 ? 'border-amber-300 bg-amber-50/60 ring-2 ring-amber-400/30' : 'border-emerald-200 bg-emerald-50/40'}">
          <div class="flex items-center justify-between text-[11px] font-bold ${currentStep === 3 ? 'text-amber-800' : 'text-emerald-700'}">
            <span>BƯỚC 03 · HIỆN TẠI</span>
            <span class="material-symbols-outlined text-[16px]">${currentStep === 3 ? 'pending_actions' : 'check_circle'}</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Waiting duyệt giá</div>
          <div class="text-[11px] text-slate-500 mt-0.5">${order.status === 'approved' ? 'Customer completed duyệt' : 'Completed send link customer'}</div>
        </div>

        <!-- Step 4 -->
        <div class="p-2.5 rounded-xl border ${currentStep >= 4 ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-slate-50/50 opacity-70'}">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>BƯỚC 04</span>
            <span class="material-symbols-outlined text-[16px]">${currentStep >= 4 ? 'build' : 'lock'}</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Repair linh kiện</div>
          <div class="text-[11px] text-slate-500 mt-0.5">${currentStep >= 4 ? 'In progress tiến hành' : 'Waiting customer confirm'}</div>
        </div>

        <!-- Step 5 -->
        <div class="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 opacity-70">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>BƯỚC 05</span>
            <span class="material-symbols-outlined text-[16px]">lock</span>
          </div>
          <div class="text-xs font-bold text-slate-800 mt-1">Quality check (36 bước)</div>
          <div class="text-[11px] text-slate-500 mt-0.5">Next khi sửa xong</div>
        </div>

        <!-- Step 6 -->
        <div class="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 opacity-70">
          <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>BƯỚC 06</span>
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
        Ảnh condition nhận máy (${order.intakePhotos ? order.intakePhotos.length : 4})
      </button>
      <button type="button" class="tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors" data-tab="execution">
        Tiến độ kỹ thuật
      </button>
      <button type="button" class="tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors" data-tab="qc">
        Biên bản check QC
      </button>
    </div>
  `;
}


// --- src/ui/features/repair-order-detail/render-condition.js ---
/**
 * Order Detail Condition & Diagnosis Renderer
 */


function renderConditionAndDiagnosis(order) {
  const photos = order.intakePhotos || [];
  const diagnosis = order.diagnosis || {
    hardwareDisplay: 'In progress check.',
    powerAndFeatures: 'Testing đạc.',
    proposedSolution: ['In progress đề xuất phương án.'],
    checkedItemsCount: 14
  };

  return `
    <!-- Photo Evidence Section -->
    <div class="rf-card p-4 mb-5">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sky-700 text-[18px]">photo_camera</span>
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Minh chứng hình ảnh tiếp nhận máy</h2>
        </div>
        <span class="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
          ${photos.length} ảnh đạt chuẩn
        </span>
      </div>

      <div class="photo-evidence-grid">
        ${photos.map(p => `
          <div class="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs group">
            <div class="relative h-36 bg-slate-100 overflow-hidden">
              <img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"/>
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold">
                ${escapeHtml(p.tag)}
              </span>
            </div>
            <div class="p-2.5">
              <div class="text-xs font-bold text-slate-800 truncate">${escapeHtml(p.title)}</div>
              <div class="text-[11px] text-slate-500 font-medium mt-0.5 truncate">${escapeHtml(p.subtitle)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="mt-3.5 p-3 rounded-xl bg-sky-50/50 border border-sky-100 flex items-center gap-2.5 text-xs text-slate-700">
        <span class="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
        <span><strong>Screw and seal condition:</strong> ${escapeHtml(order.device.sealStatus || '2 ốc đáy hình sao Pentalobe remaining nguyên tem. Customer confirm device chưa từng qua repair tại store thứ ba.')}</span>
      </div>
    </div>

    <!-- Technical Diagnosis Section -->
    <div class="rf-card p-5 mb-5">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sky-700 text-[20px]">psychology</span>
          <div>
            <h2 class="text-sm font-bold text-slate-900">Technical diagnosis conclusion</h2>
            <p class="text-[11px] text-slate-500">Phụ trách: <strong class="text-slate-800">${escapeHtml(order.technicianName)}</strong></p>
          </div>
        </div>
        <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Completed kiểm ${diagnosis.checkedItemsCount || 14} mục
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Condition phần cứng hiển thị</div>
          <p class="text-slate-700 leading-relaxed">${escapeHtml(diagnosis.hardwareDisplay)}</p>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nguồn chính & chức năng phụ trợ</div>
          <p class="text-slate-700 leading-relaxed">${escapeHtml(diagnosis.powerAndFeatures)}</p>
        </div>
      </div>

      <div class="mt-4 p-3.5 rounded-xl bg-sky-50/50 border border-sky-200 text-xs">
        <div class="font-bold text-sky-900 mb-2 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[17px] text-sky-700">handyman</span>
          Phương án xử lý đề xuất:
        </div>
        <ul class="space-y-1.5 text-slate-700 pl-4 list-disc marker:text-sky-600">
          ${diagnosis.proposedSolution.map(sol => `<li>${escapeHtml(sol)}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}


// --- src/ui/features/repair-order-detail/render-quote.js ---
/**
 * Order Detail Quote Renderer
 */


function renderQuoteTable(order) {
  const currentVerData = (order.quoteVersions && order.quoteVersions[0]) || {
    version: order.quoteVersion || 'v1.0',
    items: [],
    subtotal: 2850000,
    discount: 142500,
    finalTotal: 2707500,
    warrantyPolicy: 'Six-month one-for-one touch warranty. Three-month display-color warranty.'
  };

  const isApproved = order.status === 'approved';

  return `
    <div class="rf-card p-5 mb-5">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-slate-900">Repair quotation ${escapeHtml(currentVerData.version)}</h2>
            <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              ${isApproved ? 'Approved by customer' : 'Quotation published — Read only'}
            </span>
          </div>
          <p class="text-[11px] text-slate-500 mt-0.5">This quotation has been sent to the customer and cannot be edited directly to preserve the audit trail.</p>
        </div>
        <button type="button" id="btn-create-v2-inline" class="rf-btn rf-btn-outline text-xs text-sky-800 border-sky-300 hover:bg-sky-50">
          <span class="material-symbols-outlined text-[16px]">edit_document</span> Create bản ${order.quoteVersion === 'v1.0' ? 'v2.0' : 'mới'} để sửa
        </button>
      </div>

      <!-- Quotation Items Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10.5px] border-b border-slate-200">
            <tr>
              <th class="py-2.5 px-3 w-12 text-center">STT</th>
              <th class="py-2.5 px-4">HẠNG MỤC DỊCH VỤ / LINH KIỆN</th>
              <th class="py-2.5 px-3 text-center">WARRANTY</th>
              <th class="py-2.5 px-3 text-center w-12">SL</th>
              <th class="py-2.5 px-3 text-right">ĐƠN GIÁ</th>
              <th class="py-2.5 px-4 text-right">THÀNH TIỀN</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            ${(currentVerData.items || []).map((item, idx) => `
              <tr class="hover:bg-slate-50/50">
                <td class="py-3 px-3 text-center font-mono text-slate-400 font-bold">${item.stt || `0${idx + 1}`}</td>
                <td class="py-3 px-4">
                  <div class="font-bold text-slate-900">${escapeHtml(item.name)}</div>
                  <div class="text-[11px] text-slate-500 mt-0.5">${escapeHtml(item.desc)}</div>
                </td>
                <td class="py-3 px-3 text-center">
                  <span class="px-2 py-0.5 rounded text-[11px] font-bold ${item.isGift ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-50 text-sky-800 border border-sky-200'}">
                    ${escapeHtml(item.warranty)}
                  </span>
                </td>
                <td class="py-3 px-3 text-center font-bold text-slate-800">${item.quantity}</td>
                <td class="py-3 px-3 text-right font-medium text-slate-700 font-mono">${formatVND(item.unitPrice)}</td>
                <td class="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                  ${item.isGift ? '<span class="text-emerald-600">0 đ</span> <span class="text-[10px] text-slate-400 line-through">150.000 đ</span>' : formatVND(item.totalPrice)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Financial Calculation & Commitments -->
      <div class="mt-5 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div class="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sky-700 text-[16px]">verified_user</span>
            Warranty policy:
          </div>
          <p class="text-slate-600 leading-relaxed">${escapeHtml(currentVerData.warrantyPolicy || 'Six-month one-for-one touch warranty. Three-month display-color warranty. Not applicable to impact, pressure, or liquid damage.')}</p>
        </div>

        <div class="space-y-2 text-slate-600 font-medium">
          <div class="flex justify-between items-center">
            <span>Tạm tính linh kiện & công:</span>
            <span class="font-bold text-slate-800 font-mono">${formatVND(currentVerData.subtotal)}</span>
          </div>
          <div class="flex justify-between items-center text-amber-700">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px]">stars</span>
              Ưu completedi thành viên VIP (5%):
            </span>
            <span class="font-bold font-mono">-${formatVND(currentVerData.discount)}</span>
          </div>
          <div class="flex justify-between items-center text-slate-500">
            <span>Thuế GTGT (VAT 8%):</span>
            <span class="font-medium">Completed bao gồm</span>
          </div>
          <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span class="text-sm font-bold text-slate-900">Total thanh toán:</span>
            <span class="text-xl font-extrabold text-sky-800 font-mono">${formatVND(currentVerData.finalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}


// --- src/ui/features/repair-order-detail/render-sidebar.js ---
/**
 * Order Detail Sidebar Renderer (Feedback, Audit Log, Intake SOP)
 */


function renderDetailSidebar(order) {
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
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Status phản hồi customer</h2>
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
            <p class="mt-1 text-[11px] text-amber-800">Hệ thống completed tự động send tin ZNS & SMS chứa link duyệt trực tuyến.</p>
          </div>
        `}

        <div class="mb-3">
          <label class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Direct quotation approval link</label>
          <div class="flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <input type="text" readonly value="${escapeHtml(customerLink)}" id="input-customer-link-val" class="text-xs bg-transparent text-slate-600 font-mono flex-1 outline-none truncate"/>
            <button type="button" id="btn-copy-link-inline" class="p-1 rounded text-sky-700 hover:bg-sky-100 transition-colors" title="Sao chép link">
              <span class="material-symbols-outlined text-[18px]">content_copy</span>
            </button>
          </div>
        </div>

        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-600 mb-3.5">
          <span class="material-symbols-outlined text-sky-600 text-[18px]">visibility</span>
          <div>
            <div class="font-medium text-slate-700">Customer opened the quotation link</div>
            <div class="text-[10.5px] text-slate-400">Lần cuối: ${escapeHtml(order.customerFeedback.lastViewedAt)}</div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="space-y-2">
          <button type="button" id="btn-resend-zns" class="rf-btn rf-btn-primary w-full text-xs py-2">
            <span class="material-symbols-outlined text-[16px]">send</span> Send lại link qua Zalo & SMS
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
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Nhật ký xử lý (Audit Log)</h2>
          </div>
          <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Thời gian thực</span>
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
          <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông số lưu ý khi nhận máy</h2>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Pin hiện tại</div>
            <div class="font-bold text-slate-800 mt-0.5">${escapeHtml(order.device.currentBattery || '87%')}</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold uppercase">iCloud / Passcode</div>
            <div class="font-bold text-slate-800 mt-0.5">${escapeHtml(order.device.icloudPasscode || 'Completed open')}</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold uppercase">Khay SIM vật lý</div>
            <div class="font-bold text-slate-800 mt-0.5">${escapeHtml(order.device.simTray || 'Completed tháo')}</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div class="text-[10px] text-slate-400 font-bold uppercase">True Tone gốc</div>
            <div class="font-bold text-slate-800 mt-0.5">${escapeHtml(order.device.trueTone || 'Có thể sao lưu')}</div>
          </div>
        </div>
        <div class="mt-3 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
          <strong>SOP:</strong> Open the new screen seal only after the system records customer approval.
        </div>
      </div>
    </div>
  `;
}


// --- src/ui/features/repair-order-detail/detail-actions.js ---
/**
 * Order Detail Event Handlers & Actions
 */


function setupDetailActions(container, order, onOrderUpdated) {
  const customerLink = `${window.location.origin}${window.location.pathname}#/customer/${order.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customerLink).then(() => {
      showToast('Customer link copied to clipboard.', 'success');
    }).catch(() => {
      showToast('Please copy the link directly from the input.', 'warning');
    });
  };

  // Copy Link Buttons
  const copyBtnTop = container.querySelector('#btn-copy-customer-link');
  if (copyBtnTop) copyBtnTop.addEventListener('click', copyToClipboard);

  const copyBtnInline = container.querySelector('#btn-copy-link-inline');
  if (copyBtnInline) copyBtnInline.addEventListener('click', copyToClipboard);

  // Resend ZNS
  const resendBtn = container.querySelector('#btn-resend-zns');
  if (resendBtn) {
    resendBtn.addEventListener('click', () => {
      showToast('Sending the link to the customer...', 'info');
      setTimeout(() => {
        showToast(`Approval link resent to ${order.customer.phone} successfully!`, 'success');
      }, 600);
    });
  }

  // Approve By Phone
  const phoneApproveBtn = container.querySelector('#btn-phone-approve');
  if (phoneApproveBtn) {
    phoneApproveBtn.addEventListener('click', () => {
      showModal({
        title: 'Confirm customer approval by phone',
        contentHtml: `
          <p class="text-xs text-slate-600 mb-2">You are confirming on behalf of customer <strong>${order.customer.name}</strong> that the customer approved the full repair cost during a recorded call.</p>
          <div class="p-2.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
            ⚠️ The status will immediately change to <strong>Completed duyệt</strong> and unlock the repair stage.
          </div>
        `,
        confirmText: 'Confirm approval',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await approveQuote(order.id, 'Nhân viên tư vấn (Qua cuộc gọi phone)');
          showToast('Customer quotation approval recorded.', 'success');
          onOrderUpdated();
        }
      });
    });
  }

  // Reject Repair
  const rejectBtn = container.querySelector('#btn-order-reject');
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
      showModal({
        title: 'Confirm customer repair rejection',
        contentHtml: `
          <p class="text-xs text-slate-600 mb-2">Please confirm that customer <strong>${order.customer.name}</strong> wants to cancel this repair order.</p>
          <textarea id="modal-reject-reason" class="w-full p-2 border border-slate-300 rounded text-xs" placeholder="Enter a rejection reason (for example: cost too high, changed plans...)">Customer did not approve the genuine-part replacement cost</textarea>
        `,
        confirmText: 'Record rejection',
        cancelText: 'Đóng',
        onConfirm: async () => {
          const reasonInput = document.querySelector('#modal-reject-reason');
          const reason = reasonInput ? reasonInput.value : 'Customer rejected repair chữa';
          await rejectQuote(order.id, reason);
          showToast('Order status updated: customer rejected the repair.', 'warning');
          onOrderUpdated();
        }
      });
    });
  }

  // Create Quote Version v2.0
  const handleCreateV2 = () => {
    showModal({
      title: 'Create a new quotation version',
      contentHtml: `
        <div class="space-y-3 text-xs text-slate-600">
          <p>When a new quotation version is created, the old version remains in history for audit. The customer must review the new version again.</p>
          <div>
            <label class="font-bold text-slate-700 block mb-1">Change note for the new version:</label>
            <textarea id="modal-quote-v2-notes" class="w-full p-2.5 border border-slate-300 rounded-lg text-xs" rows="3" placeholder="For example: apply a customer discount or change the screen type...">Additional loyalty-customer discount applied.</textarea>
          </div>
        </div>
      `,
      confirmText: 'Publish new version',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const notes = document.querySelector('#modal-quote-v2-notes')?.value || '';
        const currentItems = order.quoteVersions[0]?.items || [];
        await createQuoteVersion(order.id, currentItems, notes);
        showToast('New quotation version created successfully.', 'success');
        onOrderUpdated();
      }
    });
  };

  const createQuoteBtnTop = container.querySelector('#btn-create-quote-version');
  if (createQuoteBtnTop) createQuoteBtnTop.addEventListener('click', handleCreateV2);

  const createQuoteBtnInline = container.querySelector('#btn-create-v2-inline');
  if (createQuoteBtnInline) createQuoteBtnInline.addEventListener('click', handleCreateV2);

  // Tab switching
  const tabBtns = container.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => {
        b.classList.remove('border-sky-700', 'text-sky-800');
        b.classList.add('border-transparent', 'text-slate-500');
      });
      e.currentTarget.classList.add('border-sky-700', 'text-sky-800');
      e.currentTarget.classList.remove('border-transparent', 'text-slate-500');

      const targetTab = e.currentTarget.dataset.tab;
      showToast(`Switched to tab: ${e.currentTarget.innerText.trim()}`, 'info', 1200);
    });
  });
}


// --- src/ui/features/repair-order-detail/repair-order-detail.js ---
/**
 * Repair Order Detail Feature Entry & Orchestrator
 */


async function initOrderDetail(container, params = {}) {
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


// --- src/ui/features/customer-link/customer-render-quote.js ---
/**
 * Customer Quote & Commitment Renderer
 */


function renderCustomerQuoteCard(quoteData) {
  return `
    <!-- Quote Details Breakdown -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 text-xs">
      <div class="flex items-center justify-between pb-2 border-b border-slate-100">
        <h2 class="font-bold text-slate-900 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sky-700 text-[18px]">receipt_long</span>
          Quotation details
        </h2>
        <span class="text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Phiên bản ${escapeHtml(quoteData.version)}</span>
      </div>

      <div class="space-y-3">
        <div class="flex justify-between items-start pb-2 border-b border-slate-50">
          <div>
            <strong class="text-slate-800 block">Cụm màn hình OLED Zin bóc máy</strong>
            <span class="text-[10.5px] text-emerald-700 font-medium">🛡️ Standard six-month one-for-one warranty</span>
          </div>
          <span class="font-bold font-mono text-slate-900">2.650.000 đ</span>
        </div>

        <div class="flex justify-between items-start pb-2 border-b border-slate-50">
          <div>
            <strong class="text-slate-800 block">Công tháo lắp & Nạp True Tone</strong>
            <span class="text-[10.5px] text-slate-500">Đồng bộ cảm biến gốc theo máy</span>
          </div>
          <span class="font-bold font-mono text-slate-900">200.000 đ</span>
        </div>

        <div class="flex justify-between items-start">
          <div>
            <strong class="text-slate-800 block">Vệ sinh máy & Ép ron kháng nước</strong>
            <span class="text-[10.5px] text-emerald-700 font-semibold">Hỗ trợ độc quyền tại Minh Tâm</span>
          </div>
          <div>
            <span class="font-bold text-emerald-600">0 đ</span>
            <span class="text-[10px] text-slate-400 line-through block text-right">150.000 đ</span>
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-100 space-y-1 text-slate-600">
        <div class="flex justify-between">
          <span>Total tạm tính:</span>
          <span class="font-mono text-slate-800 font-semibold">2.850.000 đ</span>
        </div>
        <div class="flex justify-between text-amber-700">
          <span>Ưu completedi thành viên VIP (5%):</span>
          <span class="font-mono font-bold">-142.500 đ</span>
        </div>
        <div class="pt-2 border-t border-slate-200 flex justify-between items-baseline">
          <span class="font-bold text-slate-900">TỔNG THANH TOÁN:</span>
          <span class="text-lg font-extrabold text-sky-800 font-mono">${formatVND(quoteData.finalTotal)}</span>
        </div>
        <p class="text-[10px] text-slate-400 text-right">Completed bao gồm VAT & công thay</p>
      </div>
    </div>

    <!-- Commitments -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
      <div class="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
        <span class="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
        Cam kết từ hệ thống Minh Tâm
      </div>
      <div class="flex items-start gap-2 text-slate-600">
        <span class="material-symbols-outlined text-emerald-600 text-[16px] flex-shrink-0">check_circle</span>
        <p><strong>Genuine reclaimed part:</strong> As initially promised, with a six-month one-for-one touch warranty.</p>
      </div>
      <div class="flex items-start gap-2 text-slate-600">
        <span class="material-symbols-outlined text-emerald-600 text-[16px] flex-shrink-0">check_circle</span>
        <p><strong>Process transparency:</strong> Customers can follow the technician's work at the inspection bench.</p>
      </div>
      <div class="flex items-start gap-2 text-slate-600">
        <span class="material-symbols-outlined text-emerald-600 text-[16px] flex-shrink-0">check_circle</span>
        <p><strong>Bồi hoàn 100%:</strong> Hoàn tiền không điều kiện nếu phát hiện linh kiện tráo đổi hoặc không chuẩn zin.</p>
      </div>
    </div>
  `;
}


// --- src/ui/features/customer-link/customer-render.js ---
/**
 * Customer Mobile View Renderer
 */


function renderCustomerMobileView(order) {
  const isApproved = order.status === 'approved';
  const isRejected = order.status === 'rejected';
  const quoteData = order.quoteVersions?.[0] || {
    version: 'v1.0',
    items: [],
    subtotal: 2850000,
    discount: 142500,
    finalTotal: 2707500
  };

  return `
    <div class="customer-mobile-container pb-28">
      <!-- Top Mobile Header -->
      <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <a href="#/orders/${order.id}" class="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100" title="Trở lại interface nhân viên">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </a>
          <div>
            <div class="flex items-center gap-1">
              <span class="font-bold text-sky-800 text-sm">RepairFlow</span>
              <span class="material-symbols-outlined text-emerald-600 text-[15px]">verified</span>
            </div>
            <div class="text-[10px] text-slate-500 font-medium">Online quotation</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a href="tel:19008899" class="h-8 px-3 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center gap-1 text-xs font-semibold">
            <span class="material-symbols-outlined text-[16px]">call</span>
            <span>Hỗ trợ</span>
          </a>
        </div>
      </header>

      <!-- Main Body Content -->
      <div class="p-4 space-y-4">
        <!-- Card 1: Overview & Device -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-xs tracking-wide">
              #${escapeHtml(order.id)}
            </span>
            ${isApproved ? `
              <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                Repair approved
              </span>
            ` : isRejected ? `
              <span class="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-semibold text-xs flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-rose-600"></span>
                Customer rejected repair
              </span>
            ` : `
              <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-semibold text-xs flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Waiting for your quotation approval
              </span>
            `}
          </div>

          <div class="flex items-start justify-between gap-3">
            <div>
              <h1 class="text-lg font-bold text-slate-900">${escapeHtml(order.device.name)}</h1>
              <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(order.device.specs)}</p>
            </div>
            <div class="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-[24px]">smartphone</span>
            </div>
          </div>

          <div class="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">person</span> Customer:</span>
              <strong class="text-slate-800">${escapeHtml(order.customer.name)} (${escapeHtml(order.customer.maskedPhone)})</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> Intake:</span>
              <span>09:10 - 11/09/2026</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">event_available</span> Dự kiến xong:</span>
              <strong class="text-sky-800">17:00 - 13/09/2026</strong>
            </div>
          </div>
        </div>

        <!-- 4-step Stepper -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div class="flex items-center justify-between text-center relative px-2">
            <!-- step 1 -->
            <div class="flex flex-col items-center gap-1 z-10">
              <div class="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-bold">
                <span class="material-symbols-outlined text-[14px]">check</span>
              </div>
              <span class="text-[10.5px] font-semibold text-slate-800">Intake</span>
            </div>
            <!-- step 2 -->
            <div class="flex flex-col items-center gap-1 z-10">
              <div class="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-bold">
                <span class="material-symbols-outlined text-[14px]">check</span>
              </div>
              <span class="text-[10.5px] font-semibold text-slate-800">Diagnosis</span>
            </div>
            <!-- step 3 -->
            <div class="flex flex-col items-center gap-1 z-10">
              <div class="w-6 h-6 rounded-full ${isApproved ? 'bg-sky-700 text-white' : 'bg-amber-500 text-white ring-4 ring-amber-100'} flex items-center justify-center text-xs font-bold">
                ${isApproved ? '<span class="material-symbols-outlined text-[14px]">check</span>' : '3'}
              </div>
              <span class="text-[10.5px] font-bold ${isApproved ? 'text-slate-800' : 'text-amber-800'}">Quote approval</span>
            </div>
            <!-- step 4 -->
            <div class="flex flex-col items-center gap-1 z-10">
              <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">
                4
              </div>
              <span class="text-[10.5px] font-medium text-slate-500">Nhận máy</span>
            </div>
          </div>
        </div>

        <!-- Intake Photos -->
        <div class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Hình ảnh device lúc nhận</h2>
            <span class="text-[11px] text-slate-400">2 ảnh chụp macro</span>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div class="bg-white rounded-xl overflow-hidden border border-slate-200">
              <img src="${order.intakePhotos?.[0]?.url || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&h=300&fit=crop'}" class="w-full h-32 object-cover" alt="Mặt trước"/>
              <div class="p-2 text-[11px]">
                <strong class="text-sky-800 block uppercase">Mặt trước</strong>
                <span class="text-slate-500 text-[10.5px]">Nứt góc trên phải, liệt dải cảm ứng</span>
              </div>
            </div>
            <div class="bg-white rounded-xl overflow-hidden border border-slate-200">
              <img src="${order.intakePhotos?.[1]?.url || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'}" class="w-full h-32 object-cover" alt="Mặt sau"/>
              <div class="p-2 text-[11px]">
                <strong class="text-sky-800 block uppercase">Nắp lưng & Khung</strong>
                <span class="text-slate-500 text-[10.5px]">Kính lưng đẹp, camera nguyên vẹn</span>
              </div>
            </div>
          </div>
          <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-800">
            <span class="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            <span>Ốc đáy and tem niêm phong remaining nguyên vẹn 100%.</span>
          </div>
        </div>

        <!-- Diagnosis Details -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 text-xs">
          <h2 class="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <span class="material-symbols-outlined text-sky-700 text-[18px]">psychology</span>
            Technical diagnosis conclusion
          </h2>
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-400">Condition ghi nhận</div>
            <p class="text-slate-700 mt-1 leading-relaxed">Màn hình va đập nứt kính ngoài and chập mạch ma trận cảm ứng OLED bên trong. Mainboard, FaceID, pin and camera hoạt động bình thường, không ẩm nước.</p>
          </div>
          <div class="pt-2 border-t border-slate-100">
            <div class="text-[10px] uppercase font-bold text-slate-400">Giải pháp kỹ thuật</div>
            <p class="text-slate-700 mt-1 leading-relaxed">Thay thế cụm màn hình OLED Zin bóc máy chính hãng Apple, nạp lại code True Tone gốc, vệ sinh bo mạch and ép lại ron kháng nước chuẩn IP68.</p>
          </div>
          <div class="pt-2 border-t border-slate-100 flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">HN</div>
            <div>
              <div class="font-bold text-slate-800">Trần Hoàng Nam</div>
              <div class="text-[10.5px] text-slate-400">Kỹ thuật viên Trưởng phần cứng · 8 năm kinh nghiệm</div>
            </div>
          </div>
        </div>

        <!-- Quote Details Breakdown & Commitments -->
        ${renderCustomerQuoteCard(quoteData)}
      </div>

      <!-- Sticky Bottom Action Bar -->
      <div class="customer-bottom-bar">
        <a href="tel:19008899" class="rf-btn rf-btn-outline flex-1 py-3 text-xs justify-center">
          <span class="material-symbols-outlined text-[18px]">call</span> Tư vấn
        </a>
        ${isApproved ? `
          <button type="button" disabled class="rf-btn rf-btn-success flex-2 py-3 text-xs justify-center opacity-90 cursor-not-allowed">
            <span class="material-symbols-outlined text-[18px]">check_circle</span> Repair approved
          </button>
        ` : isRejected ? `
          <button type="button" disabled class="rf-btn rf-btn-danger flex-2 py-3 text-xs justify-center opacity-90 cursor-not-allowed">
            <span class="material-symbols-outlined text-[18px]">cancel</span> Completed reject sửa
          </button>
        ` : `
          <button type="button" id="btn-customer-approve" class="rf-btn rf-btn-primary flex-2 py-3 text-xs justify-center">
            <span class="material-symbols-outlined text-[18px]">thumb_up</span> Duyệt sửa (${formatVND(quoteData.finalTotal)})
          </button>
        `}
      </div>
    </div>
  `;
}


// --- src/ui/features/customer-link/customer-actions.js ---
/**
 * Customer Mobile View Actions
 */


function setupCustomerActions(container, order, onApproved) {
  const approveBtn = container.querySelector('#btn-customer-approve');
  if (approveBtn) {
    approveBtn.addEventListener('click', () => {
      const quoteTotal = order.quoteVersions?.[0]?.finalTotal || 2707500;

      showModal({
        title: 'Confirm repair approval',
        contentHtml: `
          <div class="space-y-2.5 text-xs text-slate-700">
            <p>You <strong>${order.customer.name}</strong> confirm that you approve the repair plan and cost:</p>
            <div class="p-3 bg-sky-50 rounded-xl border border-sky-200">
              <div class="flex justify-between font-bold text-slate-900 text-sm">
                <span>Total chi phí duyệt:</span>
                <span class="text-sky-800 font-mono">${formatVND(quoteTotal)}</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-1">Dự kiến completed: 17:00 - 13/09/2026</div>
            </div>
            <p class="text-[11px] text-slate-500">After confirmation, the technician will begin the repair.</p>
          </div>
        `,
        confirmText: 'Đồng ý & Bắt đầu sửa',
        cancelText: 'Xem lại',
        onConfirm: async () => {
          await approveQuote(order.id, `${order.customer.name} (Xác thực qua Link Web)`);
          showToast('Quotation approved successfully. Thank you from Minh Tâm Care.', 'success', 4000);
          onApproved();
        }
      });
    });
  }
}


// --- src/ui/features/customer-link/customer-link.js ---
/**
 * Customer Link View Feature Entry & Orchestrator
 */


async function initCustomerLink(container, params = {}) {
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


// --- src/ui/app.js ---
/**
 * RepairFlow - Application Entry & Router
 */


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


})();


