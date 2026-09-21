import { runtimeConfig } from '../../config/runtime-config';
import { createApiClient, ApiClientError, type ApiClient } from '../../shared/api/api-client';
import { MOCK_CUSTOMERS } from '../../mocks/customer-mock-data';

export interface AssignmentDto {
  id: string;
  staffProfileId: string;
  staffProfileName: string;
  responsibility: string;
  isPrimary: boolean;
  assignedAt: string;
  completedAt: string | null;
  note: string | null;
}

export interface StatusHistoryDto {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  reason: string | null;
  createdAt: string;
}

export interface OpenOrderWarningDto {
  id: string;
  orderCode: string;
  status: string;
}

export interface RepairOrderItemDto {
  id: string;
  itemIndex: number;
  deviceId: string;
  status: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber: string | null;
  identifier: string | null;
  reportedIssue: string;
  handoverCondition: string | null;
  accessories: string | null;
  itemNotes: string | null;
  credentialStatus: string;
  credentialConsent: boolean;
  credentialReceivedAt: string | null;
  credentialExpiresAt: string | null;
  credentialDestroyedAt: string | null;
}

export interface CustomerSummaryDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
}

export interface RepairOrderSummaryDto {
  id: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deviceId: string;
  status: string;
  customerDescription: string;
  receivedAt: string;
  expectedCompletedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  primaryDeviceName: string;
  extraDevicesCount: number;
  assignedStaffName: string | null;
}

export interface RepairOrderDetailDto {
  id: string;
  orderCode: string;
  customerId: string;
  customer: CustomerSummaryDto | null;
  deviceId: string;
  status: string;
  customerDescription: string;
  receivedAt: string;
  expectedCompletedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignments: AssignmentDto[];
  statusHistory: StatusHistoryDto[];
  openOrderWarnings: OpenOrderWarningDto[] | null;
  repairItems: RepairOrderItemDto[];
}

export interface RepairOrderListQuery {
  status?: string;
  query?: string;
  customerId?: string;
  deviceId?: string;
  signal?: AbortSignal;
}

export interface RepairOrderListResult {
  orders: RepairOrderSummaryDto[];
  totalCount: number;
}

export interface StatusBadgeInfo {
  label: string;
  tone: string;
  status:
    | 'draft'
    | 'diagnosing'
    | 'waiting'
    | 'repairing'
    | 'qc'
    | 'ready'
    | 'completed'
    | 'cancelled'
    | 'rework';
}

/**
 * Map raw backend order status to human-readable Vietnamese label and design token status.
 */
export function getOrderStatusInfo(status: string): StatusBadgeInfo {
  switch (status?.toLowerCase()) {
    case 'received':
      return { label: 'Đã tiếp nhận', tone: 'blue', status: 'waiting' };
    case 'diagnosing':
      return { label: 'Đang chẩn đoán', tone: 'cyan', status: 'diagnosing' };
    case 'waiting_for_approval':
      return { label: 'Chờ khách duyệt', tone: 'warning', status: 'waiting' };
    case 'approved':
      return { label: 'Đã duyệt sửa chữa', tone: 'info', status: 'ready' };
    case 'repairing':
      return { label: 'Đang sửa chữa', tone: 'violet', status: 'repairing' };
    case 'cancellation_requested':
      return { label: 'Yêu cầu hủy', tone: 'danger', status: 'cancelled' };
    case 'quality_check':
      return { label: 'Kiểm tra chất lượng (QC)', tone: 'purple', status: 'qc' };
    case 'ready_for_pickup':
      return { label: 'Sẵn sàng bàn giao', tone: 'emerald', status: 'ready' };
    case 'handed_over':
      return { label: 'Đã bàn giao', tone: 'success', status: 'completed' };
    case 'rejected':
      return { label: 'Khách từ chối', tone: 'muted', status: 'cancelled' };
    case 'ready_for_return':
      return { label: 'Chờ trả máy', tone: 'warning', status: 'rework' };
    case 'returned':
      return { label: 'Đã trả máy', tone: 'muted', status: 'cancelled' };
    case 'cancelled':
      return { label: 'Đã hủy', tone: 'muted', status: 'cancelled' };
    default:
      return { label: status || 'Không xác định', tone: 'muted', status: 'draft' };
  }
}

