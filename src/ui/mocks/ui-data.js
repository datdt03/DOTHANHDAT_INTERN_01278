/**
 * Centralized UI Data Store
 */

import { INITIAL_ORDERS } from './mock-orders.js';

export const MOCK_TECHNICIANS = [
  {
    id: 'ktv-nam',
    name: 'KTV Nam (Trưởng nhóm)',
    specialty: 'Phần cứng Apple & Mainboard',
    assignedCount: 5,
    statusLevel: 'BẬN RỘN (80%)',
    statusClass: 'text-amber-700 bg-amber-50 border-amber-200',
    breakdown: 'Sửa: 2 máy · Chờ LK: 1 · QC: 2',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
  },
  {
    id: 'ktv-tuan',
    name: 'KTV Tuấn',
    specialty: 'Ép kính, màn hình cong OLED',
    assignedCount: 4,
    statusLevel: 'BÌNH THƯỜNG (60%)',
    statusClass: 'text-sky-700 bg-sky-50 border-sky-200',
    breakdown: 'Sửa: 3 máy · Chẩn đoán: 1 máy · QC: 0',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop'
  },
  {
    id: 'ktv-phong',
    name: 'KTV Phong',
    specialty: 'Chẩn đoán sơ bộ & module',
    assignedCount: 2,
    statusLevel: 'SẴN SÀNG (30%)',
    statusClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    breakdown: 'Chẩn đoán: 2 máy · Có thể nhận thêm',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop'
  }
];

export const MOCK_ACTIVITIES = [
  {
    time: '10:20',
    relative: '15 phút trước',
    content: 'Đã gửi báo giá phiếu <strong class="text-sky-800 font-semibold">RF-20260911-001</strong> cho khách <strong class="text-slate-800">Nguyễn Minh Anh</strong> qua Zalo ZNS.',
    meta: '2.850.000 đ · Thay IC nguồn & Màn hình'
  },
  {
    time: '09:55',
    relative: '40 phút trước',
    content: 'KTV Tuấn đã hoàn tất sửa chữa <strong class="text-slate-800">Samsung S23 Ultra</strong>, chuyển sang Test QC chức năng.',
    meta: 'Phiếu RF-20260910-019'
  },
  {
    time: '09:10',
    relative: '1 giờ trước',
    content: 'Tiếp tân Linh tạo mới tiếp nhận máy <strong class="text-slate-800">iPhone 13 Pro</strong> (Phiếu RF-20260911-001).',
    meta: 'Khách hàng VIP'
  }
];

export const MOCK_WARRANTY_METRIC = {
  month: 'Tháng 09/2026',
  rate: '1.2%',
  rating: 'Rất tốt',
  desc: 'Tỷ lệ đổi trả tái sửa thấp hơn chuẩn mục tiêu 2.5%'
};

// In-Memory Persistent State for Demo Session
let currentOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));

export function getMockOrders() {
  return currentOrders;
}

export function setMockOrders(newOrders) {
  currentOrders = newOrders;
}
