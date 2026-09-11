/**
 * RepairFlow - UI Configuration & Constants
 */

export const UI_CONFIG = {
  appName: 'RepairFlow',
  shopName: 'Minh Tâm Store',
  shopAddress: '182 Lê Duẩn, Quận 1, TP. Hồ Chí Minh',
  shopPhone: '1900 8899',
  shopStatus: 'Cửa hàng đang mở',
  currentUser: {
    name: 'Minh Tâm',
    role: 'Quản lý điều hành',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
  }
};

export const STATUS_LABELS = {
  received: { label: 'Tiếp nhận mới', color: 'blue', step: 1 },
  diagnosing: { label: 'Đang chẩn đoán', color: 'sky', step: 2 },
  waiting_for_approval: { label: 'Chờ khách duyệt', color: 'amber', step: 3 },
  approved: { label: 'Đã duyệt giá', color: 'indigo', step: 3 },
  repairing: { label: 'Đang sửa chữa', color: 'purple', step: 4 },
  quality_check: { label: 'Kiểm tra QC', color: 'teal', step: 5 },
  ready_for_pickup: { label: 'Sẵn sàng bàn giao', color: 'emerald', step: 6 },
  handed_over: { label: 'Đã bàn giao', color: 'green', step: 6 },
  rejected: { label: 'Khách từ chối', color: 'rose', step: 3 },
  overdue: { label: 'Quá hạn cam kết', color: 'red', step: 4 }
};

export const PIPELINE_STEPS = [
  { step: 1, title: 'Tiếp nhận', subtext: 'Chờ phân' },
  { step: 2, title: 'Chẩn đoán', subtext: 'Đang đo' },
  { step: 3, title: 'Duyệt giá', subtext: '11.4 tr' },
  { step: 4, title: 'Sửa chữa', subtext: 'Bàn thợ' },
  { step: 5, title: 'Kiểm tra QC', subtext: 'Test chức...' },
  { step: 6, title: 'Sẵn sàng...', subtext: 'Hẹn trả' }
];