/**
 * Format staff responsibility in Vietnamese.
 */
export function formatStaffResponsibility(responsibility: string): string {
  switch (responsibility?.toLowerCase()) {
    case 'intake':
      return 'Tiếp nhận';
    case 'diagnosis':
      return 'Chẩn đoán';
    case 'primary_technician':
      return 'Kỹ thuật viên chính';
    case 'repairer':
      return 'Thợ sửa chữa';
    case 'quality_checker':
      return 'Kiểm định QC';
    case 'handover':
      return 'Bàn giao';
    default:
      return responsibility || 'Nhân sự';
  }
}

/**
 * Format device type in Vietnamese.
 */
export function formatDeviceType(deviceType?: string | null): string {
  if (!deviceType) return 'Thiết bị';
  switch (deviceType.toLowerCase().trim()) {
    case 'phone':
    case 'smartphone':
      return 'Điện thoại di động';
    case 'tablet':
      return 'Máy tính bảng';
    case 'laptop':
      return 'Máy tính xách tay';
    case 'desktop':
    case 'pc':
      return 'Máy tính để bàn';
    case 'watch':
    case 'smartwatch':
      return 'Đồng hồ thông minh';
    case 'other':
      return 'Thiết bị khác';
    default:
      return deviceType;
  }
}

/**
 * Format status change reason in Vietnamese.
 * Converts technical backend codes (such as repair_intake_created) into human-readable Vietnamese.
 */
export function formatStatusReason(reason?: string | null): string {
  if (!reason) return 'Cập nhật trạng thái xử lý';
  const normalized = reason.toLowerCase().trim();

  const reasonMap: Record<string, string> = {
    repair_intake_created: 'Hoàn tất tiếp nhận và lập phiếu sửa chữa',
    intake_created: 'Tạo phiếu tiếp nhận ban đầu',
    order_created: 'Tạo mới phiếu sửa chữa',
    status_transition: 'Cập nhật trạng thái xử lý',
    diagnosing: 'Bắt đầu chẩn đoán kỹ thuật',
    diagnostic_started: 'Bắt đầu chẩn đoán kỹ thuật',
    diagnostic_completed: 'Hoàn tất chẩn đoán kỹ thuật',
    waiting_for_approval: 'Chờ khách hàng duyệt báo giá',
    quote_approved: 'Khách hàng đã duyệt phương án sửa chữa',
    quote_rejected: 'Khách hàng từ chối phương án sửa chữa',
    approved: 'Đã phê duyệt phương án sửa chữa',
    repairing: 'Bắt đầu tiến hành sửa chữa',
    repair_started: 'Bắt đầu tiến hành sửa chữa',
    repair_completed: 'Hoàn tất sửa chữa linh kiện',
    parts_waiting: 'Chờ linh kiện thay thế từ kho',
    quality_check: 'Chuyển sang kiểm tra chất lượng (QC)',
    qc_passed: 'Đạt kiểm định chất lượng (QC)',
    qc_failed: 'Không đạt QC - Chuyển sang sửa chữa lại',
    ready_for_pickup: 'Sẵn sàng bàn giao cho khách hàng',
    handed_over: 'Đã bàn giao thiết bị cho khách hàng',
    cancelled: 'Hủy phiếu sửa chữa',
  };

  if (reasonMap[normalized]) {
    return reasonMap[normalized];
  }

  // If already Vietnamese or custom sentence, keep it
  if (reason.includes(' ') || /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(reason)) {
    return reason;
  }

  // Replace snake_case with space if unknown code
  if (reason.includes('_')) {
    return reason.replace(/_/g, ' ');
  }

  return reason;
}

/**
 * Translate common preset values (e.g. Good, Cable, Charger, None) to Vietnamese.
 */
