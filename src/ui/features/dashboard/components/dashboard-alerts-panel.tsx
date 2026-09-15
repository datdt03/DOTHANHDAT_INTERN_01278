import type { DashboardFilterKey, OperationalAlert } from '../types';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheckCircle,
  IconClock,
  IconExternalLink,
  IconHourglass,
  IconStaff,
} from '../../../shared/components/icons';
import { SkeletonLoader } from '../../../shared/components/ui-primitives';

interface DashboardAlertsPanelProps {
  alerts: OperationalAlert[];
  onSelectAlert: (filterKey: DashboardFilterKey) => void;
  isLoading?: boolean;
}

function renderAlertIcon(id: string) {
  switch (id) {
    case 'alert-overdue':
      return <IconClock size={16} />;
    case 'alert-unassigned':
      return <IconStaff size={16} />;
    case 'alert-rework':
      return <IconAlertTriangle size={16} />;
    case 'alert-waiting-long':
      return <IconHourglass size={16} />;
    case 'alert-link-expiring':
      return <IconExternalLink size={16} />;
    case 'alert-ready':
      return <IconCheckCircle size={16} />;
    default:
      return <IconAlertTriangle size={16} />;
  }
}

export function DashboardAlertsPanel({
  alerts,
  onSelectAlert,
  isLoading = false,
}: DashboardAlertsPanelProps) {
  return (
    <article className="rf-panel rf-alerts-panel" aria-label="Cảnh báo vận hành cần chú ý">
      <div className="rf-panel__header">
        <div className="rf-panel__title-wrap">
          <div className="rf-panel__badge-row">
            <h3 className="rf-panel__title">Cảnh báo vận hành</h3>
            <span className="rf-tag-count rf-font-mono">{alerts.length} mục</span>
          </div>
          <p className="rf-panel__desc">
            Tổng hợp các điểm nghẽn và thời hạn cần điều phối để tránh phát sinh khiếu nại.
          </p>
        </div>
      </div>

      <div className="rf-panel__body">

      {isLoading ? (
        <div className="rf-alerts-list rf-alerts-list--skeleton">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rf-alert-item-skeleton">
              <SkeletonLoader width="34px" height="34px" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonLoader width="65%" height="14px" />
                <SkeletonLoader width="90%" height="11px" style={{ marginTop: '6px' }} />
              </div>
              <div className="rf-alert-item__count-col">
                <SkeletonLoader width="32px" height="26px" />
              </div>
              <div style={{ width: '130px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <SkeletonLoader width="100px" height="14px" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rf-alerts-list">
          {alerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              className={`rf-alert-item rf-alert-item--${alert.tone}`}
              onClick={() => onSelectAlert(alert.filterKey)}
              title={`${alert.title} - ${alert.actionText}`}
            >
              <span className="rf-alert-item__icon" aria-hidden="true">
                {renderAlertIcon(alert.id)}
              </span>

              <div className="rf-alert-item__content">
                <strong className="rf-alert-item__title">{alert.title}</strong>
                <p className="rf-alert-item__desc">{alert.description}</p>
              </div>

              <div className="rf-alert-item__count-col">
                <span className="rf-alert-count-badge rf-font-mono">
                  {String(alert.count).padStart(2, '0')}
                </span>
              </div>

              <span className="rf-alert-item__action-link">
                <span>{alert.actionText}</span>
                <IconArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      )}
      </div>
    </article>
  );
}
