import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type {
  RepairOrderApi,
  RepairOrderSummaryDto,
  RepairOrderListQuery,
} from './repair-order-api';
import { getOrderStatusInfo } from './repair-order-api';
import {
  DataTable,
  type Column,
  OrderCode,
  StatusBadge,
  SkeletonLoader,
  EmptyState,
  Alert,
  FormSelect,
} from '../../shared/components';
import {
  IconLookup,
  IconClose,
  IconPlus,
  IconRefresh,
  IconOrders,
  IconFilter,
} from '../../shared/components/icons';
import '../repair-intake-workflow/repair-tag-picker.css';

export interface RepairOrderListProps {
  api: RepairOrderApi;
  canCreate: boolean;
  onSelectOrder: (orderId: string) => void;
  onOpenCreate: () => void;
  previewMode?: boolean;
  initialQuery?: string;
  initialStatus?: string;
  onFilterChange?: (query: string, status: string) => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'received', label: 'Đã tiếp nhận' },
  { value: 'diagnosing', label: 'Đang chẩn đoán' },
  { value: 'waiting_for_approval', label: 'Chờ khách duyệt' },
  { value: 'approved', label: 'Đã duyệt sửa chữa' },
  { value: 'repairing', label: 'Đang sửa chữa' },
  { value: 'quality_check', label: 'Kiểm tra chất lượng (QC)' },
  { value: 'ready_for_pickup', label: 'Sẵn sàng bàn giao' },
  { value: 'handed_over', label: 'Đã bàn giao' },
  { value: 'cancellation_requested', label: 'Yêu cầu hủy' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'ready_for_return', label: 'Chờ trả máy' },
  { value: 'returned', label: 'Đã trả máy' },
  { value: 'cancelled', label: 'Đã hủy' },
];

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