export function formatPresetValue(val?: string | null, fallback = '—'): string {
  if (!val || !val.trim()) return fallback;
  const normalized = val.toLowerCase().trim();

  switch (normalized) {
    case 'good':
      return 'Tình trạng tốt / Bình thường';
    case 'fair':
      return 'Bình thường / Trầy xước nhẹ';
    case 'poor':
      return 'Cũ / Trầy xước nhiều';
    case 'cable':
      return 'Cáp sạc';
    case 'charger':
      return 'Bộ sạc / Củ sạc';
    case 'case':
      return 'Ốp lưng / Bao da';
    case 'box':
      return 'Hộp máy';
    case 'none':
    case 'no':
      return 'Không có';
    default:
      return val;
  }
}


export interface RepairOrderApi {
  listOrders(query?: RepairOrderListQuery): Promise<RepairOrderListResult>;
  getOrder(orderId: string, options?: { signal?: AbortSignal }): Promise<RepairOrderDetailDto>;
}

interface ServerRepairOrderResponse {
  id: string;
  orderCode: string;
  customerId: string;
  deviceId: string;
  status: string;
  customerDescription: string;
  receivedAt: string;
  expectedCompletedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignments: AssignmentDto[];
  statusHistory: StatusHistoryDto[];
  openOrderWarnings: OpenOrderWarningDto[] | null;
  repairItems: RepairOrderItemDto[] | null;
}

interface ServerCustomerResponse {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export class RealRepairOrderAdapter implements RepairOrderApi {
  private customerCache = new Map<string, ServerCustomerResponse>();

  constructor(private readonly client: ApiClient) {}

  private async resolveCustomer(customerId: string): Promise<ServerCustomerResponse | null> {
    if (this.customerCache.has(customerId)) {
      return this.customerCache.get(customerId)!;
    }

    try {
      const response = await this.client.request<{
        data: ServerCustomerResponse;
        meta?: { requestId?: string };
      }>(`/api/customers/${encodeURIComponent(customerId)}`, {
        method: 'GET',
      });
      if (response.data) {
        this.customerCache.set(customerId, response.data);
        return response.data;
      }
    } catch {
      // Graceful fallback if customer fetch fails or forbidden
    }
    return null;
  }

  async listOrders(query?: RepairOrderListQuery): Promise<RepairOrderListResult> {
    const searchParams = new URLSearchParams();
    if (query?.status && query.status.trim()) {
      searchParams.set('status', query.status.trim());
    }
    if (query?.query && query.query.trim()) {
      searchParams.set('query', query.query.trim());
    }
    if (query?.customerId && query.customerId.trim()) {
      searchParams.set('customerId', query.customerId.trim());
    }
    if (query?.deviceId && query.deviceId.trim()) {
      searchParams.set('deviceId', query.deviceId.trim());
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/repair-orders?${queryString}` : '/api/repair-orders';

    const response = await this.client.request<{
      data: ServerRepairOrderResponse[];
      meta?: { requestId?: string };
    }>(endpoint, {
      method: 'GET',
      signal: query?.signal,
    });

    const rawOrders = response.data || [];

    // Concurrently populate customer cache for distinct customer IDs in view
    const distinctCustomerIds = Array.from(new Set(rawOrders.map((o) => o.customerId)));
    await Promise.all(
      distinctCustomerIds
        .filter((id) => !this.customerCache.has(id))
        .map((id) => this.resolveCustomer(id)),
    );

    const summaries: RepairOrderSummaryDto[] = rawOrders.map((raw) => {
      const customer = this.customerCache.get(raw.customerId);
      const primaryAssignment =
        raw.assignments?.find((a) => a.isPrimary) || raw.assignments?.[0];

      let primaryDeviceName = raw.customerDescription || 'Thiết bị tiếp nhận';
      let extraDevicesCount = 0;

      if (raw.repairItems && raw.repairItems.length > 0) {
        const first = raw.repairItems[0];
        primaryDeviceName = `${first.brand} ${first.model}`.trim();
        extraDevicesCount = Math.max(0, raw.repairItems.length - 1);
      }

      return {
        id: raw.id,
        orderCode: raw.orderCode,
        customerId: raw.customerId,
        customerName: customer?.name || 'Khách hàng',
        customerPhone: customer?.phone || '—',
        deviceId: raw.deviceId,
        status: raw.status,
        customerDescription: raw.customerDescription,
        receivedAt: raw.receivedAt,
        expectedCompletedAt: raw.expectedCompletedAt,
        completedAt: raw.completedAt,
        cancelledAt: raw.cancelledAt,
        createdBy: raw.createdBy,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        primaryDeviceName,
        extraDevicesCount,
        assignedStaffName: primaryAssignment?.staffProfileName || null,
      };
    });

    return {
      orders: summaries,
      totalCount: summaries.length,
    };
  }

  async getOrder(
    orderId: string,
    options?: { signal?: AbortSignal },
  ): Promise<RepairOrderDetailDto> {
    const response = await this.client.request<{
      data: ServerRepairOrderResponse;
      meta?: { requestId?: string };
    }>(`/api/repair-orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      signal: options?.signal,
    });

