import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { AreaMountContext } from '../../app/area-boundary';
import {
  getRepairTagAdapter,
  type RepairTagApi,
  type TagDto,
} from '../../shared/api/repair-tag-api';
import { ApiClientError } from '../../shared/api/api-client';
import { Alert, SkeletonLoader } from '../../shared/components';
import {
  IconPlus,
  IconClose,
  IconRefresh,
  IconTrash,
  IconTag,
  IconCheck,
} from '../../shared/components/icons';
import { ForbiddenState } from '../../shared/components/forbidden-state';
import './tag-management.css';

export interface TagManagementPageProps {
  context: AreaMountContext;
  previewMode?: boolean;
  apiOverride?: RepairTagApi;
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function TagManagementPage({
  context,
  previewMode = false,
  apiOverride,
}: TagManagementPageProps): ReactNode {
  const tagApi = useMemo(
    () => apiOverride || getRepairTagAdapter(previewMode),
    [apiOverride, previewMode],
  );

  const canManage = context.capabilities.canManageWorkspaceTags;

  const [tags, setTags] = useState<TagDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  // Create Tag State
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Rename Tag State
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Delete Tag State
  const [confirmDeleteTagId, setConfirmDeleteTagId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const data = await tagApi.searchTags({ includeUnused: true });
      setTags(data);
    } catch (err: unknown) {
      setGlobalError(
        err instanceof Error ? err.message : 'Không thể tải danh sách nhãn workspace.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [tagApi]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Security guard: If user lacks canManageWorkspaceTags, render ForbiddenState
  if (!canManage) {
    return (
      <ForbiddenState
        roleTitle={context.activeRole}
        attemptedRoute="#/tags"
        onGoHome={() => {
          window.location.hash = '#/dashboard';
        }}
      />
    );
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) {
      setCreateError('Vui lòng nhập tên nhãn.');
      return;
    }
    if (trimmed.length > 50) {
      setCreateError('Tên nhãn không được vượt quá 50 ký tự.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setGlobalSuccess(null);

    try {
      const created = await tagApi.createTag({ name: trimmed });
      setTags((prev) => [...prev, created]);
      setNewTagName('');
      setGlobalSuccess(`Đã tạo thành công nhãn "${created.name}".`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.code === 'TAG_NAME_EXISTS') {
        setCreateError(`Nhãn "${trimmed}" đã tồn tại trong danh mục.`);
      } else {
        setCreateError(err instanceof Error ? err.message : 'Không thể tạo nhãn.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartRename = (tag: TagDto) => {
    setEditingTagId(tag.id);
    setEditingName(tag.name);
    setRenameError(null);
    setDeleteError(null);
    setConfirmDeleteTagId(null);
  };

  const handleCancelRename = () => {
    setEditingTagId(null);
    setEditingName('');
    setRenameError(null);
  };

  const handleSaveRename = async (tagId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setRenameError('Tên nhãn không được để trống.');
      return;
    }
    if (trimmed.length > 50) {
      setRenameError('Tên nhãn không được vượt quá 50 ký tự.');
      return;
    }

    setIsRenaming(true);
    setRenameError(null);

    try {
      const updated = await tagApi.renameTag(tagId, { name: trimmed });
      setTags((prev) => prev.map((t) => (t.id === tagId ? updated : t)));
      setEditingTagId(null);
      setGlobalSuccess(`Đã đổi tên nhãn thành "${updated.name}".`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.code === 'TAG_NAME_EXISTS') {
        setRenameError(`Tên nhãn "${trimmed}" đã được sử dụng.`);
      } else {
        setRenameError(err instanceof Error ? err.message : 'Không thể đổi tên nhãn.');
      }
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmDelete = async (tag: TagDto) => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await tagApi.deleteTag(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      setConfirmDeleteTagId(null);
      setGlobalSuccess(`Đã xóa nhãn "${tag.name}".`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.code === 'TAG_IN_USE') {
        setDeleteError(
          `Không thể xóa nhãn "${tag.name}" vì đang được gắn trên phiếu sửa chữa. Vui lòng gỡ nhãn khỏi phiếu trước khi xóa.`,
        );
      } else {
        setDeleteError(err instanceof Error ? err.message : 'Không thể xóa nhãn.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <div className="rf-tag-mgmt-page" id="tag-management-page">
      {/* Header & Breadcrumb */}
      <header className="rf-tag-mgmt-header">
        <div className="rf-tag-mgmt-title-block">
          <nav className="rf-tag-mgmt-breadcrumb" aria-label="Đường dẫn">
            <a href="#/dashboard">Tổng quan</a>
            <span aria-hidden="true">/</span>
            <span>Quản lý nhãn</span>
          </nav>
          <div className="rf-tag-mgmt-title-row">
            <h1 className="rf-tag-mgmt-title">Quản lý nhãn thiết bị</h1>
            <span className="rf-tag-mgmt-badge">
              <IconTag size={12} aria-hidden="true" />
              <span>{tags.length} nhãn</span>
            </span>
          </div>
          <p className="rf-tag-mgmt-desc">
            Danh mục nhãn phân loại thiết bị tiếp nhận toàn workspace. Chỉ quản lý (Manager/Owner) được phép thêm, sửa, xóa.
          </p>
        </div>

        <button
          type="button"
          className="rf-btn rf-btn--secondary rf-btn--sm"
          onClick={loadTags}
          disabled={isLoading}
          aria-label="Làm mới danh sách nhãn"
        >
          <IconRefresh size={14} className={isLoading ? 'rf-spin' : ''} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </header>

      {/* Global Alerts */}
      {globalError && (
        <Alert variant="danger">
          <p style={{ margin: 0 }}>{globalError}</p>
        </Alert>
      )}
      {globalSuccess && (
        <Alert variant="success">
          <p style={{ margin: 0 }}>{globalSuccess}</p>
        </Alert>
      )}
      {deleteError && (
        <Alert variant="danger">
          <p style={{ margin: 0 }}>{deleteError}</p>
        </Alert>
      )}

      {/* Card 1: Create New Tag */}
      <section className="rf-tag-card-panel" aria-label="Tạo nhãn mới">
        <div className="rf-tag-card-panel__header">
          <h2 className="rf-tag-card-panel__title">Thêm nhãn mới vào danh mục</h2>
        </div>
        <div style={{ padding: '1rem 1.25rem' }}>
          <form className="rf-tag-create-box" onSubmit={handleCreateTag}>
            <div className="rf-tag-create-input-group">
              <input
                type="text"
                className="rf-tag-create-input"
                placeholder="Ví dụ: Pin chai, Màn hình sọc, Khách quen..."
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value);
                  if (createError) setCreateError(null);
                }}
                disabled={isCreating}
                maxLength={50}
                aria-label="Tên nhãn mới"
              />
              {createError && <span className="rf-tag-create-error">{createError}</span>}
            </div>
            <button
              type="submit"
              className="rf-btn rf-btn--primary"
              disabled={isCreating || !newTagName.trim()}
            >
              <IconPlus size={16} aria-hidden="true" />
              <span>{isCreating ? 'Đang tạo...' : 'Tạo nhãn'}</span>
            </button>
          </form>
        </div>
      </section>

      {/* Card 2: Tag Catalog Table */}
      <section className="rf-tag-card-panel" aria-label="Danh mục nhãn">
        {/* Search Toolbar */}
        <div className="rf-tag-toolbar">
          <div className="rf-tag-search-wrapper">
            <input
              type="text"
              className="rf-tag-search-input"
              placeholder="Tìm kiếm nhãn theo tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm nhãn"
            />
            {searchQuery && (
              <button
                type="button"
                className="rf-tag-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa tìm kiếm"
              >
                <IconClose size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--rf-text-muted, #64748b)' }}>
            Hiển thị {filteredTags.length} / {tags.length} nhãn
          </span>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div style={{ padding: '1.5rem' }}>
            <SkeletonLoader height="36px" style={{ marginBottom: '0.5rem' }} />
            <SkeletonLoader height="36px" style={{ marginBottom: '0.5rem' }} />
            <SkeletonLoader height="36px" />
          </div>
        ) : filteredTags.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--rf-text-muted, #64748b)' }}>
            <IconTag size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} aria-hidden="true" />
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--rf-text-main, #0f172a)' }}>
              {searchQuery ? 'Không tìm thấy nhãn phù hợp' : 'Danh mục nhãn trống'}
            </p>
            <p style={{ margin: 0, fontSize: '0.8125rem' }}>
              {searchQuery
                ? `Không có nhãn nào khớp với từ khóa "${searchQuery}".`
                : 'Hãy tạo nhãn đầu tiên ở khung phía trên để bắt đầu phân loại thiết bị.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="rf-tag-table-wrapper">
              <table className="rf-tag-table" aria-label="Bảng danh mục nhãn">
                <thead>
                  <tr>
                    <th style={{ width: '160px' }}>Nhãn hiển thị</th>
                    <th>Tên nhãn</th>
                    <th style={{ width: '140px' }}>Ngày tạo</th>
                    <th style={{ width: '140px' }}>Cập nhật</th>
                    <th style={{ width: '180px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag) => {
                    const isEditing = editingTagId === tag.id;
                    const isConfirmingDelete = confirmDeleteTagId === tag.id;

                    return (
                      <tr key={tag.id}>
                        <td>
                          <span className="rf-tag-chip rf-tag-chip--readonly">
                            {tag.name}
                          </span>
                        </td>
                        <td>
                          {isEditing ? (
                            <div className="rf-tag-table-rename-box">
                              <div className="rf-tag-table-rename-row">
                                <input
                                  type="text"
                                  className="rf-tag-table-rename-input"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  disabled={isRenaming}
                                  maxLength={50}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  className="rf-btn rf-btn--primary rf-btn--sm"
                                  onClick={() => handleSaveRename(tag.id)}
                                  disabled={isRenaming || !editingName.trim()}
                                >
                                  <IconCheck size={14} aria-hidden="true" />
                                  <span>{isRenaming ? '...' : 'Lưu'}</span>
                                </button>
                                <button
                                  type="button"
                                  className="rf-btn rf-btn--secondary rf-btn--sm"
                                  onClick={handleCancelRename}
                                  disabled={isRenaming}
                                >
                                  Hủy
                                </button>
                              </div>
                              <span className="rf-tag-table-rename-hint">
                                Lưu ý: Đổi tên sẽ cập nhật trên tất cả phiếu sửa chữa đang sử dụng nhãn này.
                              </span>
                              {renameError && (
                                <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                                  {renameError}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontWeight: 500 }}>{tag.name}</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--rf-text-muted, #64748b)' }}>
                          {formatDate(tag.createdAt)}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--rf-text-muted, #64748b)' }}>
                          {formatDate(tag.updatedAt)}
                        </td>
                        <td>
                          <div className="rf-tag-table-actions">
                            {!isEditing && !isConfirmingDelete && (
                              <>
                                <button
                                  type="button"
                                  className="rf-btn rf-btn--secondary rf-btn--sm"
                                  onClick={() => handleStartRename(tag)}
                                >
                                  Đổi tên
                                </button>
                                <button
                                  type="button"
                                  className="rf-btn rf-btn--secondary rf-btn--sm"
                                  style={{ color: '#dc2626' }}
                                  onClick={() => setConfirmDeleteTagId(tag.id)}
                                  aria-label={`Xóa nhãn ${tag.name}`}
                                >
                                  <IconTrash size={14} aria-hidden="true" />
                                  <span>Xóa</span>
                                </button>
                              </>
                            )}
                            {isConfirmingDelete && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                                  Xác nhận xóa?
                                </span>
                                <button
                                  type="button"
                                  className="rf-btn rf-btn--sm"
                                  style={{ backgroundColor: '#dc2626', color: '#ffffff', borderColor: '#dc2626' }}
                                  disabled={isDeleting}
                                  onClick={() => handleConfirmDelete(tag)}
                                >
                                  {isDeleting ? '...' : 'Xóa ngay'}
                                </button>
                                <button
                                  type="button"
                                  className="rf-btn rf-btn--secondary rf-btn--sm"
                                  disabled={isDeleting}
                                  onClick={() => setConfirmDeleteTagId(null)}
                                >
                                  Hủy
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (<= 768px) */}
            <div className="rf-tag-mobile-cards" role="list" aria-label="Danh mục nhãn trên di động">
              {filteredTags.map((tag) => {
                const isEditing = editingTagId === tag.id;
                const isConfirmingDelete = confirmDeleteTagId === tag.id;

                return (
                  <div key={tag.id} className="rf-tag-mobile-card" role="listitem">
                    <div className="rf-tag-mobile-card__header">
                      <span className="rf-tag-chip rf-tag-chip--readonly">
                        {tag.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--rf-text-muted, #64748b)' }}>
                        Tạo: {formatDate(tag.createdAt)}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="rf-tag-table-rename-box" style={{ maxWidth: '100%' }}>
                        <div className="rf-tag-table-rename-row">
                          <input
                            type="text"
                            className="rf-tag-table-rename-input"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            disabled={isRenaming}
                            maxLength={50}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="rf-btn rf-btn--primary rf-btn--sm"
                            onClick={() => handleSaveRename(tag.id)}
                            disabled={isRenaming || !editingName.trim()}
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            className="rf-btn rf-btn--secondary rf-btn--sm"
                            onClick={handleCancelRename}
                            disabled={isRenaming}
                          >
                            Hủy
                          </button>
                        </div>
                        <span className="rf-tag-table-rename-hint">
                          Lưu ý: Đổi tên sẽ cập nhật trên tất cả phiếu sửa chữa đang sử dụng nhãn này.
                        </span>
                        {renameError && (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{renameError}</span>
                        )}
                      </div>
                    ) : (
                      <div className="rf-tag-mobile-card__dates">
                        <span>Tên nhãn: <strong>{tag.name}</strong></span>
                        <span>Cập nhật gần nhất: {formatDate(tag.updatedAt)}</span>
                      </div>
                    )}

                    <div className="rf-tag-mobile-card__actions">
                      {!isEditing && !isConfirmingDelete && (
                        <>
                          <button
                            type="button"
                            className="rf-btn rf-btn--secondary rf-btn--sm"
                            onClick={() => handleStartRename(tag)}
                          >
                            Đổi tên
                          </button>
                          <button
                            type="button"
                            className="rf-btn rf-btn--secondary rf-btn--sm"
                            style={{ color: '#dc2626' }}
                            onClick={() => setConfirmDeleteTagId(tag.id)}
                          >
                            <IconTrash size={14} aria-hidden="true" />
                            <span>Xóa</span>
                          </button>
                        </>
                      )}
                      {isConfirmingDelete && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', width: '100%', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                            Xác nhận xóa nhãn này?
                          </span>
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button
                              type="button"
                              className="rf-btn rf-btn--sm"
                              style={{ backgroundColor: '#dc2626', color: '#ffffff', borderColor: '#dc2626' }}
                              disabled={isDeleting}
                              onClick={() => handleConfirmDelete(tag)}
                            >
                              {isDeleting ? '...' : 'Xóa'}
                            </button>
                            <button
                              type="button"
                              className="rf-btn rf-btn--secondary rf-btn--sm"
                              disabled={isDeleting}
                              onClick={() => setConfirmDeleteTagId(null)}
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
