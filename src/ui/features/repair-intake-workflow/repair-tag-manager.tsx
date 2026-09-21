import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { RepairTagApi, TagDto } from '../../shared/api/repair-tag-api';
import { ApiClientError } from '../../shared/api/api-client';
import {
  IconClose,
  IconRefresh,
  IconPlus,
  IconTrash,
  IconSettings,
} from '../../shared/components/icons';
import { Alert } from '../../shared/components';

export interface RepairTagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tagApi: RepairTagApi;
  canManage: boolean;
  onCatalogChanged?: () => void;
}

export function RepairTagManager({
  isOpen,
  onClose,
  tagApi,
  canManage,
  onCatalogChanged,
}: RepairTagManagerProps): ReactNode {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  // Rename state
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Delete state
  const [confirmDeleteTagId, setConfirmDeleteTagId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Create state
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
    if (isOpen) {
      loadTags();
      setSearchQuery('');
      setGlobalError(null);
      setGlobalSuccess(null);
      setEditingTagId(null);
      setConfirmDeleteTagId(null);
      setCreateError(null);
    }
  }, [isOpen, loadTags]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingTagId) {
          setEditingTagId(null);
        } else if (confirmDeleteTagId) {
          setConfirmDeleteTagId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingTagId, confirmDeleteTagId, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleStartRename = (tag: TagDto) => {
    setEditingTagId(tag.id);
    setEditingName(tag.name);
    setRenameError(null);
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
    if (trimmed.length > 64) {
      setRenameError('Tên nhãn tối đa 64 ký tự.');
      return;
    }

    setIsRenaming(true);
    setRenameError(null);
    try {
      const updated = await tagApi.renameTag(tagId, { name: trimmed });
      setTags((prev) => prev.map((t) => (t.id === tagId ? updated : t)));
      setEditingTagId(null);
      setGlobalSuccess(`Đã đổi tên nhãn thành "${updated.name}".`);
      onCatalogChanged?.();
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.code === 'TAG_NAME_EXISTS') {
        setRenameError('Tên nhãn này đã tồn tại trong workspace. Vui lòng chọn tên khác.');
      } else if (err instanceof ApiClientError && err.code === 'TAG_NAME_TOO_LONG') {
        setRenameError('Tên nhãn tối đa 64 ký tự.');
      } else if (err instanceof ApiClientError && err.code === 'TAG_NAME_INVALID') {
        setRenameError('Tên nhãn chứa ký tự không được hỗ trợ.');
      } else {
        setRenameError(err instanceof Error ? err.message : 'Không thể đổi tên nhãn.');
      }
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmDelete = async (tagId: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await tagApi.deleteTag(tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      setConfirmDeleteTagId(null);
      setGlobalSuccess('Đã xóa nhãn thành công khỏi workspace.');
      onCatalogChanged?.();
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.code === 'TAG_IN_USE') {
        setDeleteError('Nhãn đang được sử dụng trên phiếu sửa chữa và không thể xóa. Dữ liệu cũ vẫn giữ nguyên.');
      } else {
        setDeleteError(err instanceof Error ? err.message : 'Không thể xóa nhãn.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      setCreateError('Vui lòng nhập tên nhãn cần tạo.');
      return;
    }
    if (trimmed.length > 64) {
      setCreateError('Tên nhãn tối đa 64 ký tự.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await tagApi.createTag({ name: trimmed });
      setTags((prev) => [...prev, created]);
      setNewTagName('');
      setGlobalSuccess(`Đã tạo mới nhãn "${created.name}".`);
      onCatalogChanged?.();
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.code === 'TAG_NAME_EXISTS') {
        setCreateError('Nhãn này đã tồn tại trong workspace.');
      } else {
        setCreateError(err instanceof Error ? err.message : 'Không thể tạo nhãn.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTags = searchQuery.trim()
    ? tags.filter((t) => t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : tags;

  return (
    <div
      className="rf-tag-manager-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-manager-title"
    >
      <div className="rf-tag-manager-modal">
        {/* Header */}
        <div className="rf-tag-manager-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconSettings size={18} aria-hidden="true" />
            <h3 id="tag-manager-title" className="rf-tag-manager-title">
              Quản lý nhãn workspace
            </h3>
          </div>
          <button
            type="button"
            className="rf-tag-combobox__close-btn"
            onClick={onClose}
            aria-label="Đóng cửa sổ quản lý nhãn"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="rf-tag-manager-body">
          {globalSuccess && (
            <Alert variant="success">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{globalSuccess}</span>
                <button
                  type="button"
                  onClick={() => setGlobalSuccess(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  ✕
                </button>
              </div>
            </Alert>
          )}

          {globalError && (
            <Alert variant="danger" title="Lỗi">
              <div>{globalError}</div>
              <button
                type="button"
                className="rf-btn rf-btn--secondary rf-btn--sm"
                onClick={loadTags}
                style={{ marginTop: '0.5rem' }}
              >
                <IconRefresh size={14} /> Thử lại
              </button>
            </Alert>
          )}

          {/* Inline Create Input Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label
              htmlFor="manager-create-input"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--rf-text-main, #0f172a)' }}
            >
              Thêm nhãn mới vào workspace
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="manager-create-input"
                type="text"
                className="rf-input"
                placeholder="Nhập tên nhãn (ví dụ: Bảo hành vàng, Thay vỏ...)"
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value);
                  setCreateError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
                disabled={isCreating}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="rf-btn rf-btn--primary rf-btn--sm"
                onClick={handleCreateTag}
                disabled={isCreating || !newTagName.trim()}
              >
                <IconPlus size={14} />
                <span>{isCreating ? 'Đang tạo...' : 'Tạo nhãn'}</span>
              </button>
            </div>
            {createError && (
              <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{createError}</span>
            )}
          </div>

          <div style={{ height: '1px', background: 'var(--rf-border, #e2e8f0)', margin: '0.25rem 0' }} />

          {/* Search Filter Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="text"
              className="rf-input"
              placeholder="Tìm kiếm trong danh mục nhãn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, fontSize: '0.8125rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                className="rf-btn rf-btn--secondary rf-btn--sm"
                onClick={() => setSearchQuery('')}
              >
                Xóa tìm
              </button>
            )}
          </div>

          {/* Delete Notice / Error */}
          {deleteError && (
            <Alert variant="danger" title="Không thể xóa nhãn">
              <div>{deleteError}</div>
              <button
                type="button"
                className="rf-btn rf-btn--secondary rf-btn--sm"
                onClick={() => setDeleteError(null)}
                style={{ marginTop: '0.5rem' }}
              >
                Đã hiểu
              </button>
            </Alert>
          )}

          {/* Tags Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <table className="rf-tag-manager-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Tên nhãn</th>
                  <th style={{ width: '30%' }}>Mã định danh</th>
                  <th style={{ width: '30%', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      Đang tải danh mục nhãn...
                    </td>
                  </tr>
                ) : filteredTags.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      {searchQuery
                        ? `Không tìm thấy nhãn nào khớp với "${searchQuery}".`
                        : 'Chưa có nhãn nào trong workspace.'}
                    </td>
                  </tr>
                ) : (
                  filteredTags.map((tag) => {
                    const isEditing = editingTagId === tag.id;
                    const isConfirmingDelete = confirmDeleteTagId === tag.id;

                    return (
                      <tr key={tag.id}>
                        <td>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div className="rf-tag-inline-rename">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveRename(tag.id);
                                    } else if (e.key === 'Escape') {
                                      handleCancelRename();
                                    }
                                  }}
                                  autoFocus
                                  disabled={isRenaming}
                                />
                                <button
                                  type="button"
                                  className="rf-btn rf-btn--primary rf-btn--sm"
                                  onClick={() => handleSaveRename(tag.id)}
                                  disabled={isRenaming}
                                >
                                  {isRenaming ? 'Lưu...' : 'Lưu'}
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
                              <span style={{ fontSize: '0.6875rem', color: '#b45309' }}>
                                * Đổi tên sẽ cập nhật nhãn trên tất cả phiếu đang sử dụng nhãn này.
                              </span>
                              {renameError && (
                                <span style={{ fontSize: '0.6875rem', color: '#dc2626' }}>
                                  {renameError}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="rf-tag-chip rf-tag-chip--readonly">
                              {tag.name}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="rf-font-mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {tag.id.length > 12 ? `${tag.id.substring(0, 10)}...` : tag.id}
                          </span>
                        </td>
                        <td>
                          {isConfirmingDelete ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.6875rem', color: '#dc2626', textAlign: 'right' }}>
                                Nhãn sẽ bị xóa vĩnh viễn khỏi workspace nếu chưa được sử dụng.
                              </span>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                  type="button"
                                  className="rf-btn rf-btn--danger rf-btn--sm"
                                  onClick={() => handleConfirmDelete(tag.id)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                                </button>
                                <button
                                  type="button"
                                  className="rf-btn rf-btn--secondary rf-btn--sm"
                                  onClick={() => setConfirmDeleteTagId(null)}
                                  disabled={isDeleting}
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="rf-tag-manager-actions">
                              {canManage ? (
                                <>
                                  <button
                                    type="button"
                                    className="rf-btn rf-btn--secondary rf-btn--sm"
                                    onClick={() => handleStartRename(tag)}
                                    title="Đổi tên nhãn"
                                  >
                                    Đổi tên
                                  </button>
                                  <button
                                    type="button"
                                    className="rf-btn rf-btn--secondary rf-btn--sm"
                                    onClick={() => {
                                      setConfirmDeleteTagId(tag.id);
                                      setDeleteError(null);
                                      setEditingTagId(null);
                                    }}
                                    title="Xóa nhãn khỏi workspace"
                                    style={{ color: '#dc2626' }}
                                  >
                                    <IconTrash size={14} />
                                  </button>
                                </>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chỉ xem</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="rf-tag-manager-footer">
          <button
            type="button"
            className="rf-btn rf-btn--secondary rf-btn--sm"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
