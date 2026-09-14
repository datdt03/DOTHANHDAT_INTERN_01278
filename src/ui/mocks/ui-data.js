/**
 * Centralized UI Data Store
 */

import { INITIAL_ORDERS } from './mock-orders.js';

export const MOCK_TECHNICIANS = [
  {
    id: 'ktv-nam',
    name: 'Technician Nam (Team lead)',
    specialty: 'Apple hardware and mainboards',
    assignedCount: 5,
    statusLevel: 'BẬN RỘN (80%)',
    statusClass: 'text-amber-700 bg-amber-50 border-amber-200',
    breakdown: 'Repair: 2 devices · Waiting parts: 1 · QC: 2',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
  },
  {
    id: 'ktv-tuan',
    name: 'Technician Tuấn',
    specialty: 'Glass repair and curved OLED displays',
    assignedCount: 4,
    statusLevel: 'NORMAL (60%)',
    statusClass: 'text-sky-700 bg-sky-50 border-sky-200',
    breakdown: 'Repair: 3 devices · Diagnosis: 1 device · QC: 0',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop'
  },
  {
    id: 'ktv-phong',
    name: 'Technician Phong',
    specialty: 'Preliminary diagnosis and modules',
    assignedCount: 2,
    statusLevel: 'SẴN SÀNG (30%)',
    statusClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    breakdown: 'Diagnosis: 2 devices · Available for more',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop'
  }
];

export const MOCK_ACTIVITIES = [
  {
    time: '10:20',
    relative: '15 minutes ago',
    content: 'Quotation sent for order <strong class="text-sky-800 font-semibold">RF-20260911-001</strong> to customer <strong class="text-slate-800">Nguyễn Minh Anh</strong> through the customer channel.',
    meta: '2,850,000 VND · Power IC and display replacement'
  },
  {
    time: '09:55',
    relative: '40 minutes ago',
    content: 'Technician Tuấn completed the repair of <strong class="text-slate-800">Samsung S23 Ultra</strong> and moved it to functional QC testing.',
    meta: 'Order RF-20260910-019'
  },
  {
    time: '09:10',
    relative: '1 hours ago',
    content: 'Receptionist Linh created a new intake for <strong class="text-slate-800">iPhone 13 Pro</strong> (Order RF-20260911-001).',
    meta: 'VIP customer'
  }
];

export const MOCK_WARRANTY_METRIC = {
  month: 'September 2026',
  rate: '1.2%',
  rating: 'Very good',
  desc: 'Repeat-repair return rate is below the 2.5% target'
};

// In-Memory Persistent State for Demo Session
let currentOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));

export function getMockOrders() {
  return currentOrders;
}

export function setMockOrders(newOrders) {
  currentOrders = newOrders;
}

