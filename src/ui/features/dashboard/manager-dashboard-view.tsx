import { useState, useEffect, useCallback } from 'react';
import type {
  DashboardFilterKey,
  DashboardViewModel,
  DashboardViewState,
  InterventionOrder,
} from './types';
import { dashboardApi } from '../../shared/api/dashboard-api';
import { DashboardKpiGrid } from './components/dashboard-kpi-grid';
import { DashboardPipeline } from './components/dashboard-pipeline';
import { DashboardInterventionTable } from './components/dashboard-intervention-table';
import { DashboardAlertsPanel } from './components/dashboard-alerts-panel';
import { DashboardWorkloadPanel } from './components/dashboard-workload-panel';
import { DashboardOrderDetailModal } from './components/dashboard-order-detail-modal';
import { IconAlertTriangle, IconClock, IconRefresh } from '../../shared/components/icons';
import { PrimaryButton, SecondaryButton } from '../../shared/components/ui-primitives';

export function ManagerDashboardView() {
  const [viewState, setViewState] = useState<DashboardViewState>('ready');
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DashboardFilterKey>('all');
  const [selectedOrder, setSelectedOrder] = useState<InterventionOrder | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard data based on simulated viewState
  const loadDashboard = useCallback(async (state: DashboardViewState = viewState) => {
    if (state === 'loading') {
      setIsRefreshing(true);
      return;
    }

    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const result = await dashboardApi.getDashboardOverview({
        forceEmpty: state === 'empty',
        simulateError: state === 'error',
        delayMs: 120,
      });

      setData(result);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải dữ liệu vận hành. Vui lòng thử lại.'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [viewState]);

  useEffect(() => {
    void loadDashboard(viewState);
  }, [viewState, loadDashboard]);

  const handleStateChange = (newState: DashboardViewState) => {
    setViewState(newState);
  };

  const handleFilterSelect = (filterKey: DashboardFilterKey) => {
    setActiveFilter(filterKey);
  };

  const handleManualRefresh = () => {
    void loadDashboard(viewState);
  };

  return (
    <div className="rf-dashboard-view">
      {/* 1. Page Heading */}
      <section className="rf-page-heading">
        <div className="rf-page-heading__content">
          <div className="rf-page-heading__title-row">
            <h1 className="rf-page-heading__title">Tổng quan vận hành</h1>
            <span className="rf-live-indicator">
              <span className="online-dot" aria-hidden="true" />
              <span>Trực tuyến</span>
            </span>
          </div>
          <p className="rf-page-heading__desc">
            Theo dõi các điểm nghẽn, phiếu quá hạn, yêu cầu cần duyệt và điều phối nhân sự xử lý kịp thời.
          </p>
        </div>
      </section>

      {/* 2. Stale or Failed Refresh Alert */}
      {viewState === 'stale' && (
        <div className="rf-stale-banner" role="alert">
          <IconClock size={16} className="rf-stale-banner__icon" aria-hidden="true" />
          <div className="rf-stale-banner__content">
            <strong>Dữ liệu được cập nhật 25 phút trước.</strong>
            <span>Làm mới tự động thất bại do mạng chập chờn. Thông tin hiển thị có thể chưa phải mới nhất.</span>
          </div>
          <SecondaryButton
            className="rf-stale-banner__btn"
            onClick={handleManualRefresh}
            title="Làm mới lại dữ liệu ngay"
          >
            <IconRefresh size={13} aria-hidden="true" />
            <span>Thử làm mới lại</span>
          </SecondaryButton>
        </div>
      )}

      {/* 3. Network Error Screen */}
      {viewState === 'error' && (
        <section className="rf-error-card" role="alert">
          <div className="rf-error-card__icon" aria-hidden="true">
            <IconAlertTriangle size={32} />
          </div>
          <h2 className="rf-error-card__title">Không thể tải dữ liệu bảng điều khiển</h2>
          <p className="rf-error-card__message">
            {errorMessage || 'Máy chủ phản hồi chậm hoặc kết nối mạng bị gián đoạn. Vui lòng kiểm tra lại đường truyền.'}
          </p>
          <div className="rf-error-card__actions">
            <PrimaryButton onClick={handleManualRefresh}>
              <IconRefresh size={15} aria-hidden="true" />
              <span>Thử kết nối lại</span>
            </PrimaryButton>
            <SecondaryButton onClick={() => handleStateChange('ready')}>
              Quay lại chế độ xem chuẩn
            </SecondaryButton>
          </div>
        </section>
      )}

      {/* 4. Normal / Ready / Loading / Empty Content */}
      {viewState !== 'error' && (
        <>
          {/* Row 1: 4 KPI Cards Lớn (Không dùng 6-7 card) */}
          <DashboardKpiGrid
            metrics={data?.metrics || []}
            activeFilter={activeFilter}
            onSelectFilter={handleFilterSelect}
            isLoading={viewState === 'loading' || isRefreshing}
          />

          {/* Row 2: Pipeline Summary Strip (Dải nhỏ 5 bước) */}
          <DashboardPipeline
            stages={data?.pipeline || []}
            activeFilter={activeFilter}
            onSelectFilter={handleFilterSelect}
            isLoading={viewState === 'loading' || isRefreshing}
          />

          {/* Row 3: Bảng “Phiếu cần can thiệp” (Vùng trọng tâm nhất) */}
          <DashboardInterventionTable
            orders={data?.interventionOrders || []}
            activeFilter={activeFilter}
            onSelectFilter={handleFilterSelect}
            onSelectOrder={(order) => setSelectedOrder(order)}
            isLoading={viewState === 'loading' || isRefreshing}
          />

          {/* Row 4: Hai Panels Song Song — Cảnh báo vận hành & Tải nhân viên */}
          <section className="rf-dashboard-bottom-grid">
            {/* Panel Cảnh báo vận hành */}
            <DashboardAlertsPanel
              alerts={data?.alerts || []}
              onSelectAlert={handleFilterSelect}
              isLoading={viewState === 'loading' || isRefreshing}
            />

            {/* Panel Tải công việc đội ngũ KTV */}
            <DashboardWorkloadPanel
              workload={data?.workload || []}
              availableStaffCount={data?.availableStaffCount ?? 1}
              isLoading={viewState === 'loading' || isRefreshing}
            />
          </section>
        </>
      )}

      {/* 5. Drill-down Order Detail Modal */}
      {selectedOrder && (
        <DashboardOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAction={(order) => {
            // Simulated action trigger
            alert(`Thao tác [${order.nextActionText}] cho phiếu ${order.orderCode} đã được ghi nhận.`);
          }}
        />
      )}

      {/* 6. Floating Dev State Switcher (Công cụ kiểm thử trạng thái dành cho reviewer/tester) */}
      <aside className="rf-floating-dev-bar" role="region" aria-label="Kiểm thử các trạng thái bắt buộc">
        <span className="rf-floating-dev-bar__label">DEV:</span>
        <div className="rf-floating-dev-bar__buttons">
          <button
            type="button"
            className={`rf-state-btn ${viewState === 'ready' ? 'rf-state-btn--active' : ''}`}
            onClick={() => handleStateChange('ready')}
            title="Xem giao diện chuẩn với dữ liệu hoạt động"
          >
            Chuẩn
          </button>
          <button
            type="button"
            className={`rf-state-btn ${viewState === 'loading' ? 'rf-state-btn--active' : ''}`}
            onClick={() => handleStateChange('loading')}
            title="Xem trạng thái Skeleton loading"
          >
            Loading
          </button>
          <button
            type="button"
            className={`rf-state-btn ${viewState === 'empty' ? 'rf-state-btn--active' : ''}`}
            onClick={() => handleStateChange('empty')}
            title="Xem trạng thái không có phiếu cần can thiệp"
          >
            Trống
          </button>
          <button
            type="button"
            className={`rf-state-btn ${viewState === 'error' ? 'rf-state-btn--active' : ''}`}
            onClick={() => handleStateChange('error')}
            title="Xem trạng thái lỗi mạng"
          >
            Lỗi mạng
          </button>
          <button
            type="button"
            className={`rf-state-btn ${viewState === 'stale' ? 'rf-state-btn--active' : ''}`}
            onClick={() => handleStateChange('stale')}
            title="Xem trạng thái dữ liệu cũ (Stale refresh)"
          >
            Dữ liệu cũ
          </button>
        </div>
      </aside>
    </div>
  );
}

