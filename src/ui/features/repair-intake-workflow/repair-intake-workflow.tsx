import { useState, useMemo } from 'react';
import type { C2AreaMountProps } from '../../app/area-boundary';
import {
  getRepairIntakeAdapter,
  generateIdempotencyKey,
  type RepairIntakeApi,
} from './repair-intake-api';
import { getRepairTagAdapter, type RepairTagApi } from '../../shared/api/repair-tag-api';
import {
  CustomerIntakeStep,
  type CustomerIntakeSelection,
} from './customer-intake-step';
import {
  RepairItemStep,
  createEmptyItem,
  type RepairItemDraft,
} from './repair-item-step';
import { IntakeReviewStep } from './intake-review-step';
import {
  ProgressStepper,
  type StepItem,
  Alert,
} from '../../shared/components';
import './repair-intake-workflow.css';

const INTAKE_STEPS: StepItem[] = [
  { key: 'customer', label: 'Khách hàng' },
  { key: 'devices', label: 'Thiết bị & Lỗi' },
  { key: 'review', label: 'Tổng hợp & Xác nhận' },
];

export interface RepairIntakeWorkflowProps extends C2AreaMountProps {
  previewMode?: boolean;
  standalone?: boolean;
}

export function RepairIntakeWorkflow({
  context,
  onNavigate,
  previewMode = false,
}: RepairIntakeWorkflowProps) {
  const api: RepairIntakeApi = useMemo(
    () => getRepairIntakeAdapter(previewMode),
    [previewMode]
  );
  const tagApi: RepairTagApi = useMemo(
    () => getRepairTagAdapter(previewMode),
    [previewMode]
  );

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [customerSelection, setCustomerSelection] = useState<CustomerIntakeSelection | null>(null);
  const [items, setItems] = useState<RepairItemDraft[]>([createEmptyItem(1)]);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateIdempotencyKey());

  const handleSelectCustomer = (selection: CustomerIntakeSelection) => {
    setCustomerSelection(selection);
    setCurrentStep(1);
  };

  const handleProceedFromItems = (updatedItems: RepairItemDraft[]) => {
    setItems(updatedItems);
    setCurrentStep(2);
  };

  const handleResetWorkflow = () => {
    setCustomerSelection(null);
    setItems([createEmptyItem(1)]);
    setIdempotencyKey(generateIdempotencyKey());
    setCurrentStep(0);
  };

  const handleNavigateToOrder = (orderId: string) => {
    onNavigate('repair-order-area', orderId);
  };

  return (
    <div className="rf-intake-container">
      {/* Compact Header & Stepper Toolbar */}
      <header className="rf-intake-compact-bar">
        <div className="rf-intake-title-compact">
          <nav className="rf-intake-breadcrumb" aria-label="Đường dẫn">
            <a href="#/orders" className="rf-intake-breadcrumb-link">
              Phiếu sửa chữa
            </a>
            <span aria-hidden="true">/</span>
            <span>Tiếp nhận sửa chữa mới</span>
          </nav>
          <div className="rf-intake-heading-row">
            <h1 className="rf-intake-title">Tiếp nhận sửa chữa mới</h1>
            <span className="rf-intake-phase-badge">
              Bước {currentStep + 1}/3
            </span>
          </div>
        </div>

        {/* Compact Stepper Strip */}
        <nav className="rf-intake-stepper-compact" aria-label="Tiến trình tiếp nhận">
          {INTAKE_STEPS.map((step, idx) => {
            const isComplete = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <div
                key={step.key}
                role={isComplete ? 'button' : undefined}
                tabIndex={isComplete ? 0 : undefined}
                onClick={() => {
                  if (isComplete) {
                    setCurrentStep(idx);
                  }
                }}
                onKeyDown={(e) => {
                  if (isComplete && (e.key === 'Enter' || e.key === ' ')) {
                    setCurrentStep(idx);
                  }
                }}
                className={`rf-stepper-item-compact ${isActive ? 'rf-stepper-item-compact--active' : ''} ${isComplete ? 'rf-stepper-item-compact--done' : ''}`}
                title={isComplete ? `Quay lại bước: ${step.label}` : step.label}
              >
                <span className="rf-stepper-badge-compact">
                  {isComplete ? '✓' : idx + 1}
                </span>
                <span className="rf-stepper-label-compact">{step.label}</span>
                {idx < INTAKE_STEPS.length - 1 && <span className="rf-stepper-sep-compact">›</span>}
              </div>
            );
          })}
        </nav>
      </header>

      {previewMode && (
        <Alert variant="warning" title="Chế độ xem trước (Preview Mode)">
          Giao diện đang chạy ở chế độ xem trước với dữ liệu mô phỏng. Mọi thao tác submit là chỉ đọc
          và sẽ không ghi dữ liệu thật vào hệ thống.
        </Alert>
      )}

      {/* Step Outlet */}
      <main className="rf-intake-body">
        {currentStep === 0 && (
          <CustomerIntakeStep
            api={api}
            initialSelection={customerSelection}
            onSelectCustomer={handleSelectCustomer}
          />
        )}

        {currentStep === 1 && (
          <>
            {customerSelection && (
              <div className="rf-intake-selected-summary">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--rf-text-main, #0f172a)' }}>
                    Khách hàng: {customerSelection.mode === 'existing' ? customerSelection.customer?.name : customerSelection.newDraft?.name}
                  </span>
                  <span style={{ color: 'var(--rf-text-muted, #64748b)' }}>•</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--rf-text-muted, #64748b)' }}>
                    SĐT: <strong>{customerSelection.mode === 'existing' ? customerSelection.customer?.phone : customerSelection.newDraft?.phone}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--rf-primary, #0284c7)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Thay đổi khách hàng
                </button>
              </div>
            )}
            <RepairItemStep
              initialItems={items}
              onBack={() => setCurrentStep(0)}
              onProceed={handleProceedFromItems}
              tagApi={tagApi}
              canCreateTags={context.capabilities.canCreateWorkspaceTags}
              canManageTags={context.capabilities.canManageWorkspaceTags}
              previewMode={previewMode}
            />
          </>
        )}

        {currentStep === 2 && customerSelection && (
          <IntakeReviewStep
            api={api}
            customerSelection={customerSelection}
            items={items}
            idempotencyKey={idempotencyKey}
            onBackToCustomer={() => setCurrentStep(0)}
            onBackToItems={() => setCurrentStep(1)}
            onResetWorkflow={handleResetWorkflow}
            onNavigateToOrder={handleNavigateToOrder}
            tagApi={tagApi}
            previewMode={previewMode}
          />
        )}
      </main>
    </div>
  );
}
