import { runtimeConfig } from '../../config/runtime-config';
import { createApiClient, ApiClientError, type ApiClient } from '../../shared/api/api-client';
import { MOCK_CUSTOMERS, type MockCustomerRecord } from '../../mocks/customer-mock-data';

export interface CustomerDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string | null;
  note?: string | null;
}

export interface SearchCustomersQuery {
  query?: string;
  phone?: string;
  signal?: AbortSignal;
}

export interface CustomerRecordsApi {
  searchCustomers(params?: SearchCustomersQuery): Promise<CustomerDto[]>;
  createCustomer(payload: CreateCustomerPayload): Promise<CustomerDto>;
  getCustomer(customerId: string, options?: { signal?: AbortSignal }): Promise<CustomerDto>;
}

export class RealCustomerRecordsAdapter implements CustomerRecordsApi {
  constructor(private readonly client: ApiClient) {}

  async searchCustomers(params?: SearchCustomersQuery): Promise<CustomerDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.query && params.query.trim()) {
      searchParams.set('query', params.query.trim());
    }
    if (params?.phone && params.phone.trim()) {
      searchParams.set('phone', params.phone.trim());
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

  async createCustomer(payload: CreateCustomerPayload): Promise<CustomerDto> {
    const response = await this.client.request<{
      data: CustomerDto;
      meta?: { requestId?: string };
    }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: payload.email?.trim() || null,
        note: payload.note?.trim() || null,
      }),
    });

    return response.data;
  }

  async getCustomer(customerId: string, options?: { signal?: AbortSignal }): Promise<CustomerDto> {
    const response = await this.client.request<{
      data: CustomerDto;
      meta?: { requestId?: string };
    }>(`/api/customers/${encodeURIComponent(customerId)}`, {
      method: 'GET',
      signal: options?.signal,
    });

    return response.data;
  }
}

export class MockCustomerRecordsAdapter implements CustomerRecordsApi {
  private records: MockCustomerRecord[] = [...MOCK_CUSTOMERS];

  async searchCustomers(params?: SearchCustomersQuery): Promise<CustomerDto[]> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const q = params?.query?.trim().toLowerCase();
    const phone = params?.phone?.replace(/\D/g, '');

    return this.records.filter((customer) => {
      if (phone) {
        const itemPhone = customer.phone.replace(/\D/g, '');
        if (!itemPhone.includes(phone)) return false;
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

  async createCustomer(_payload: CreateCustomerPayload): Promise<CustomerDto> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    throw new ApiClientError(
      'Chế độ xem trước (Preview) là chỉ đọc. Không thể thêm khách hàng mới.',
      403,
      'preview_readonly',
    );
  }

  async getCustomer(customerId: string): Promise<CustomerDto> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const customer = this.records.find((c) => c.id === customerId);
    if (!customer) {
      throw new ApiClientError('Không tìm thấy hồ sơ khách hàng.', 404, 'not_found');
    }
    return customer;
  }
}

export function getCustomerRecordsAdapter(
  previewMode = runtimeConfig.previewMode,
): CustomerRecordsApi {
  if (previewMode) {
    return new MockCustomerRecordsAdapter();
  }
  const client = createApiClient(runtimeConfig.apiBaseUrl, runtimeConfig.apiTimeoutMs);
  return new RealCustomerRecordsAdapter(client);
}