    if (!response.data) {
      throw new ApiClientError('Không tìm thấy thông tin phiếu sửa chữa.', 404, 'not_found');
    }

    const raw = response.data;
    const customer = await this.resolveCustomer(raw.customerId);

    return {
      id: raw.id,
      orderCode: raw.orderCode,
      customerId: raw.customerId,
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            note: customer.note,
          }
        : null,
      deviceId: raw.deviceId,
      status: raw.status,
      customerDescription: raw.customerDescription,
      receivedAt: raw.receivedAt,
      expectedCompletedAt: raw.expectedCompletedAt,
      completedAt: raw.completedAt,
      cancelledAt: raw.cancelledAt,
      createdBy: raw.createdBy,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      assignments: raw.assignments || [],
      statusHistory: raw.statusHistory || [],
      openOrderWarnings: raw.openOrderWarnings || null,
      repairItems: raw.repairItems || [],
    };
  }
}

export class MockRepairOrderAdapter implements RepairOrderApi {
  private mockDetails: RepairOrderDetailDto[] = [
    {
      id: 'ord-001',
      orderCode: 'RF-2026-0001',
      customerId: 'cust-001',
      customer: {
        id: 'cust-001',
        name: 'Nguyễn Văn An',
        phone: '0912345678',
        email: 'an.nguyen@example.com',
        note: 'Khách hàng thân thiết, ưu tiên tiếp nhận nhanh',
      },
      deviceId: 'dev-001',
      status: 'received',
      customerDescription: 'Apple iPhone 13 vỡ mặt kính trước và iPad Air 5 không nhận sạc',
      receivedAt: '2026-09-20T08:30:00Z',
      expectedCompletedAt: '2026-09-25T17:00:00Z',
      completedAt: null,
      cancelledAt: null,
      createdBy: 'staff-linh',
      createdAt: '2026-09-20T08:30:00Z',
      updatedAt: '2026-09-20T08:30:00Z',
      assignments: [
        {
          id: 'asg-001',
          staffProfileId: 'staff-linh',
          staffProfileName: 'Linh Trần (Lễ tân)',
          responsibility: 'intake',
          isPrimary: true,
          assignedAt: '2026-09-20T08:30:00Z',
          completedAt: null,
          note: 'Tiếp nhận 2 thiết bị tại quầy',
        },
      ],
      statusHistory: [
        {
          id: 'sth-001',
          fromStatus: null,
          toStatus: 'received',
          changedBy: 'staff-linh',
          reason: 'Hoàn tất tiếp nhận tại quầy giao dịch',
          createdAt: '2026-09-20T08:30:00Z',
        },
      ],
      openOrderWarnings: null,
      repairItems: [
        {
          id: 'item-001',
          itemIndex: 1,
          deviceId: 'dev-001',
          status: 'received',
          deviceType: 'Điện thoại',
          brand: 'Apple',
          model: 'iPhone 13',
          serialNumber: 'SN-APL-13009',
          identifier: 'IMEI: 356789012345678',
          reportedIssue: 'Rơi vỡ mặt kính góc trên bên phải, cảm ứng đôi lúc chập chờn',
          handoverCondition: 'Viền máy trầy xước nhẹ, mặt lưng nguyên vẹn',
          accessories: 'Ốp lưng silicon, cáp sạc Lightning',
          itemNotes: 'Khách yêu cầu kiểm tra kỹ cảm ứng màn hình trước khi ép kính',
          credentialStatus: 'customer_unlocked_device',
          credentialConsent: true,
          credentialReceivedAt: '2026-09-20T08:30:00Z',
          credentialExpiresAt: '2026-10-20T08:30:00Z',
          credentialDestroyedAt: null,
        },
        {
          id: 'item-002',
          itemIndex: 2,
          deviceId: 'dev-002',
          status: 'received',
          deviceType: 'Máy tính bảng',
          brand: 'Apple',
          model: 'iPad Air 5',
          serialNumber: 'SN-APL-AIR502',
          identifier: 'Serial: DMPT789KL01',
          reportedIssue: 'Cắm sạc không báo gì, đã thử đổi 2 củ sạc khác nhau',
          handoverCondition: 'Máy đẹp, không cấn móp, có dán kính cường lực',
          accessories: 'Bao da Smart Folio màu xanh',
          itemNotes: 'Khách cần dữ liệu ghi chú GoodNotes cho công việc',
          credentialStatus: 'encrypted_stored',
          credentialConsent: true,
          credentialReceivedAt: '2026-09-20T08:30:00Z',
          credentialExpiresAt: '2026-10-20T08:30:00Z',
          credentialDestroyedAt: null,
        },
      ],
    },
    {
      id: 'ord-002',
      orderCode: 'RF-2026-0002',
      customerId: 'cust-002',
      customer: {
        id: 'cust-002',
        name: 'Trần Thị Mai',
        phone: '0987654321',
        email: 'mai.tran@example.com',
        note: 'Thường mang iPhone và iPad đến vệ sinh bảo dưỡng',
      },
      deviceId: 'dev-003',
      status: 'diagnosing',
      customerDescription: 'Samsung Galaxy S22 Ultra sụt pin nhanh',
      receivedAt: '2026-09-19T14:15:00Z',
      expectedCompletedAt: '2026-09-22T12:00:00Z',
      completedAt: null,
      cancelledAt: null,
      createdBy: 'staff-linh',
      createdAt: '2026-09-19T14:15:00Z',
      updatedAt: '2026-09-20T09:00:00Z',
      assignments: [
        {
          id: 'asg-002',
          staffProfileId: 'staff-nam',
          staffProfileName: 'Nam Hoàng (Kỹ thuật viên)',
          responsibility: 'diagnosis',
          isPrimary: true,
          assignedAt: '2026-09-20T08:00:00Z',
          completedAt: null,
          note: 'Đang đo dòng xả và kiểm tra mainboard',
        },
      ],
      statusHistory: [
        {
          id: 'sth-002a',
          fromStatus: null,
          toStatus: 'received',
          changedBy: 'staff-linh',
          reason: 'Tiếp nhận thiết bị',
          createdAt: '2026-09-19T14:15:00Z',
        },
        {
          id: 'sth-002b',
          fromStatus: 'received',
          toStatus: 'diagnosing',
          changedBy: 'staff-nam',
          reason: 'Kỹ thuật viên bắt đầu đo đạc chẩn đoán',
          createdAt: '2026-09-20T09:00:00Z',
        },
      ],
      openOrderWarnings: null,
      repairItems: [
        {
          id: 'item-003',
          itemIndex: 1,
          deviceId: 'dev-003',
          status: 'diagnosing',
          deviceType: 'Điện thoại',
          brand: 'Samsung',
          model: 'Galaxy S22 Ultra',
          serialNumber: 'SN-SS-S22U99',
          identifier: 'IMEI: 358901234567890',
          reportedIssue: 'Pin tụt từ 100% xuống 20% trong 2 tiếng, máy rất nóng khu vực gần camera',
          handoverCondition: 'Khung máy xước viền, bút S-Pen theo máy nguyên vẹn',
          accessories: 'Hộp máy zin, bút S-Pen',
          itemNotes: 'Đề nghị đo dòng xem có bị chạm IC sạc hay ăn nguồn ngầm',
          credentialStatus: 'customer_unlocked_device',
          credentialConsent: true,
          credentialReceivedAt: '2026-09-19T14:15:00Z',
          credentialExpiresAt: '2026-10-19T14:15:00Z',
          credentialDestroyedAt: null,
        },
      ],
    },
    {
      id: 'ord-003',
      orderCode: 'RF-2026-0003',
      customerId: 'cust-003',
      customer: {
        id: 'cust-003',
        name: 'Lê Hoàng Long',
        phone: '0903112233',
        email: null,
        note: 'Yêu cầu liên hệ qua điện thoại hoặc tin nhắn SMS',
      },
      deviceId: 'dev-004',
      status: 'waiting_for_approval',
      customerDescription: 'MacBook Pro 14 M1 Pro bị đổ nước cà phê',
      receivedAt: '2026-09-18T10:00:00Z',
      expectedCompletedAt: '2026-09-24T18:00:00Z',
      completedAt: null,
      cancelledAt: null,
      createdBy: 'staff-linh',
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-09-19T16:30:00Z',
      assignments: [
        {
          id: 'asg-003',
          staffProfileId: 'staff-nam',
          staffProfileName: 'Nam Hoàng (Kỹ thuật viên)',
          responsibility: 'diagnosis',
          isPrimary: true,
          assignedAt: '2026-09-18T11:00:00Z',
          completedAt: '2026-09-19T16:30:00Z',
          note: 'Đã vệ sinh sấy khô và gửi báo giá thay cụm bàn phím',
        },
      ],
      statusHistory: [
        {
          id: 'sth-003a',
          fromStatus: null,
          toStatus: 'received',
          changedBy: 'staff-linh',
          reason: 'Tiếp nhận máy dính nước',
          createdAt: '2026-09-18T10:00:00Z',
        },
        {
          id: 'sth-003b',
          fromStatus: 'received',
          toStatus: 'diagnosing',
          changedBy: 'staff-nam',
          reason: 'Bung máy vệ sinh chống oxy hóa',
          createdAt: '2026-09-18T11:30:00Z',
        },
        {
          id: 'sth-003c',
          fromStatus: 'diagnosing',
          toStatus: 'waiting_for_approval',
          changedBy: 'staff-nam',
          reason: 'Đã hoàn tất chẩn đoán, chờ khách duyệt phương án',
          createdAt: '2026-09-19T16:30:00Z',
        },
      ],
      openOrderWarnings: null,
      repairItems: [
        {
          id: 'item-004',
          itemIndex: 1,
          deviceId: 'dev-004',
          status: 'waiting_for_approval',
          deviceType: 'Laptop',
          brand: 'Apple',
          model: 'MacBook Pro 14 M1 Pro',
          serialNumber: 'SN-APL-MBP14M1',
          identifier: 'Serial: C02G9988MD6R',
          reportedIssue: 'Bị đổ một ít cà phê lên bàn phím, một số phím bị kẹt rít, máy đã tắt nguồn ngay lập tức',
          handoverCondition: 'Bàn phím có vệt cà phê khô, màn hình và vỏ máy không trầy xước',
          accessories: 'Củ sạc MagSafe 67W, cáp dù MagSafe 3',
          itemNotes: 'Mainboard chưa bị ngấm sâu, cần thay cụm topcase bàn phím',
          credentialStatus: 'not_required',
          credentialConsent: false,
          credentialReceivedAt: null,
          credentialExpiresAt: null,
          credentialDestroyedAt: null,
        },
      ],
    },
    {
      id: 'ord-004',
      orderCode: 'RF-2026-0004',
      customerId: 'cust-004',
      customer: {
        id: 'cust-004',
        name: 'Phạm Minh Tuấn',
        phone: '0978998877',
        email: 'tuan.pham@company.vn',
        note: 'Khách hàng doanh nghiệp, cần xuất biên lai đỏ nếu có',
      },
      deviceId: 'dev-005',
      status: 'approved',
      customerDescription: 'Dell XPS 15 9520 hỏng quạt tản nhiệt bên phải',
      receivedAt: '2026-09-17T09:30:00Z',
      expectedCompletedAt: '2026-09-22T17:00:00Z',
      completedAt: null,
      cancelledAt: null,
      createdBy: 'staff-linh',
      createdAt: '2026-09-17T09:30:00Z',
      updatedAt: '2026-09-18T14:00:00Z',
      assignments: [
        {
          id: 'asg-004',
          staffProfileId: 'staff-nam',
          staffProfileName: 'Nam Hoàng (Kỹ thuật viên)',
          responsibility: 'repairer',
          isPrimary: true,
          assignedAt: '2026-09-18T14:30:00Z',
          completedAt: null,
          note: 'Chờ linh kiện quạt chính hãng về lắp ráp',
        },
      ],
      statusHistory: [
        {
          id: 'sth-004a',
          fromStatus: null,
          toStatus: 'received',
          changedBy: 'staff-linh',
          reason: 'Tiếp nhận máy doanh nghiệp',
          createdAt: '2026-09-17T09:30:00Z',
        },
        {
          id: 'sth-004b',
          fromStatus: 'received',
          toStatus: 'approved',
          changedBy: 'staff-linh',
          reason: 'Khách hàng đã ký hợp đồng duyệt chi phí sửa chữa',
          createdAt: '2026-09-18T14:00:00Z',
        },
      ],
      openOrderWarnings: null,
      repairItems: [
        {
          id: 'item-005',
          itemIndex: 1,
          deviceId: 'dev-005',
          status: 'approved',
          deviceType: 'Laptop',
          brand: 'Dell',
          model: 'XPS 15 9520',
          serialNumber: 'SN-DELL-XPS952',
          identifier: 'Service Tag: 8G7B9X2',
          reportedIssue: 'Quạt bên phải kêu rè rè lớn và rung thân máy khi tải nặng, nhiệt độ CPU cao',
          handoverCondition: 'Máy có dán skin carbon, đế cao su mòn đều',
          accessories: 'Sạc Type-C 130W theo máy',
          itemNotes: 'Thay cụm quạt GPU và tra keo tản nhiệt gốm cao cấp',
          credentialStatus: 'encrypted_stored',
          credentialConsent: true,
          credentialReceivedAt: '2026-09-17T09:30:00Z',
          credentialExpiresAt: '2026-10-17T09:30:00Z',
          credentialDestroyedAt: null,
        },
      ],
    },
    {
      id: 'ord-005',
      orderCode: 'RF-2026-0005',
      customerId: 'cust-005',
      customer: {
        id: 'cust-005',
        name: 'Đặng Thanh Hà',
        phone: '0934556677',
        email: 'ha.dang@gmail.com',
        note: null,
      },
      deviceId: 'dev-006',
      status: 'ready_for_pickup',
      customerDescription: 'Apple Watch Series 8 thay pin dung lượng chuẩn',
      receivedAt: '2026-09-16T11:00:00Z',
      expectedCompletedAt: '2026-09-18T16:00:00Z',
      completedAt: null,
      cancelledAt: null,
      createdBy: 'staff-linh',
      createdAt: '2026-09-16T11:00:00Z',
      updatedAt: '2026-09-18T15:30:00Z',
      assignments: [
        {
          id: 'asg-005',
          staffProfileId: 'staff-linh',
          staffProfileName: 'Linh Trần (Lễ tân)',
          responsibility: 'handover',
          isPrimary: true,
          assignedAt: '2026-09-18T15:30:00Z',
          completedAt: null,
          note: 'Thiết bị đã kiểm tra QC đạt chuẩn, chờ khách đến nhận',
        },
      ],
      statusHistory: [
        {
          id: 'sth-005a',
          fromStatus: null,
          toStatus: 'received',
          changedBy: 'staff-linh',
          reason: 'Tiếp nhận thay pin đồng hồ',
          createdAt: '2026-09-16T11:00:00Z',
        },
        {
          id: 'sth-005b',
          fromStatus: 'received',
          toStatus: 'ready_for_pickup',
          changedBy: 'staff-nam',
          reason: 'QC đạt chuẩn chống nước, hoàn tất dán keo kháng nước',
          createdAt: '2026-09-18T15:30:00Z',
        },
      ],
      openOrderWarnings: null,
      repairItems: [
        {
          id: 'item-006',
          itemIndex: 1,
          deviceId: 'dev-006',
          status: 'ready_for_pickup',
          deviceType: 'Đồng hồ thông minh',
          brand: 'Apple',
          model: 'Watch Series 8 45mm',
          serialNumber: 'SN-APL-W845',
          identifier: 'Serial: H7GD98KL3',
          reportedIssue: 'Pin báo bảo trì 74%, pin phù nhẹ làm kênh nhẹ viền màn hình',
          handoverCondition: 'Thân nhôm màu đen Starlight, không dây đeo đi kèm',
          accessories: 'Chỉ nhận mặt đồng hồ, không nhận dây và đế sạc',
          itemNotes: 'Đã thay pin zin mới, dung lượng 100%, dán keo viền kháng nước áp suất',
          credentialStatus: 'customer_unlocked_device',
          credentialConsent: true,
          credentialReceivedAt: '2026-09-16T11:00:00Z',
          credentialExpiresAt: '2026-10-16T11:00:00Z',
          credentialDestroyedAt: null,
        },
      ],
    },
  ];

