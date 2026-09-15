import type { DashboardFilterKey, PipelineStage } from '../types';
import { SkeletonLoader } from '../../../shared/components/ui-primitives';
import { IconArrowRight } from '../../../shared/components/icons';

interface DashboardPipelineProps {
  stages: PipelineStage[];
  activeFilter?: DashboardFilterKey;
  onSelectFilter?: (key: DashboardFilterKey) => void;
  isLoading?: boolean;
}

export function DashboardPipeline({
  stages,
  activeFilter,
  onSelectFilter,
  isLoading = false,
}: DashboardPipelineProps) {
  if (isLoading) {
    return (
      <section className="rf-pipeline-strip rf-pipeline-strip--skeleton" aria-label="Đang tải luồng tiến độ">
        <div className="rf-pipeline-strip__header">
          <SkeletonLoader width="180px" height="15px" />
          <SkeletonLoader width="140px" height="13px" />
        </div>
        <div className="rf-pipeline-stepper rf-pipeline-stepper--skeleton">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="rf-pipeline-card-skeleton">
              <SkeletonLoader width="50%" height="11px" />
              <SkeletonLoader width="40%" height="24px" style={{ margin: '8px 0' }} />
              <SkeletonLoader width="100%" height="4px" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const totalInPipeline = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <section className="rf-pipeline-strip" aria-label="Tiến độ luồng sửa chữa">
      <div className="rf-pipeline-strip__header">
        <div className="rf-pipeline-strip__title-wrap">
          <h3 className="rf-pipeline-strip__title">Tiến độ quy trình sửa chữa</h3>
          <span className="rf-pipeline-strip__subtitle">Theo dõi dòng chảy thiết bị qua 5 trạm kỹ thuật</span>
        </div>
        <div className="rf-pipeline-strip__meta">
          <span className="rf-pipeline-strip__total">
            Tổng cộng: <strong className="rf-font-mono">{totalInPipeline}</strong> phiếu đang trong luồng
          </span>
        </div>
      </div>

      <div className="rf-pipeline-stepper" role="tablist" aria-label="Quy trình 5 bước sửa chữa">
        {stages.map((stage, idx) => {
          const isFilterable = Boolean(stage.filterKey && onSelectFilter);
          const isFiltered = stage.filterKey && activeFilter === stage.filterKey;
          const stepNumber = String(idx + 1).padStart(2, '0');
          const volumePercent =
            totalInPipeline > 0 ? Math.round((stage.count / totalInPipeline) * 100) : 0;

          return (
            <div key={stage.id} className="rf-pipeline-step-item">
              <button
                type="button"
                role="tab"
                aria-selected={isFiltered}
                className={`rf-pipeline-card rf-pipeline-card--${stage.tone} ${
                  isFiltered ? 'rf-pipeline-card--active' : ''
                }`}
                onClick={() => {
                  if (stage.filterKey && onSelectFilter) {
                    onSelectFilter(stage.filterKey);
                  }
                }}
                disabled={!isFilterable}
                title={isFilterable ? `Lọc phiếu chặng: ${stage.label} (${stage.count} phiếu)` : stage.label}
              >
                <div className="rf-pipeline-card__top">
                  <span className="rf-pipeline-card__step-num rf-font-mono">{stepNumber}</span>
                  <span className="rf-pipeline-card__label">{stage.label}</span>
                </div>

                <div className="rf-pipeline-card__value-row">
                  <strong className="rf-pipeline-card__count rf-font-mono">
                    {String(stage.count).padStart(2, '0')}
                  </strong>
                  <span className="rf-pipeline-card__unit">thiết bị</span>
                </div>

                <div className="rf-pipeline-card__progress-track" title={`${volumePercent}% tổng thiết bị`}>
                  <div
                    className="rf-pipeline-card__progress-bar"
                    style={{ width: `${Math.max(14, volumePercent)}%` }}
                  />
                </div>
              </button>

              {idx < stages.length - 1 && (
                <div className="rf-pipeline-flow-arrow" aria-hidden="true">
                  <IconArrowRight size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
