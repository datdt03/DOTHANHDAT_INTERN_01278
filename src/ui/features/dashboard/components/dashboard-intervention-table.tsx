import { useState, useMemo, type MouseEvent } from 'react';
import type { DashboardFilterKey, InterventionOrder } from '../types';
import {
  IconAlertTriangle,
  IconClock,
  IconFilter,
  IconInbox,
  IconLookup,
  IconStaff,
} from '../../../shared/components/icons';
import {
  OrderCode,
  PrimaryButton,
  SecondaryButton,
  SkeletonLoader,
  StatusBadge,
} from '../../../shared/components/ui-primitives';
import { EmptyState } from '../../../shared/components/empty-state';

interface DashboardInterventionTableProps {
  orders: InterventionOrder[];
  activeFilter: DashboardFilterKey;
  onSelectFilter: (filter: DashboardFilterKey) => void;
  onSelectOrder: (order: InterventionOrder) => void;
  isLoading?: boolean;
}

const FILTER_TABS: Array<{ key: DashboardFilterKey; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'overdue', label: 'Trễ SLA' },
  { key: 'waiting_approval', label: 'Chờ khách duyệt' },
  { key: 'unassigned', label: 'Chưa phân công' },
  { key: 'qc_rework', label: 'Sửa lại sau QC' },
  { key: 'ready_handover', label: 'Sẵn sàng bàn giao' },
];

