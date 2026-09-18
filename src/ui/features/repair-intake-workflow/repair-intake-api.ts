import { runtimeConfig } from '../../config/runtime-config';
import { createApiClient, ApiClientError, type ApiClient } from '../../shared/api/api-client';
import { MOCK_CUSTOMERS, type MockCustomerRecord } from '../../mocks/customer-mock-data';

export interface CustomerDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceIntakePayload {
  type: string;
  brand: string;
  model: string;
  serialNumber?: string | null;
  identifier?: string | null;
}

export interface CredentialIntakePayload {
  status: string;
  value?: string | null;
  consent: boolean;
}

export interface RepairItemIntakePayload {
  device: DeviceIntakePayload;
  reportedIssue: string;
  handoverCondition?: string | null;
  accessories?: string | null;
  itemNotes?: string | null;
  credential?: CredentialIntakePayload | null;
  photos?: string[];
}

export interface CustomerIntakePayload {
  mode: 'existing' | 'new';
  id?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  note?: string | null;
}

export interface RepairOrderIntakePayload {
  intakeNotes?: string | null;
}

export interface CreateRepairIntakePayload {
  customer: CustomerIntakePayload;
  repairItems: RepairItemIntakePayload[];
  repairOrder: RepairOrderIntakePayload;
  intakeStaffId?: string | null;
  expectedCompletedAt?: string | null;
}

export interface RepairItemDto {
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
  photos?: string[];
}

export interface RepairOrderDto {
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
  repairItems?: RepairItemDto[];
}

export interface RepairIntakeResultDto {
  customer: CustomerDto;
  repairOrder: RepairOrderDto;
  repairItems: RepairItemDto[];
}

export interface SearchCustomersQuery {
  query?: string;
  phone?: string;
  email?: string;
  signal?: AbortSignal;
}

export interface RepairIntakeApi {
  searchCustomers(params?: SearchCustomersQuery): Promise<CustomerDto[]>;
  submitIntake(payload: CreateRepairIntakePayload, idempotencyKey: string): Promise<RepairIntakeResultDto>;
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

export class RealRepairIntakeAdapter implements RepairIntakeApi {
  constructor(private readonly client: ApiClient) {}

  async searchCustomers(params?: SearchCustomersQuery): Promise<CustomerDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.query && params.query.trim()) {
      searchParams.set('query', params.query.trim());
    }
    if (params?.phone && params.phone.trim()) {
      searchParams.set('phone', params.phone.trim());
    }
    if (params?.email && params.email.trim()) {
      searchParams.set('email', params.email.trim());
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/customers?${queryString}` : '/api/customers';

    const response = await this.client.request<{
      data: CustomerDto[];
      meta?: { requestId?: string };
    }>(endpoint, {
      method: 'GET',
      signal: params?.signal,
    });

    return response.data || [];
  }

  async submitIntake(
    payload: CreateRepairIntakePayload,
    idempotencyKey: string,
  ): Promise<RepairIntakeResultDto> {
    const response = await this.client.request<{
      data: RepairIntakeResultDto;
      meta?: { requestId?: string };
    }>('/api/repair-orders/intake', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.data) {
      throw new ApiClientError('Hệ thống không trả về dữ liệu tiếp nhận.', 500, 'empty_response');
    }

    return response.data;
  }
}

export class MockRepairIntakeAdapter implements RepairIntakeApi {
  private records: MockCustomerRecord[] = [...MOCK_CUSTOMERS];

  async searchCustomers(params?: SearchCustomersQuery): Promise<CustomerDto[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const q = params?.query?.trim().toLowerCase();
    const phone = params?.phone?.replace(/\D/g, '');
    const email = params?.email?.trim().toLowerCase();

    return this.records.filter((customer) => {
      if (phone) {
        const itemPhone = customer.phone.replace(/\D/g, '');
        if (!itemPhone.includes(phone)) return false;
      }
      if (email) {
        const itemEmail = customer.email?.toLowerCase() ?? '';
        if (!itemEmail.includes(email)) return false;
      }
      if (q) {
        const matchName = customer.name.toLowerCase().includes(q);
        const matchEmail = customer.email?.toLowerCase().includes(q) ?? false;
        const matchPhone = customer.phone.includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }

  async submitIntake(
    _payload: CreateRepairIntakePayload,
    _idempotencyKey: string,
  ): Promise<RepairIntakeResultDto> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Preview mode is strictly read-only and never creates real records
    throw new ApiClientError(
      'Chế độ xem trước (Preview) là chỉ đọc. Không thể tạo phiếu sửa chữa thực tế.',
      403,
      'preview_readonly',
    );
  }
}

export function getRepairIntakeAdapter(
  previewMode = runtimeConfig.previewMode,
): RepairIntakeApi {
  if (previewMode) {
    return new MockRepairIntakeAdapter();
  }
  const client = createApiClient(runtimeConfig.apiBaseUrl, runtimeConfig.apiTimeoutMs);
  return new RealRepairIntakeAdapter(client);
}
