import type { CustomerDto } from './customer-records-api';
import type { C2AreaId } from '../../app/area-boundary';
import { CardPanel, CardPanelBody, CardPanelHeader } from '../../shared/components/card-panel';
import { Alert } from '../../shared/components/alert';
import {
  IconDevices,
  IconOrders,
  IconChevronRight,
} from '../../shared/components/icons';

export interface CustomerDetailPanelProps {
  customer: CustomerDto;
  onBack: () => void;
  onNavigate: (area: C2AreaId, resourceId?: string) => void;
  isNewlyCreated?: boolean;
}

export function CustomerDetailPanel({
  customer,
  onBack,
  onNavigate,
  isNewlyCreated = false,
}: CustomerDetailPanelProps) {
  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rf-customer-area__subview">
      {isNewlyCreated && (
        <Alert variant="success" title="Thao tác thành công">
          Hồ sơ khách hàng đã được lưu trữ an toàn trong không gian làm việc.
        </Alert>
      )}

      <CardPanel>
        <CardPanelHeader
          title="Thông tin chi tiết khách hàng"
          actions={
            <button
              type="button"
              className="rf-customer-search-bar__btn rf-customer-search-bar__btn--secondary"
              onClick={onBack}
            >
              ← Quay lại danh sách
            </button>
          }
        />
        <CardPanelBody>
          <div className="rf-customer-detail-grid">
            <div className="rf-customer-detail-item">
              <span className="rf-customer-detail-item__label">Họ và tên</span>
              <span className="rf-customer-detail-item__value" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {customer.name}
              </span>
            </div>

            <div className="rf-customer-detail-item">
              <span className="rf-customer-detail-item__label">Số điện thoại liên hệ</span>
              <span className="rf-customer-detail-item__value rf-customer-detail-item__value--mono">
                {customer.phone}
              </span>
            </div>

            <div className="rf-customer-detail-item">
              <span className="rf-customer-detail-item__label">Địa chỉ Email</span>
              <span className="rf-customer-detail-item__value">
                {customer.email || 'Chưa cung cấp'}
              </span>
            </div>

            <div className="rf-customer-detail-item">
              <span className="rf-customer-detail-item__label">Mã định danh hệ thống</span>
              <span className="rf-customer-detail-item__value rf-customer-detail-item__value--mono" style={{ fontSize: '0.8125rem' }}>
                {customer.id}
              </span>
            </div>

            <div className="rf-customer-detail-item">
              <span className="rf-customer-detail-item__label">Thời gian tiếp nhận</span>
              <span className="rf-customer-detail-item__value">
                {formatDateTime(customer.createdAt)}
              </span>
            </div>

            <div className="rf-customer-detail-item">
              <span className="rf-customer-detail-item__label">Cập nhật gần nhất</span>
              <span className="rf-customer-detail-item__value">
                {formatDateTime(customer.updatedAt)}
              </span>
            </div>

            <div className="rf-customer-detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="rf-customer-detail-item__label">Ghi chú</span>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginTop: '0.25rem',
                  fontSize: '0.875rem',
                  color: customer.note ? '#0f172a' : '#64748b',
                  lineHeight: 1.5,
                }}
              >
                {customer.note || 'Không có ghi chú bổ sung.'}
              </div>
            </div>
          </div>

          <div className="rf-customer-detail-links">
            <button
              type="button"
              className="rf-customer-link-btn"
              onClick={() => onNavigate('device-area', customer.id)}
              title="Chuyển đến khu vực quản lý thiết bị của khách hàng"
            >
              <IconDevices size={16} aria-hidden="true" />
              <span>Thiết bị của khách hàng</span>
              <IconChevronRight size={14} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="rf-customer-link-btn"
              onClick={() => onNavigate('repair-order-area', customer.id)}
              title="Chuyển đến khu vực quản lý phiếu sửa chữa của khách hàng"
            >
              <IconOrders size={16} aria-hidden="true" />
              <span>Phiếu sửa chữa liên quan</span>
              <IconChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </CardPanelBody>
      </CardPanel>
    </div>
  );
}