  async listOrders(query?: RepairOrderListQuery): Promise<RepairOrderListResult> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const q = query?.query?.trim().toLowerCase();
    const status = query?.status?.trim().toLowerCase();

    let filtered = this.mockDetails;

    if (status) {
      filtered = filtered.filter((o) => o.status.toLowerCase() === status);
    }

    if (q) {
      filtered = filtered.filter((o) => {
        const matchCode = o.orderCode.toLowerCase().includes(q);
        const matchCust = o.customer?.name.toLowerCase().includes(q) || false;
        const matchPhone = o.customer?.phone.includes(q) || false;
        const matchDesc = o.customerDescription.toLowerCase().includes(q);
        const matchItems = o.repairItems.some(
          (item) =>
            item.brand.toLowerCase().includes(q) ||
            item.model.toLowerCase().includes(q) ||
            item.reportedIssue.toLowerCase().includes(q),
        );
        return matchCode || matchCust || matchPhone || matchDesc || matchItems;
      });
    }

    const summaries: RepairOrderSummaryDto[] = filtered.map((detail) => {
      const primaryAssignment =
        detail.assignments.find((a) => a.isPrimary) || detail.assignments[0];
      const firstItem = detail.repairItems[0];
      const primaryDeviceName = firstItem
        ? `${firstItem.brand} ${firstItem.model}`
        : detail.customerDescription;
      const extraDevicesCount = Math.max(0, detail.repairItems.length - 1);

      return {
        id: detail.id,
        orderCode: detail.orderCode,
        customerId: detail.customerId,
        customerName: detail.customer?.name || 'Khách hàng',
        customerPhone: detail.customer?.phone || '—',
        deviceId: detail.deviceId,
        status: detail.status,
        customerDescription: detail.customerDescription,
        receivedAt: detail.receivedAt,
        expectedCompletedAt: detail.expectedCompletedAt,
        completedAt: detail.completedAt,
        cancelledAt: detail.cancelledAt,
        createdBy: detail.createdBy,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
        primaryDeviceName,
        extraDevicesCount,
        assignedStaffName: primaryAssignment?.staffProfileName || null,
      };
    });

    return {
      orders: summaries,
      totalCount: summaries.length,
    };
  }

  async getOrder(
    orderId: string,
    _options?: { signal?: AbortSignal },
  ): Promise<RepairOrderDetailDto> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const found = this.mockDetails.find(
      (o) => o.id === orderId || o.orderCode.toLowerCase() === orderId.toLowerCase(),
    );
    if (!found) {
      throw new ApiClientError('Không tìm thấy phiếu sửa chữa yêu cầu.', 404, 'not_found');
    }
    return found;
  }
}

export function getRepairOrderAdapter(
  previewMode = runtimeConfig.previewMode,
): RepairOrderApi {
  if (previewMode) {
    return new MockRepairOrderAdapter();
  }
  const client = createApiClient(runtimeConfig.apiBaseUrl, runtimeConfig.apiTimeoutMs);
  return new RealRepairOrderAdapter(client);
}
