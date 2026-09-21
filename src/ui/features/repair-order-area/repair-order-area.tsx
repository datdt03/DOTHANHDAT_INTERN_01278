import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { C2AreaMountProps } from '../../app/area-boundary';
import {
  getRepairOrderAdapter,
  type RepairOrderApi,
} from './repair-order-api';
import { RepairOrderList } from './repair-order-list';
import { RepairOrderDetail } from './repair-order-detail';
import './repair-order-area.css';

export interface RepairOrderAreaProps extends C2AreaMountProps {
  initialOrderId?: string;
  previewMode?: boolean;
  apiOverride?: RepairOrderApi;
  standalone?: boolean;
}

export function RepairOrderArea({
  context,
  onNavigate,
  initialOrderId,
  previewMode = false,
  apiOverride,
  standalone = false,
}: RepairOrderAreaProps): ReactNode {
  const api = useMemo(
    () => apiOverride || getRepairOrderAdapter(previewMode),
    [apiOverride, previewMode],
  );

  const [activeOrderId, setActiveOrderId] = useState<string | undefined>(initialOrderId);
  const [filterState, setFilterState] = useState<{ query: string; status: string }>({
    query: '',
    status: '',
  });

  // Sync initialOrderId from navigation
  useEffect(() => {
    setActiveOrderId(initialOrderId);
  }, [initialOrderId]);

  // Capability check for creating orders: Receptionist, Manager, Owner can create
  const canCreate = !context.capabilities.isReadOnlyLookup && !context.capabilities.isAssignedOnly;

  const handleSelectOrder = (orderId: string) => {
    setActiveOrderId(orderId);
    onNavigate('repair-order-area', orderId);
  };

  const handleBackToList = () => {
    setActiveOrderId(undefined);
    onNavigate('repair-order-area');
  };

  const handleOpenCreate = () => {
    onNavigate('repair-intake-workflow');
  };

  const handleFilterChange = useCallback((newQuery: string, newStatus: string) => {
    setFilterState((prev) => {
      if (prev.query === newQuery && prev.status === newStatus) return prev;
      return { query: newQuery, status: newStatus };
    });
  }, []);

  return (
    <div className="rf-repair-order-area" id="repair-order-area">
      {/* Standalone Header (only rendered when mounted without global shell) */}
      {standalone && (
        <header className="rf-repair-order-area__shell-header">
          <div className="rf-repair-order-area__shell-brand">
            <button
              type="button"
              className="rf-repair-order-area__shell-back-btn"
              onClick={() => {
                window.location.hash = '#/dashboard';
              }}
              aria-label="Quay lại hệ thống điều hành"
            >
              ← Về tổng quan
            </button>
            <h2 className="rf-repair-order-area__shell-title">Khu vực Phiếu sửa chữa</h2>
            <span className="rf-repair-order-area__shell-badge">
              {context.workspaceId || 'Chi nhánh hiện tại'}
            </span>
          </div>
        </header>
      )}

      {/* Preview Mode Banner */}
      {previewMode && (
        <div className="rf-repair-order-area__preview-banner" role="status">
          <span>
            <strong>Chế độ Xem trước (Preview Mode):</strong> Dữ liệu phiếu sửa chữa là bản mô phỏng read-only, không thực hiện thay đổi trên cơ sở dữ liệu thật.
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="rf-repair-order-area__container">
        {activeOrderId ? (
          <RepairOrderDetail
            orderId={activeOrderId}
            api={api}
            onBack={handleBackToList}
            previewMode={previewMode}
          />
        ) : (
          <RepairOrderList
            api={api}
            canCreate={canCreate}
            onSelectOrder={handleSelectOrder}
            onOpenCreate={handleOpenCreate}
            previewMode={previewMode}
            initialQuery={filterState.query}
            initialStatus={filterState.status}
            onFilterChange={handleFilterChange}
          />
        )}
      </main>
    </div>
  );
}
