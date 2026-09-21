import { runtimeConfig } from '../../config/runtime-config';
import { createApiClient, ApiClientError, type ApiClient } from './api-client';

export interface TagDto {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RepairItemTagsResponseDto {
  repairOrderId: string;
  repairItemId: string;
  orderStatus: string;
  tags: TagDto[];
}

export interface SearchTagsQuery {
  query?: string;
  includeUnused?: boolean;
  signal?: AbortSignal;
}

export interface CreateTagPayload {
  name: string;
}

export interface RenameTagPayload {
  name: string;
}

export interface ReplaceItemTagsPayload {
  tagIds: string[];
}

export interface TagConflictDetails {
  existingTagId?: string;
  existingTag?: TagDto;
}

export interface RepairTagApi {
  searchTags(params?: SearchTagsQuery): Promise<TagDto[]>;
  createTag(payload: CreateTagPayload): Promise<TagDto>;
  renameTag(tagId: string, payload: RenameTagPayload): Promise<TagDto>;
  deleteTag(tagId: string): Promise<void>;
  replaceItemTags(
    orderId: string,
    itemId: string,
    payload: ReplaceItemTagsPayload,
  ): Promise<RepairItemTagsResponseDto>;
}

export class RealRepairTagAdapter implements RepairTagApi {
  constructor(private readonly client: ApiClient) {}

