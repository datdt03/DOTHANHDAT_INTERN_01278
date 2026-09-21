import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { RepairTagApi, TagDto, TagConflictDetails } from '../../shared/api/repair-tag-api';
import { ApiClientError } from '../../shared/api/api-client';
import { RepairTagManager } from './repair-tag-manager';
import {
  IconPlus,
  IconClose,
  IconCheck,
  IconSettings,
} from '../../shared/components/icons';
import './repair-tag-picker.css';

export interface RepairItemTagPickerProps {
  itemId: string;
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  tagApi: RepairTagApi;
  canCreate?: boolean;
  canManage?: boolean;
  readOnly?: boolean;
}

export function RepairItemTagPicker({
  itemId,
  selectedTagIds,
  onTagsChange,
  tagApi,
  canCreate = true,
  canManage = false,
  readOnly = false,
}: RepairItemTagPickerProps): ReactNode {
  const [catalog, setCatalog] = useState<TagDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isCreating, setIsCreating] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [resolvedNotice, setResolvedNotice] = useState<string | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const inputId = `tag-input-${itemId}`;

  // Load catalog
  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const tags = await tagApi.searchTags({ includeUnused: true });
      setCatalog(tags);
    } catch {
      // Graceful fallback for tag catalog fetch
    } finally {
      setIsLoading(false);
    }
  }, [tagApi]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Click outside to close popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter catalog by query
  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const filteredTags = catalog.filter((tag) =>
    tag.name.toLowerCase().includes(normalizedQuery),
  );

  const hasExactMatch = catalog.some(
    (tag) => tag.name.trim().toLowerCase() === normalizedQuery,
  );
  const showCreateOption =
    canCreate && !readOnly && trimmedQuery.length > 0 && !hasExactMatch;

  // Total navigable items in dropdown listbox: filteredTags + (showCreateOption ? 1 : 0)
  const totalNavItems = filteredTags.length + (showCreateOption ? 1 : 0);

  // Selected tag objects map
  const selectedTags = selectedTagIds
    .map((id) => catalog.find((t) => t.id === id))
    .filter((t): t is TagDto => Boolean(t));

  // If a tag is selected but not yet in catalog (e.g., newly resolved), we keep its ID displayed
  const unknownIds = selectedTagIds.filter((id) => !catalog.some((t) => t.id === id));

  const handleRemoveTag = (tagId: string) => {
    if (readOnly) return;
    onTagsChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const handleToggleTag = (tagId: string) => {
    if (readOnly) return;
    setResolvedNotice(null);
    setInlineError(null);
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
    setQuery('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleCreateNewTag = async (nameToCreate: string) => {
    const trimmed = nameToCreate.trim();
    if (!trimmed) return;
    if (trimmed.length > 64) {
      setInlineError('Tên nhãn tối đa 64 ký tự.');
      return;
    }

    setIsCreating(true);
    setInlineError(null);
    setResolvedNotice(null);

    try {
      const created = await tagApi.createTag({ name: trimmed });
      setCatalog((prev) => [...prev, created]);
      if (!selectedTagIds.includes(created.id)) {
        onTagsChange([...selectedTagIds, created.id]);
      }
      setQuery('');
      setIsOpen(false);
      setActiveIndex(-1);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.code === 'TAG_NAME_EXISTS') {
        // Resolve duplicate to existing tag
        const details = err.details as TagConflictDetails | undefined;
        const existingId = details?.existingTagId || details?.existingTag?.id;

        if (existingId) {
          if (details?.existingTag && !catalog.some((t) => t.id === existingId)) {
            setCatalog((prev) => [...prev, details.existingTag!]);
          }
          if (!selectedTagIds.includes(existingId)) {
            onTagsChange([...selectedTagIds, existingId]);
          }
          setResolvedNotice(`Nhãn "${trimmed}" đã tồn tại và được chọn tự động.`);
          setQuery('');
          setIsOpen(false);
          setActiveIndex(-1);
          return;
        }

        // Fallback duplicate match by name in local catalog
        const match = catalog.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
        if (match) {
          if (!selectedTagIds.includes(match.id)) {
            onTagsChange([...selectedTagIds, match.id]);
          }
          setResolvedNotice(`Nhãn "${trimmed}" đã tồn tại và được chọn tự động.`);
          setQuery('');
          setIsOpen(false);
          setActiveIndex(-1);
          return;
        }

        setInlineError('Nhãn này đã tồn tại trong workspace.');
      } else if (err instanceof ApiClientError && err.code === 'TAG_NAME_TOO_LONG') {
        setInlineError('Tên nhãn tối đa 64 ký tự.');
      } else if (err instanceof ApiClientError && err.code === 'TAG_NAME_INVALID') {
        setInlineError('Tên nhãn chứa ký tự không được hỗ trợ.');
      } else {
        setInlineError(err instanceof Error ? err.message : 'Không thể tạo nhãn.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
      } else if (totalNavItems > 0) {
        setActiveIndex((prev) => (prev + 1) % totalNavItems);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(totalNavItems - 1);
      } else if (totalNavItems > 0) {
        setActiveIndex((prev) => (prev - 1 + totalNavItems) % totalNavItems);
      }
      return;
    }

    if (e.key === 'Enter') {
      if (!isOpen) return;
      e.preventDefault();

      if (activeIndex >= 0 && activeIndex < filteredTags.length) {
        // Selected an existing tag
        handleToggleTag(filteredTags[activeIndex].id);
      } else if (activeIndex === filteredTags.length && showCreateOption) {
        // Selected the inline create option
        void handleCreateNewTag(trimmedQuery);
      } else if (showCreateOption) {
        // If nothing explicitly highlighted but query is ready to create
        void handleCreateNewTag(trimmedQuery);
      }
      return;
    }

    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (e.key === 'Backspace' && query === '' && selectedTagIds.length > 0) {
      // Remove last selected tag when input is empty
      const lastId = selectedTagIds[selectedTagIds.length - 1];
      handleRemoveTag(lastId);
    }
  };

  return (
    <div className="rf-tag-picker" ref={containerRef}>
      {/* Label and Hint Header */}
      <div className="rf-tag-picker__label-row">
        <label htmlFor={inputId} className="rf-tag-picker__label">
          Nhãn thiết bị
        </label>
        <span className="rf-tag-picker__hint">
          Dùng để phân loại thiết bị, không thay thế trạng thái phiếu
        </span>
      </div>

      {/* Selected Chips Area */}
      <div className="rf-tag-chips" aria-live="polite">
        {selectedTags.map((tag) => (
          <span key={tag.id} className="rf-tag-chip">
            <span>{tag.name}</span>
            {!readOnly && (
              <button
                type="button"
                className="rf-tag-chip__remove"
                onClick={() => handleRemoveTag(tag.id)}
                title={`Bỏ nhãn ${tag.name}`}
                aria-label={`Bỏ nhãn ${tag.name}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {unknownIds.map((id) => (
          <span key={id} className="rf-tag-chip">
            <span>Nhãn ({id.substring(0, 8)})</span>
            {!readOnly && (
              <button
                type="button"
                className="rf-tag-chip__remove"
                onClick={() => handleRemoveTag(id)}
                title="Bỏ nhãn"
                aria-label="Bỏ nhãn"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {!readOnly && !isOpen && (
          <button
            type="button"
            className="rf-tag-picker__trigger-btn"
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
          >
            <IconPlus size={13} />
            <span>Thêm nhãn</span>
          </button>
        )}

        {readOnly && selectedTagIds.length === 0 && (
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Chưa có nhãn
          </span>
        )}
      </div>

      {/* Notice after resolving duplicate */}
      {resolvedNotice && (
        <div className="rf-tag-notice rf-tag-notice--success" role="status">
          {resolvedNotice}
        </div>
      )}

      {/* Error message */}
      {inlineError && (
        <div className="rf-tag-notice rf-tag-notice--error" role="alert">
          {inlineError}
        </div>
      )}

      {/* Combobox & Dropdown Listbox (only shown when not read-only and open) */}
      {!readOnly && isOpen && (
        <div className="rf-tag-combobox">
          <div className="rf-tag-combobox__input-wrap">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              className="rf-tag-combobox__input"
              placeholder="Tìm hoặc nhập tên nhãn..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
                setInlineError(null);
                setResolvedNotice(null);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls={listboxId}
              autoComplete="off"
            />
            <button
              type="button"
              className="rf-tag-combobox__close-btn"
              onClick={() => {
                setIsOpen(false);
                setQuery('');
                setActiveIndex(-1);
              }}
              title="Đóng bảng chọn"
              aria-label="Đóng bảng chọn nhãn"
            >
              <IconClose size={16} />
            </button>
          </div>

          {/* Popup Listbox */}
          <div
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            className="rf-tag-popup"
          >
            <div className="rf-tag-popup__header">Nhãn phù hợp</div>

            <ul className="rf-tag-popup__list">
              {isLoading ? (
                <li className="rf-tag-popup__empty-text">Đang tải danh mục nhãn...</li>
              ) : filteredTags.length === 0 && !showCreateOption ? (
                <li className="rf-tag-popup__empty-text">
                  {trimmedQuery
                    ? `Không tìm thấy "${trimmedQuery}"`
                    : 'Chưa có nhãn nào trong workspace.'}
                </li>
              ) : (
                filteredTags.map((tag, idx) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isHighlighted = activeIndex === idx;

                  return (
                    <li
                      key={tag.id}
                      id={`tag-opt-${tag.id}`}
                      role="option"
                      aria-selected={isSelected}
                      className={`rf-tag-popup__option ${
                        isHighlighted ? 'rf-tag-popup__option--active' : ''
                      } ${isSelected ? 'rf-tag-popup__option--selected' : ''}`}
                      onClick={() => handleToggleTag(tag.id)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="rf-tag-popup__checkbox" aria-hidden="true">
                          {isSelected && <IconCheck size={12} strokeWidth={2.5} />}
                        </span>
                        <span>{tag.name}</span>
                      </div>
                      {isSelected && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--rf-primary, #0284c7)' }}>
                          Đã chọn
                        </span>
                      )}
                    </li>
                  );
                })
              )}

              {/* Inline Create Option when query has no exact match */}
              {showCreateOption && (
                <li
                  role="option"
                  aria-selected={false}
                  className={`rf-tag-popup__create-item ${
                    activeIndex === filteredTags.length
                      ? 'rf-tag-popup__create-item--active'
                      : ''
                  }`}
                  onClick={() => handleCreateNewTag(trimmedQuery)}
                  onMouseEnter={() => setActiveIndex(filteredTags.length)}
                >
                  <IconPlus size={14} />
                  <span>
                    {isCreating ? 'Đang tạo...' : `+ Tạo nhãn "${trimmedQuery}"`}
                  </span>
                </li>
              )}
            </ul>

            {/* Dropdown Footer with Tag Manager Trigger */}
            <div className="rf-tag-popup__footer">
              <span>Enter để chọn • Esc để đóng</span>
              {(canManage || canCreate) && (
                <button
                  type="button"
                  className="rf-tag-popup__manage-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsManagerOpen(true);
                  }}
                >
                  ⚙ Quản lý nhãn workspace
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tag Manager Modal / Drawer */}
      <RepairTagManager
        isOpen={isManagerOpen}
        onClose={() => {
          setIsManagerOpen(false);
          loadCatalog();
        }}
        tagApi={tagApi}
        canManage={canManage}
        onCatalogChanged={loadCatalog}
      />
    </div>
  );
}
