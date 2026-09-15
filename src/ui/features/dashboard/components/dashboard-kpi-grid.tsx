import type { DashboardFilterKey, DashboardMetric } from '../types';
import { SkeletonLoader } from '../../../shared/components/ui-primitives';

interface DashboardKpiGridProps {
  metrics: DashboardMetric[];
  activeFilter: DashboardFilterKey;
  onSelectFilter: (key: DashboardFilterKey) => void;
  isLoading?: boolean;
}

export function DashboardKpiGrid({
  metrics,
  activeFilter,
  onSelectFilter,
  isLoading = false,
}: DashboardKpiGridProps) {
  if (isLoading) {
    return (
      <section className="rf-kpi-grid" aria-label="Đang tải chỉ số KPI">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rf-kpi-card rf-kpi-card--skeleton">
            <div className="rf-kpi-card__accent" />
            <SkeletonLoader width="65%" height="13px" />
            <SkeletonLoader width="40%" height="32px" className="rf-kpi-card__val-skeleton" />
            <SkeletonLoader width="80%" height="11px" className="rf-kpi-card__hint-skeleton" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="rf-kpi-grid" aria-label="4 Chỉ số vận hành trọng yếu">
      {metrics.map((metric) => {
        const isActive = activeFilter === metric.filterKey;
        const toneClass = `rf-kpi-card--${metric.tone}`;
        const activeClass = isActive ? 'rf-kpi-card--active' : '';

        return (
          <button
            key={metric.id}
            type="button"
            className={`rf-kpi-card ${toneClass} ${activeClass}`}
            onClick={() => onSelectFilter(metric.filterKey)}
            title={`Bấm để lọc danh sách phiếu: ${metric.label}`}
          >
            <div className="rf-kpi-card__accent" aria-hidden="true" />

            <div className="rf-kpi-card__header">
              <span className="rf-kpi-card__label">{metric.label}</span>
            </div>

            <div className="rf-kpi-card__value-row">
              <strong className="rf-kpi-card__value rf-font-mono">
                {String(metric.count).padStart(2, '0')}
              </strong>
            </div>

            <div className="rf-kpi-card__footer">
              <span className="rf-kpi-card__dot" aria-hidden="true" />
              <span className="rf-kpi-card__hint">{metric.priorityText}</span>
            </div>
          </button>
        );
      })}
    </section>
  );
}
