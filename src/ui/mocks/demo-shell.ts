export interface DemoNavItem {
  label: string;
  shortLabel: string;
  icon: string;
  active?: boolean;
}

export const demoNavItems: DemoNavItem[] = [
  { label: 'Tổng quan', shortLabel: 'Tổng quan', icon: '⌂', active: true },
  { label: 'Đơn sửa chữa', shortLabel: 'Đơn', icon: '▣' },
  { label: 'Hàng chờ công việc', shortLabel: 'Công việc', icon: '✓' },
  { label: 'Tra cứu nhanh', shortLabel: 'Tra cứu', icon: '⌕' },
  { label: 'Khách hàng', shortLabel: 'Khách hàng', icon: '♧' },
];

export const demoMetrics = [
  { label: 'Đang xử lý', value: '28', hint: '+4 so với hôm qua', tone: 'blue' },
  { label: 'Chờ khách duyệt', value: '06', hint: '2 đơn quá 24 giờ', tone: 'amber' },
  { label: 'Cần kiểm tra chất lượng', value: '04', hint: 'Sẵn sàng cho QC', tone: 'violet' },
  { label: 'Sẵn sàng bàn giao', value: '09', hint: '3 khách đã hẹn lấy', tone: 'green' },
] as const;

export const demoPipeline = [
  { label: 'Tiếp nhận', count: 4, tone: 'blue' },
  { label: 'Chẩn đoán', count: 7, tone: 'cyan' },
  { label: 'Chờ duyệt', count: 6, tone: 'amber' },
  { label: 'Đang sửa', count: 8, tone: 'violet' },
  { label: 'Kiểm tra', count: 4, tone: 'teal' },
  { label: 'Bàn giao', count: 9, tone: 'green' },
] as const;

export const demoOrders = [
  { id: 'RF-20260911-001', customer: 'Nguyễn Minh Anh', device: 'iPhone 13 Pro', status: 'Chờ khách duyệt', tone: 'amber', updated: '10 phút trước' },
  { id: 'RF-20260911-002', customer: 'Trần Quốc Bảo', device: 'MacBook Air M2', status: 'Đang sửa chữa', tone: 'violet', updated: '28 phút trước' },
  { id: 'RF-20260911-003', customer: 'Lê Thu Hà', device: 'Samsung Galaxy S23', status: 'Sẵn sàng bàn giao', tone: 'green', updated: '1 giờ trước' },
] as const;