export function DashboardInterventionTable({
  orders,
  activeFilter,
  onSelectFilter,
  onSelectOrder,
  isLoading = false,
}: DashboardInterventionTableProps) {
  const [localSearch, setLocalSearch] = useState('');

  // Filter orders by activeFilter tab and local search keyword
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Filter Tab
      if (activeFilter !== 'all') {
        if (!order.filterTags.includes(activeFilter)) {
          return false;
        }
      }

      // 2. Search query
      if (localSearch.trim()) {
        const query = localSearch.trim().toLowerCase();
        const matchesCode = order.orderCode.toLowerCase().includes(query);
        const matchesCustomer = order.customerName.toLowerCase().includes(query);
        const matchesPhone = order.customerPhone.toLowerCase().includes(query);
        const matchesDevice = order.deviceModel.toLowerCase().includes(query);
        const matchesIssue = order.issueSummary.toLowerCase().includes(query);
        const matchesStaff = (order.assignedStaffName || '').toLowerCase().includes(query);

        return (
          matchesCode ||
          matchesCustomer ||
          matchesPhone ||
          matchesDevice ||
          matchesIssue ||
          matchesStaff
        );
      }

      return true;
    });
  }, [orders, activeFilter, localSearch]);

  const handleActionClick = (e: MouseEvent, order: InterventionOrder) => {
    e.stopPropagation();
    onSelectOrder(order);
  };

  return (
    <section className="rf-panel rf-orders-panel" aria-label="Bảng điều phối phiếu cần can thiệp">
      {/* Panel Header */}
      <div className="rf-panel__header">
        <div className="rf-panel__title-wrap">
          <div className="rf-panel__badge-row">
            <span className="rf-eyebrow">Trọng tâm điều phối</span>
            <span className="rf-tag-count rf-font-mono">
              {filteredOrders.length} phiếu
            </span>
          </div>
          <h2 className="rf-panel__title">Phiếu cần can thiệp</h2>
          <p className="rf-panel__desc">
            Các phiếu có cảnh báo trễ SLA, chưa gán KTV, chờ phản hồi báo giá hoặc cần xử lý lại sau QC.
          </p>
        </div>

        <div className="rf-panel__actions">
          {/* Quick Search inside Table */}
          <div className="rf-table-search">
            <IconLookup size={14} className="rf-table-search__icon" aria-hidden="true" />
            <input
              type="text"
              className="rf-table-search__input"
              placeholder="Lọc mã, khách, thiết bị..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              aria-label="Lọc nhanh danh sách cần can thiệp"
            />
            {localSearch && (
              <button
                type="button"
                className="rf-table-search__clear"
                onClick={() => setLocalSearch('')}
                aria-label="Xóa từ khóa lọc"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="rf-filter-bar" role="tablist" aria-label="Bộ lọc trạng thái cần can thiệp">
        <span className="rf-filter-bar__label" aria-hidden="true">
          <IconFilter size={13} />
          <span>Lọc:</span>
        </span>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          const count =
            tab.key === 'all'
              ? orders.length
              : orders.filter((o) => o.filterTags.includes(tab.key)).length;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`rf-filter-chip ${isActive ? 'rf-filter-chip--active' : ''}`}
              onClick={() => onSelectFilter(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="rf-filter-chip__count rf-font-mono">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table Container - Zoom resilient local scroll */}
      <div className="rf-table-container">
        {isLoading ? (
          <div className="rf-table-skeleton-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rf-table-skeleton-row">
                <SkeletonLoader width="100px" height="16px" />
                <SkeletonLoader width="160px" height="16px" />
                <SkeletonLoader width="260px" height="16px" />
                <SkeletonLoader width="90px" height="16px" />
                <SkeletonLoader width="110px" height="16px" />
                <SkeletonLoader width="110px" height="16px" />
                <SkeletonLoader width="100px" height="16px" />
                <SkeletonLoader width="90px" height="28px" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={<IconInbox size={32} />}
            title="Không có phiếu nào trong nhóm lọc này"
            description={
              localSearch
                ? `Không tìm thấy kết quả nào phù hợp với từ khóa "${localSearch}".`
                : 'Tất cả các phiếu thuộc nhóm này đã được xử lý hoặc chưa phát sinh cảnh báo.'
            }
            action={
              (activeFilter !== 'all' || localSearch) && (
                <SecondaryButton
                  onClick={() => {
                    onSelectFilter('all');
                    setLocalSearch('');
                  }}
                >
                  Xem lại tất cả phiếu
                </SecondaryButton>
              )
            }
            className="rf-table-empty"
          />
        ) : (
          <table className="rf-table rf-table--hoverable">
            <thead>
              <tr>
                <th scope="col" style={{ width: '135px', minWidth: '130px', whiteSpace: 'nowrap' }}>Mã phiếu</th>
                <th scope="col" style={{ width: '175px', minWidth: '165px', whiteSpace: 'nowrap' }}>Khách hàng & Thiết bị</th>
                <th scope="col" style={{ minWidth: '220px' }}>Tóm tắt vấn đề / Nghẽn</th>
                <th scope="col" style={{ width: '115px', minWidth: '110px', whiteSpace: 'nowrap' }}>Đang chờ ai</th>
                <th scope="col" style={{ width: '130px', minWidth: '125px', whiteSpace: 'nowrap' }}>SLA / Tồn</th>
                <th scope="col" style={{ width: '145px', minWidth: '140px', whiteSpace: 'nowrap' }}>KTV phụ trách</th>
                <th scope="col" style={{ width: '145px', minWidth: '135px', whiteSpace: 'nowrap' }}>Trạng thái</th>
                <th scope="col" style={{ width: '130px', minWidth: '125px', textAlign: 'right', whiteSpace: 'nowrap' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const isOverdue = order.slaStatus === 'overdue';
                const isUnassigned = !order.assignedStaffName;

                return (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="rf-table-row--interactive"
                    tabIndex={0}
                    role="button"
                    aria-label={`Chi tiết phiếu ${order.orderCode} của ${order.customerName}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectOrder(order);
                      }
                    }}
                  >
                    {/* 1. Mã phiếu */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <OrderCode code={order.orderCode} />
                    </td>

                    {/* 2. Khách hàng & Thiết bị */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="rf-customer-cell">
                        <strong className="rf-customer-name">{order.customerName}</strong>
                        <span className="rf-device-model">{order.deviceModel}</span>
                      </div>
                    </td>

                    {/* 3. Tóm tắt vấn đề */}
                    <td className="rf-table__col-issue">
                      <p className="rf-issue-summary" title={order.issueSummary}>
                        {order.issueSummary}
                      </p>
                    </td>

                    {/* 4. Đang chờ ai */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`rf-waiting-pill rf-waiting-pill--${order.waitingParty.toLowerCase()}`}>
                        {order.waitingParty}
                      </span>
                    </td>

                    {/* 5. SLA / Thời gian tồn */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="rf-sla-cell">
                        <span className={`rf-sla-text ${isOverdue ? 'rf-sla-text--overdue' : ''}`}>
                          {isOverdue && <IconAlertTriangle size={12} aria-hidden="true" />}
                          {!isOverdue && <IconClock size={12} aria-hidden="true" />}
                          <span>{order.slaText}</span>
                        </span>
                      </div>
                    </td>

                    {/* 6. Nhân viên phụ trách */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {isUnassigned ? (
                        <span className="rf-unassigned-tag">
                          <IconStaff size={12} aria-hidden="true" />
                          <span>Chưa phân công</span>
                        </span>
                      ) : (
                        <div className="rf-staff-cell">
                          <IconStaff size={13} className="rf-staff-cell__icon" aria-hidden="true" />
                          <span>{order.assignedStaffName}</span>
                        </div>
                      )}
                    </td>

                    {/* 7. Trạng thái tiếng Việt */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge
                        label={order.statusText}
                        status={order.statusTone}
                        hasDot={true}
                      />
                    </td>

                    {/* 8. Hành động / Next action */}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {order.nextActionTone === 'primary' ? (
                        <PrimaryButton
                          className="rf-btn-table-action"
                          onClick={(e) => handleActionClick(e, order)}
                          title={`${order.nextActionText} cho ${order.orderCode}`}
                        >
                          {order.nextActionText}
                        </PrimaryButton>
                      ) : (
                        <SecondaryButton
                          className="rf-btn-table-action"
                          onClick={(e) => handleActionClick(e, order)}
                          title={`${order.nextActionText} cho ${order.orderCode}`}
                        >
                          {order.nextActionText}
                        </SecondaryButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info */}
      <div className="rf-panel__footer">
        <span className="rf-text-muted">
          Click vào bất kỳ dòng nào để xem chi tiết chẩn đoán, báo giá và tiến độ phiếu.
        </span>
        <span className="rf-text-muted rf-font-mono">
          Hiển thị {filteredOrders.length} / {orders.length} phiếu cần can thiệp
        </span>
      </div>
    </section>
  );
}
