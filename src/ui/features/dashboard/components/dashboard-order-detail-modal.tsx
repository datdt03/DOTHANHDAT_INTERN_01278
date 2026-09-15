import type { InterventionOrder } from '../types';
import {
  IconAlertTriangle,
  IconClock,
  IconClose,
  IconStaff,
} from '../../../shared/components/icons';
import {
  IconButton,
  OrderCode,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from '../../../shared/components/ui-primitives';

interface DashboardOrderDetailModalProps {
  order: InterventionOrder | null;
  onClose: () => void;
  onAction?: (order: InterventionOrder) => void;
}

function formatVnd(amount?: number): string {
  if (typeof amount !== 'number' || amount === 0) return 'Chưa chốt giá';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function DashboardOrderDetailModal({
  order,
  onClose,
  onAction,
}: DashboardOrderDetailModalProps) {
  if (!order) return null;

  return (
    <div className="rf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="rf-modal-content rf-order-modal"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="rf-modal-header">
          <div className="rf-modal-header__title-block">
            <div className="rf-modal-header__meta-row">
              <OrderCode code={order.orderCode} />
              <StatusBadge
                label={order.statusText}
                status={order.statusTone}
                hasDot={true}
              />
              <span className={`rf-badge rf-badge--${order.priority}`}>
                {order.priorityLabel}
              </span>
            </div>
            <h3 className="rf-modal-title">
              {order.customerName} • {order.deviceModel}
            </h3>
          </div>

          <IconButton label="Đóng chi tiết phiếu" onClick={onClose}>
            <IconClose size={18} />
          </IconButton>
        </div>

        {/* Modal Body */}
        <div className="rf-modal-body rf-order-modal__body">
          {/* SLA Callout */}
          <div
            className={`rf-order-modal__sla-banner rf-order-modal__sla-banner--${order.slaStatus}`}
          >
            {order.slaStatus === 'overdue' ? (
              <IconAlertTriangle size={18} aria-hidden="true" className="rf-order-modal__sla-icon" />
            ) : (
              <IconClock size={18} aria-hidden="true" className="rf-order-modal__sla-icon" />
            )}
            <div className="rf-order-modal__sla-content">
              <strong className="rf-order-modal__sla-title">
                Tình trạng tiến độ: {order.slaText}
              </strong>
              <div className="rf-order-modal__sla-meta">
                <span>
                  Đang chờ: <strong>{order.waitingParty}</strong>
                </span>
                <span className="rf-order-modal__sla-divider">•</span>
                <span>
                  Hạn hẹn hoàn tất: <strong>{order.expectedCompletionDate || 'Chưa ấn định'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Info Grid */}
          <div className="rf-order-modal__grid">
            {/* Customer & Device Card */}
            <div className="rf-info-card">
              <span className="rf-info-card__label">Khách hàng & Thiết bị</span>
              <div className="rf-info-card__row">
                <span className="rf-info-card__field-label">Họ tên:</span>
                <strong className="rf-info-card__field-value">{order.customerName}</strong>
              </div>
              <div className="rf-info-card__row">
                <span className="rf-info-card__field-label">Số điện thoại:</span>
                <strong className="rf-info-card__field-value rf-font-mono">{order.customerPhone}</strong>
              </div>
              <div className="rf-info-card__row">
                <span className="rf-info-card__field-label">Thiết bị:</span>
                <span className="rf-info-card__field-value">{order.deviceModel}</span>
              </div>
              <div className="rf-info-card__row">
                <span className="rf-info-card__field-label">Phụ kiện:</span>
                <span className="rf-info-card__field-value">{order.accessories || 'Không có'}</span>
              </div>
            </div>

            {/* Assignment & Quotation Card */}
            <div className="rf-info-card">
              <span className="rf-info-card__label">Phân công & Báo giá</span>
              <div className="rf-info-card__row">
                <span className="rf-info-card__field-label">KTV phụ trách:</span>
                <strong className="rf-info-card__field-value">
                  {order.assignedStaffName ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <IconStaff size={14} />
                      {order.assignedStaffName}
                    </span>
                  ) : (
                    <span className="rf-text-danger">Chưa phân công</span>
                  )}
                </strong>
              </div>
              <div className="rf-info-card__row">
                <span className="rf-info-card__field-label">Tiếp nhận lúc:</span>
                <span className="rf-info-card__field-value">{order.intakeDate || 'Hôm nay'}</span>
              </div>
              <div className="rf-info-card__row">
                <span className="rf-info-card__field-label">Bản báo giá:</span>
                <span className="rf-info-card__field-value rf-font-mono">
                  {order.quoteVersion ? `v${order.quoteVersion}` : 'Bản nháp'}
                </span>
              </div>
              <div className="rf-info-card__row">
                <span className="rf-info-card__field-label">Tổng tiền báo giá:</span>
                <strong
                  className={`rf-info-card__field-value rf-price-highlight ${
                    order.quoteTotal ? 'rf-text-primary rf-font-mono' : 'rf-text-muted'
                  }`}
                >
                  {formatVnd(order.quoteTotal)}
                </strong>
              </div>
            </div>
          </div>

          {/* Issue & Diagnosis Section */}
          <div className="rf-info-card rf-info-card--full" style={{ marginTop: '14px' }}>
            <span className="rf-info-card__label">Tóm tắt lỗi & Phương án xử lý</span>

            <div className="rf-diagnosis-item">
              <h4 className="rf-diagnosis-item__title">Vấn đề / Hiện trạng:</h4>
              <p className="rf-diagnosis-item__desc">{order.issueSummary}</p>
            </div>

            {order.diagnosisSolution && (
              <div className="rf-diagnosis-item">
                <h4 className="rf-diagnosis-item__title">Phương án đề xuất:</h4>
                <p className="rf-diagnosis-item__desc">{order.diagnosisSolution}</p>
              </div>
            )}

            {order.intakeNotes && (
              <div className="rf-diagnosis-item">
                <h4 className="rf-diagnosis-item__title">Ghi chú tiếp nhận ban đầu:</h4>
                <p className="rf-diagnosis-item__desc rf-text-muted">{order.intakeNotes}</p>
              </div>
            )}
          </div>

          {/* Mini Event Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="rf-order-modal__timeline-section">
              <span className="rf-info-card__label">Lịch sử sự kiện gần nhất</span>
              <div className="rf-order-modal__timeline">
                {order.timeline.map((event, idx) => (
                  <div key={idx} className="rf-order-modal__timeline-item">
                    <span className="rf-order-modal__timeline-time rf-font-mono">{event.time}</span>
                    <span className="rf-order-modal__timeline-dot" />
                    <div className="rf-order-modal__timeline-text">
                      <strong>{event.actor}</strong>: <span>{event.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="rf-modal-footer">
          <SecondaryButton onClick={onClose}>Đóng</SecondaryButton>
          <PrimaryButton
            onClick={() => {
              if (onAction) {
                onAction(order);
              }
              onClose();
            }}
          >
            {order.nextActionText || 'Điều phối xử lý'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