export function RepairOrderList({
  api,
  canCreate,
  onSelectOrder,
  onOpenCreate,
  initialQuery = '',
  initialStatus = '',
  onFilterChange,
}: RepairOrderListProps): ReactNode {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [orders, setOrders] = useState<RepairOrderSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeRequestSeq = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  const loadOrders = useCallback(
    async (searchVal: string, statusVal: string) => {
      const currentSeq = ++activeRequestSeq.current;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const ac = new AbortController();
      abortControllerRef.current = ac;

      setIsLoading(true);
      setError(null);

      try {
        const queryParams: RepairOrderListQuery = {
          signal: ac.signal,
        };
        if (searchVal.trim()) {
          queryParams.query = searchVal.trim();
        }
        if (statusVal.trim()) {
          queryParams.status = statusVal.trim();
        }

        const result = await api.listOrders(queryParams);

        if (currentSeq === activeRequestSeq.current) {
          setOrders(result.orders);
        }
      } catch (err: unknown) {
        if (ac.signal.aborted) return;
        if (currentSeq === activeRequestSeq.current) {
          setError(
            err instanceof Error && err.message
              ? err.message
              : 'Không thể tải danh sách phiếu sửa chữa. Vui lòng thử lại.',
          );
        }
      } finally {
        if (currentSeq === activeRequestSeq.current) {
          setIsLoading(false);
        }
      }
    },
    [api],
  );

  // Debounced search on query or status change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders(query, status);
      onFilterChangeRef.current?.(query, status);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, status, loadOrders]);

  const handleClearFilters = () => {
    setQuery('');
    setStatus('');
  };

  const hasActiveFilters = Boolean(query.trim() || status.trim());

  // Table columns definition for desktop
  const columns: Column<RepairOrderSummaryDto>[] = [
    {
      key: 'orderCode',
      header: 'Mã phiếu',
      width: '140px',
      render: (row) => (
        <button
          type="button"
          className="rf-order-code-btn"
          onClick={() => onSelectOrder(row.id)}
          aria-label={`Xem chi tiết phiếu ${row.orderCode}`}
        >
          <OrderCode code={row.orderCode} />
        </button>
      ),
    },
    {
      key: 'customer',
      header: 'Khách hàng',
      width: '200px',
      render: (row) => (
        <div className="rf-order-table-customer">
          <span className="rf-order-table-customer__name">{row.customerName}</span>
          <span className="rf-order-table-customer__phone rf-font-mono">{row.customerPhone}</span>
        </div>
      ),
    },
    {
      key: 'device',
      header: 'Thiết bị tiếp nhận',
      render: (row) => (
        <div className="rf-order-table-device">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span className="rf-order-table-device__primary">{row.primaryDeviceName}</span>
            {row.extraDevicesCount > 0 && (
              <span
                className="rf-order-table-device__badge"
                title={`Còn ${row.extraDevicesCount} thiết bị khác trong cùng phiếu`}
              >
                +{row.extraDevicesCount} thiết bị
              </span>
            )}
          </div>
          {row.tags && row.tags.length > 0 && (
            <div className="rf-tag-chips" style={{ marginTop: '0.25rem' }} aria-label="Nhãn thiết bị">
              {row.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rf-tag-chip rf-tag-chip--readonly"
                  style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem' }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '180px',
      render: (row) => {
        const info = getOrderStatusInfo(row.status);
        return <StatusBadge status={info.status} label={info.label} />;
      },
    },
    {
      key: 'assignedStaff',
      header: 'Người phụ trách',
      width: '160px',
      render: (row) => (
        <span className="rf-order-table-staff">{row.assignedStaffName || '—'}</span>
      ),
    },
    {
      key: 'dates',
      header: 'Thời gian',
      width: '180px',
      render: (row) => (
        <div className="rf-order-table-dates">
          <span>Nhận: {formatDate(row.receivedAt)}</span>
          {row.expectedCompletedAt && (
            <span className="rf-order-table-dates__due">
              Hẹn: {formatDate(row.expectedCompletedAt)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Thao tác',
      align: 'right',
      width: '120px',
      render: (row) => (
        <button
          type="button"
          className="rf-btn rf-btn--secondary rf-btn--sm"
          onClick={() => onSelectOrder(row.id)}
          aria-label={`Xem chi tiết phiếu sửa chữa ${row.orderCode}`}
        >
          Xem chi tiết
        </button>
      ),
    },
  ];

  return (
    <div className="rf-order-list-view">
      {/* Top Header & Breadcrumb */}
      <div className="rf-order-list-header">
        <div className="rf-order-list-header__left">
          <nav className="rf-order-breadcrumb" aria-label="Đường dẫn">
            <span className="rf-order-breadcrumb__current">Phiếu sửa chữa</span>
          </nav>
          <h1 className="rf-order-list-header__title">Phiếu sửa chữa</h1>
        </div>

        {canCreate && (
          <div className="rf-order-list-header__right">
            <button
              type="button"
              className="rf-btn rf-btn--primary"
              onClick={onOpenCreate}
            >
              <IconPlus size={16} aria-hidden="true" />
              <span>Tạo phiếu tiếp nhận</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rf-order-toolbar" role="search" aria-label="Tìm kiếm và lọc phiếu sửa chữa">
        <div className="rf-order-search-input-wrap">
          <label htmlFor="rf-order-search-field" className="rf-sr-only">
            Tìm kiếm theo mã phiếu, khách hàng, số điện thoại hoặc thiết bị
          </label>
          <div className="rf-order-search-icon" aria-hidden="true">
            <IconLookup size={16} />
          </div>
          <input
            id="rf-order-search-field"
            type="search"
            className="rf-order-search-input"
            placeholder="Tìm mã phiếu, khách hàng, SĐT, thiết bị..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="rf-order-search-clear-btn"
              onClick={() => setQuery('')}
              aria-label="Xóa nội dung tìm kiếm"
            >
              <IconClose size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="rf-order-filter-status-wrap">
          <label htmlFor="rf-order-status-filter" className="rf-sr-only">
            Lọc theo trạng thái
          </label>
          <FormSelect
            id="rf-order-status-filter"
            icon={<IconFilter size={15} />}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="rf-btn rf-btn--text rf-order-clear-filters-btn"
            onClick={handleClearFilters}
          >
            <IconClose size={14} aria-hidden="true" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>

      {/* Results Summary Counter */}
      {!isLoading && !error && (
        <div className="rf-order-results-meta" aria-live="polite">
          <span>
            Tìm thấy <strong>{orders.length}</strong> phiếu sửa chữa
            {hasActiveFilters ? ' phù hợp với bộ lọc' : ''}
          </span>
        </div>
      )}

      {/* Error Alert with Retry */}
      {error && (
        <Alert variant="danger" title="Không thể tải danh sách phiếu">
          <p style={{ margin: '0 0 0.5rem 0' }}>{error}</p>
          <button
            type="button"
            className="rf-btn rf-btn--secondary rf-btn--sm"
            onClick={() => loadOrders(query, status)}
          >
            <IconRefresh size={14} aria-hidden="true" />
            <span>Thử lại</span>
          </button>
        </Alert>
      )}

      {/* Loading Skeleton (Only shown on initial fetch when no orders yet) */}
      {isLoading && orders.length === 0 && (
        <div className="rf-order-skeleton-container" aria-busy="true" aria-label="Đang tải dữ liệu...">
          <div className="rf-order-skeleton-row">
            <SkeletonLoader width="120px" height="24px" />
            <SkeletonLoader width="180px" height="20px" />
            <SkeletonLoader width="220px" height="20px" />
            <SkeletonLoader width="140px" height="24px" />
          </div>
          <div className="rf-order-skeleton-row">
            <SkeletonLoader width="120px" height="24px" />
            <SkeletonLoader width="180px" height="20px" />
            <SkeletonLoader width="220px" height="20px" />
            <SkeletonLoader width="140px" height="24px" />
          </div>
          <div className="rf-order-skeleton-row">
            <SkeletonLoader width="120px" height="24px" />
            <SkeletonLoader width="180px" height="20px" />
            <SkeletonLoader width="220px" height="20px" />
            <SkeletonLoader width="140px" height="24px" />
          </div>
        </div>
      )}

      {/* Empty State / Search Miss */}
      {!isLoading && !error && orders.length === 0 && (
        <div className="rf-order-empty-wrapper">
          {hasActiveFilters ? (
            <EmptyState
              icon={<IconLookup size={32} />}
              title="Không tìm thấy phiếu sửa chữa phù hợp"
              description="Không có phiếu nào trùng khớp với từ khóa tìm kiếm hoặc trạng thái đang lọc."
              action={
                <button
                  type="button"
                  className="rf-btn rf-btn--secondary"
                  onClick={handleClearFilters}
                >
                  Xóa bộ lọc và xem toàn bộ
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={<IconOrders size={32} />}
              title="Chưa có phiếu sửa chữa nào"
              description="Không gian làm việc hiện tại chưa ghi nhận phiếu sửa chữa nào. Hãy bắt đầu tiếp nhận thiết bị mới từ khách hàng."
              action={
                canCreate ? (
                  <button
                    type="button"
                    className="rf-btn rf-btn--primary"
                    onClick={onOpenCreate}
                  >
                    <IconPlus size={16} aria-hidden="true" />
                    <span>Tạo phiếu tiếp nhận</span>
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      )}

      {/* Desktop Data Table & Mobile Cards (Kept mounted when reloading to eliminate flicker) */}
      {!error && orders.length > 0 && (
        <div
          style={{
            opacity: isLoading ? 0.6 : 1,
            transition: 'opacity 0.2s ease',
            pointerEvents: isLoading ? 'none' : 'auto',
          }}
        >
          <div className="rf-order-desktop-table">
            <DataTable<RepairOrderSummaryDto>
              columns={columns}
              data={orders}
              keyExtractor={(row) => row.id}
            />
          </div>

          {/* Mobile Cards View (displayed at <= 768px via CSS) */}
          <div className="rf-order-mobile-cards" role="list" aria-label="Danh sách phiếu sửa chữa di động">
            {orders.map((order) => {
              const statusInfo = getOrderStatusInfo(order.status);
              return (
                <div key={order.id} className="rf-order-card" role="listitem">
                  <div className="rf-order-card__header">
                    <OrderCode code={order.orderCode} />
                    <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                  </div>

                  <div className="rf-order-card__customer">
                    <span className="rf-order-card__customer-name">{order.customerName}</span>
                    <span className="rf-order-card__dot" aria-hidden="true">•</span>
                    <span className="rf-order-card__customer-phone rf-font-mono">
                      {order.customerPhone}
                    </span>
                  </div>

                  <div className="rf-order-card__device">
                    <span className="rf-order-card__device-name">{order.primaryDeviceName}</span>
                    {order.extraDevicesCount > 0 && (
                      <span className="rf-order-card__extra-badge">
                        +{order.extraDevicesCount} thiết bị
                      </span>
                    )}
                  </div>

                  {order.tags && order.tags.length > 0 && (
                    <div className="rf-tag-chips" style={{ marginTop: '0.25rem' }} aria-label="Nhãn thiết bị">
                      {order.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rf-tag-chip rf-tag-chip--readonly"
                          style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem' }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="rf-order-card__dates">
                    <span>Nhận: {formatDate(order.receivedAt)}</span>
                    {order.expectedCompletedAt && (
                      <>
                        <span className="rf-order-card__dot" aria-hidden="true">•</span>
                        <span className="rf-order-card__due">
                          Hẹn: {formatDate(order.expectedCompletedAt)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="rf-order-card__footer">
                    <button
                      type="button"
                      className="rf-btn rf-btn--secondary rf-btn--full"
                      onClick={() => onSelectOrder(order.id)}
                      aria-label={`Xem chi tiết phiếu ${order.orderCode}`}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
