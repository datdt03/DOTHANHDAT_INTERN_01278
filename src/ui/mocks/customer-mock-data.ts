export interface MockCustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_CUSTOMERS: MockCustomerRecord[] = [
  {
    id: 'cust-001',
    name: 'Nguyễn Văn An',
    phone: '0912345678',
    email: 'an.nguyen@example.com',
    note: 'Khách hàng thân thiết, ưu tiên tiếp nhận nhanh',
    createdAt: '2026-03-10T08:30:00Z',
    updatedAt: '2026-03-15T10:15:00Z',
  },
  {
    id: 'cust-002',
    name: 'Trần Thị Mai',
    phone: '0987654321',
    email: 'mai.tran@example.com',
    note: 'Thường mang iPhone và iPad đến vệ sinh bảo dưỡng',
    createdAt: '2026-03-12T09:00:00Z',
    updatedAt: '2026-03-12T09:00:00Z',
  },
  {
    id: 'cust-003',
    name: 'Lê Hoàng Long',
    phone: '0903112233',
    email: null,
    note: 'Yêu cầu liên hệ qua điện thoại hoặc tin nhắn SMS',
    createdAt: '2026-03-14T14:20:00Z',
    updatedAt: '2026-03-14T14:20:00Z',
  },
  {
    id: 'cust-004',
    name: 'Phạm Minh Tuấn',
    phone: '0978998877',
    email: 'tuan.pham@company.vn',
    note: 'Khách hàng doanh nghiệp, cần xuất biên lai đỏ nếu có',
    createdAt: '2026-03-16T11:45:00Z',
    updatedAt: '2026-03-16T11:45:00Z',
  },
  {
    id: 'cust-005',
    name: 'Đặng Thanh Hà',
    phone: '0934556677',
    email: 'ha.dang@gmail.com',
    note: null,
    createdAt: '2026-03-17T16:10:00Z',
    updatedAt: '2026-03-17T16:10:00Z',
  },
];
