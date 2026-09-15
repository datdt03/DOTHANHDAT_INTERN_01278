import type { StaffWorkloadItem } from '../types';
import { IconCheck, IconStaff } from '../../../shared/components/icons';
import { SkeletonLoader } from '../../../shared/components/ui-primitives';

interface DashboardWorkloadPanelProps {
  workload: StaffWorkloadItem[];
  availableStaffCount: number;
  isLoading?: boolean;
}

export function DashboardWorkloadPanel({
  workload,
  availableStaffCount,
  isLoading = false,
}: DashboardWorkloadPanelProps) {
  const totalActive = workload.reduce((sum, item) => sum + item.activeOrders, 0);
  const totalCapacity = workload.reduce((sum, item) => sum + item.maxCapacity, 0);
  const overallLoadPercentage =
    totalCapacity > 0 ? Math.round((totalActive / totalCapacity) * 100) : 0;

  return (
    <article className="rf-panel rf-workload-panel" aria-label="Tải công việc của nhân sự">
      <div className="rf-panel__header">
        <div className="rf-panel__title-wrap">
          <div className="rf-panel__badge-row">
            <h3 className="rf-panel__title">Tải công việc đội ngũ KTV</h3>
            <span className="rf-workload-badge" title="Tỷ lệ tải công việc toàn tiệm">
              Hiệu suất: <strong className="rf-font-mono">{overallLoadPercentage}%</strong>
            </span>
          </div>
          <p className="rf-panel__desc">
            Theo dõi số phiếu đang xử lý, phiếu quá hạn và nhân sự đang rảnh để điều chuyển hợp lý.
          </p>
        </div>
      </div>

      <div className="rf-panel__body">
        {/* Available staff callout banner */}
        {availableStaffCount > 0 && !isLoading && (
          <div className="rf-available-staff-callout">
            <IconCheck size={14} className="rf-available-staff-callout__icon" aria-hidden="true" />
            <span>
              Có <strong>{availableStaffCount}</strong> kỹ thuật viên đang sẵn sàng nhận thêm thiết bị mới.
            </span>
          </div>
        )}

      {isLoading ? (
        <div className="rf-workload-list rf-workload-list--skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rf-workload-item-skeleton">
              <SkeletonLoader width="120px" height="14px" />
              <SkeletonLoader width="60px" height="14px" />
              <SkeletonLoader width="100%" height="6px" style={{ marginTop: '8px' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rf-workload-list">
          {workload.map((staff) => {
            const isFull = staff.loadStatus === 'full';
            const isAvailable = staff.loadStatus === 'available';

            return (
              <div key={staff.id} className="rf-workload-item">
                <div className="rf-workload-item__header">
                  <div className="rf-workload-item__profile">
                    <div className="rf-workload-item__avatar" aria-hidden="true">
                      <IconStaff size={14} />
                    </div>
                    <div>
                      <strong className="rf-workload-item__name">{staff.name}</strong>
                      <span className="rf-workload-item__specialty">{staff.specialty}</span>
                    </div>
                  </div>

                  <div className="rf-workload-item__counts">
                    <strong className="rf-workload-item__count-label rf-font-mono">
                      {staff.activeOrders}/{staff.maxCapacity} phiếu
                    </strong>
                    {staff.overdueOrders > 0 && (
                      <span className="rf-workload-item__overdue-tag" title="Phiếu trễ SLA">
                        {staff.overdueOrders} trễ
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="rf-workload-item__bar-wrap">
                  <div
                    className={`rf-workload-item__bar rf-workload-item__bar--${
                      isFull ? 'danger' : isAvailable ? 'success' : 'primary'
                    }`}
                    style={{ width: `${Math.min(100, staff.loadPercentage)}%` }}
                    role="progressbar"
                    aria-valuenow={staff.loadPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tải của ${staff.name}: ${staff.loadPercentage}%`}
                  />
                </div>

                <div className="rf-workload-item__meta">
                  <span className="rf-workload-item__status-text">{staff.statusText}</span>
                  {staff.waitingQcOrders > 0 && (
                    <span className="rf-workload-item__qc-hint">
                      {staff.waitingQcOrders} phiếu chờ QC
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </article>
  );
}
