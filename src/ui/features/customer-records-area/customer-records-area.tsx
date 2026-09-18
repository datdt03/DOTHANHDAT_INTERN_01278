import { useState, useEffect, useMemo, type ReactNode } from 'react';
import type { C2AreaMountProps } from '../../app/area-boundary';
import {
  getCustomerRecordsAdapter,
  type CustomerDto,
  type CustomerRecordsApi,
} from './customer-records-api';
import { CustomerSearchPanel } from './customer-search-panel';
import { CustomerCreatePanel } from './customer-create-panel';
import { CustomerDetailPanel } from './customer-detail-panel';
import { RoleContextSwitcher } from '../access/role-context-switcher';
import { Alert } from '../../shared/components/alert';
import { IconPlus, IconRefresh } from '../../shared/components/icons';
import './customer-records-area.css';

export interface CustomerRecordsAreaProps extends C2AreaMountProps {
  initialCustomerId?: string;
  previewMode?: boolean;
  apiOverride?: CustomerRecordsApi;
  standalone?: boolean;
}

export function CustomerRecordsArea({
  context,
  onNavigate,
  initialCustomerId,
  previewMode = false,
  apiOverride,
  standalone = false,
}: CustomerRecordsAreaProps): ReactNode {
  const api = useMemo(
    () => apiOverride || getCustomerRecordsAdapter(previewMode),
    [apiOverride, previewMode],
  );

  const [activeView, setActiveView] = useState<'search' | 'create' | 'detail'>(
    initialCustomerId ? 'detail' : 'search',
  );
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(Boolean(initialCustomerId));
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  // Capability check for presentation: hide create if isReadOnlyLookup or isAssignedOnly
  const canCreate = !context.capabilities.isReadOnlyLookup && !context.capabilities.isAssignedOnly;

  // Load customer by ID if provided on mount or hash change
  useEffect(() => {
    if (!initialCustomerId) {
      if (activeView === 'detail' && !selectedCustomer) {
        setActiveView('search');
      }
      return;
    }

    let isMounted = true;
    setIsInitialLoading(true);
    setInitialLoadError(null);

    api
      .getCustomer(initialCustomerId)
      .then((customer) => {
        if (isMounted) {
          setSelectedCustomer(customer);
          setActiveView('detail');
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setInitialLoadError(
            err instanceof Error && err.message
              ? err.message
              : 'Không thể tải thông tin khách hàng.',
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialCustomerId, api]);

  const handleOpenCreate = () => {
    setIsNewlyCreated(false);
    setActiveView('create');
  };

  const handleSelectCustomer = (customer: CustomerDto) => {
    setIsNewlyCreated(false);
    setSelectedCustomer(customer);
    setActiveView('detail');
  };

  const handleCustomerCreated = (customer: CustomerDto) => {
    setIsNewlyCreated(true);
    setSelectedCustomer(customer);
    setActiveView('detail');
  };

  const handleBackToSearch = () => {
    setIsNewlyCreated(false);
    setSelectedCustomer(null);
    setActiveView('search');
  };

  return (
    <div className="rf-customer-area" id="customer-records-area">
      {/* Standalone Header (only rendered when mounted without global shell) */}
      {standalone && (
        <header className="rf-customer-area__shell-header">
          <div className="rf-customer-area__shell-brand">
            <button
              type="button"
              className="rf-customer-area__shell-back-btn"
              onClick={() => {
                window.location.hash = '#/dashboard';
              }}
              aria-label="Quay lại hệ thống điều hành"
            >
              ← Về tổng quan
            </button>
            <h2 className="rf-customer-area__shell-title">Khu vực Khách hàng</h2>
            <span className="rf-customer-area__shell-badge">
              {context.workspaceId || 'Chi nhánh hiện tại'}
            </span>
          </div>

          <div className="rf-customer-area__shell-actions">
            <RoleContextSwitcher />
            {canCreate && activeView !== 'create' && (
              <button
                type="button"
                className="rf-customer-search-bar__btn rf-customer-search-bar__btn--primary"
                onClick={handleOpenCreate}
              >
                <IconPlus size={16} aria-hidden="true" />
                <span>Tạo khách hàng</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Preview Mode Notice Banner */}
      {previewMode && (
        <div className="rf-customer-area__preview-banner" role="status">
          <span>
            <strong>Chế độ Xem trước (Preview Mode):</strong> Dữ liệu khách hàng là bản mô phỏng read-only, không ghi vào cơ sở dữ liệu thật.
          </span>
        </div>
      )}

      {/* Main Area Container */}
      <main className="rf-customer-area__container">
        {isInitialLoading && (
          <div className="rf-customer-skeleton-list" aria-busy="true">
            <div className="rf-customer-skeleton-row" />
            <div className="rf-customer-skeleton-row" />
          </div>
        )}

        {initialLoadError && (
          <Alert variant="danger" title="Không thể tải hồ sơ">
            <p style={{ margin: '0 0 0.5rem 0' }}>{initialLoadError}</p>
            <button
              type="button"
              className="rf-customer-search-bar__btn rf-customer-search-bar__btn--secondary"
              onClick={() => {
                if (initialCustomerId) {
                  setIsInitialLoading(true);
                  setInitialLoadError(null);
                  api
                    .getCustomer(initialCustomerId)
                    .then((customer) => {
                      setSelectedCustomer(customer);
                      setActiveView('detail');
                    })
                    .catch((err: unknown) => {
                      setInitialLoadError(
                        err instanceof Error && err.message
                          ? err.message
                          : 'Không thể tải thông tin khách hàng.',
                      );
                    })
                    .finally(() => setIsInitialLoading(false));
                }
              }}
            >
              <IconRefresh size={14} aria-hidden="true" />
              <span>Thử lại</span>
            </button>
          </Alert>
        )}

        {!isInitialLoading && !initialLoadError && (
          <>
            {activeView === 'search' && (
              <CustomerSearchPanel
                api={api}
                canCreate={canCreate}
                onSelectCustomer={handleSelectCustomer}
                onOpenCreate={handleOpenCreate}
                previewMode={previewMode}
              />
            )}

            {activeView === 'create' && (
              <CustomerCreatePanel
                api={api}
                onCustomerCreated={handleCustomerCreated}
                onCancel={handleBackToSearch}
                previewMode={previewMode}
              />
            )}

            {activeView === 'detail' && selectedCustomer && (
              <CustomerDetailPanel
                customer={selectedCustomer}
                onBack={handleBackToSearch}
                onNavigate={onNavigate}
                isNewlyCreated={isNewlyCreated}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