  async searchTags(params?: SearchTagsQuery): Promise<TagDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.query && params.query.trim()) {
      searchParams.set('query', params.query.trim());
    }
    const includeUnused = params?.includeUnused ?? true;
    searchParams.set('includeUnused', String(includeUnused));

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/tags?${queryString}` : '/api/tags';

    const response = await this.client.request<{
      data: TagDto[];
      meta?: { requestId?: string };
    }>(endpoint, {
      method: 'GET',
      signal: params?.signal,
    });

    return response.data || [];
  }

  async createTag(payload: CreateTagPayload): Promise<TagDto> {
    const response = await this.client.request<{
      data: TagDto;
      meta?: { requestId?: string };
    }>('/api/tags', {
      method: 'POST',
      body: JSON.stringify({ name: payload.name.trim() }),
    });

    if (!response.data) {
      throw new ApiClientError('Không nhận được thông tin nhãn sau khi tạo.', 500, 'empty_response');
    }

    return response.data;
  }

  async renameTag(tagId: string, payload: RenameTagPayload): Promise<TagDto> {
    const response = await this.client.request<{
      data: TagDto;
      meta?: { requestId?: string };
    }>(`/api/tags/${encodeURIComponent(tagId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: payload.name.trim() }),
    });

    if (!response.data) {
      throw new ApiClientError('Không nhận được thông tin nhãn sau khi đổi tên.', 500, 'empty_response');
    }

    return response.data;
  }

  async deleteTag(tagId: string): Promise<void> {
    await this.client.request<void>(`/api/tags/${encodeURIComponent(tagId)}`, {
      method: 'DELETE',
    });
  }

  async replaceItemTags(
    orderId: string,
    itemId: string,
    payload: ReplaceItemTagsPayload,
  ): Promise<RepairItemTagsResponseDto> {
    const response = await this.client.request<{
      data: RepairItemTagsResponseDto;
      meta?: { requestId?: string };
    }>(`/api/repair-orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tagIds: payload.tagIds }),
    });

    if (!response.data) {
      throw new ApiClientError('Không nhận được dữ liệu gán nhãn.', 500, 'empty_response');
    }

    return response.data;
  }
}

export class MockRepairTagAdapter implements RepairTagApi {
  private tags: TagDto[] = [
    { id: 'tag-mock-1', name: 'Android', createdAt: '2026-09-20T08:00:00Z', updatedAt: '2026-09-20T08:00:00Z' },
    { id: 'tag-mock-2', name: 'iOS', createdAt: '2026-09-20T08:00:00Z', updatedAt: '2026-09-20T08:00:00Z' },
    { id: 'tag-mock-3', name: 'Màn hình lỗi', createdAt: '2026-09-20T08:00:00Z', updatedAt: '2026-09-20T08:00:00Z' },
    { id: 'tag-mock-4', name: 'Pin chai', createdAt: '2026-09-20T08:00:00Z', updatedAt: '2026-09-20T08:00:00Z' },
    { id: 'tag-mock-5', name: 'Vào nước', createdAt: '2026-09-20T08:00:00Z', updatedAt: '2026-09-20T08:00:00Z' },
    { id: 'tag-mock-6', name: 'Máy đơ treo', createdAt: '2026-09-20T08:00:00Z', updatedAt: '2026-09-20T08:00:00Z' },
    { id: 'tag-mock-7', name: 'Ưu tiên cao', createdAt: '2026-09-20T08:00:00Z', updatedAt: '2026-09-20T08:00:00Z' },
  ];

  // In-use tag mock reference to simulate TAG_IN_USE
  private inUseTagIds = new Set<string>(['tag-mock-1', 'tag-mock-3']);

  async searchTags(params?: SearchTagsQuery): Promise<TagDto[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const q = params?.query?.trim().toLowerCase();
    if (!q) {
      return [...this.tags];
    }
    return this.tags.filter((t) => t.name.toLowerCase().includes(q));
  }

  async createTag(payload: CreateTagPayload): Promise<TagDto> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const name = payload.name.trim();
    if (!name) {
      throw new ApiClientError('Tên nhãn không được để trống.', 400, 'TAG_NAME_REQUIRED');
    }
    if (name.length > 64) {
      throw new ApiClientError('Tên nhãn tối đa 64 ký tự.', 400, 'TAG_NAME_TOO_LONG');
    }

    const existing = this.tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      throw new ApiClientError(
        'Nhãn có tên này đã tồn tại trong workspace.',
        409,
        'TAG_NAME_EXISTS',
        {
          existingTagId: existing.id,
          existingTag: existing,
        },
      );
    }

    const newTag: TagDto = {
      id: `tag-mock-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tags.push(newTag);
    return newTag;
  }

  async renameTag(tagId: string, payload: RenameTagPayload): Promise<TagDto> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const name = payload.name.trim();
    if (!name) {
      throw new ApiClientError('Tên nhãn không được để trống.', 400, 'TAG_NAME_REQUIRED');
    }
    const idx = this.tags.findIndex((t) => t.id === tagId);
    if (idx === -1) {
      throw new ApiClientError('Không tìm thấy nhãn.', 404, 'not_found');
    }

    const duplicate = this.tags.find((t) => t.id !== tagId && t.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      throw new ApiClientError(
        'Nhãn có tên này đã tồn tại trong workspace.',
        409,
        'TAG_NAME_EXISTS',
        {
          existingTagId: duplicate.id,
          existingTag: duplicate,
        },
      );
    }

    const updated: TagDto = {
      ...this.tags[idx],
      name,
      updatedAt: new Date().toISOString(),
    };
    this.tags[idx] = updated;
    return updated;
  }

  async deleteTag(tagId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    if (this.inUseTagIds.has(tagId)) {
      throw new ApiClientError(
        'Nhãn không thể xóa vì đang được gán trên thiết bị sửa chữa.',
        409,
        'TAG_IN_USE',
      );
    }
    const idx = this.tags.findIndex((t) => t.id === tagId);
    if (idx === -1) {
      throw new ApiClientError('Không tìm thấy nhãn.', 404, 'not_found');
    }
    this.tags.splice(idx, 1);
  }

  async replaceItemTags(
    orderId: string,
    itemId: string,
    payload: ReplaceItemTagsPayload,
  ): Promise<RepairItemTagsResponseDto> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const selected = this.tags.filter((t) => payload.tagIds.includes(t.id));
    return {
      repairOrderId: orderId,
      repairItemId: itemId,
      orderStatus: 'received',
      tags: selected,
    };
  }
}

export function getRepairTagAdapter(
  previewMode = runtimeConfig.previewMode,
): RepairTagApi {
  if (previewMode) {
    return new MockRepairTagAdapter();
  }
  const client = createApiClient(runtimeConfig.apiBaseUrl, runtimeConfig.apiTimeoutMs);
  return new RealRepairTagAdapter(client);
}
