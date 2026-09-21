import { useState, useEffect, type ReactNode } from 'react';
import type {
  RepairOrderApi,
  RepairOrderDetailDto,
  RepairOrderItemDto,
} from './repair-order-api';
import {
  getOrderStatusInfo,
  formatStaffResponsibility,
  formatDeviceType,
  formatStatusReason,
  formatPresetValue,
} from './repair-order-api';
import {
  OrderCode,
  StatusBadge,
  SkeletonLoader,
  Alert,
  CardPanel,
  CardPanelHeader,
  CardPanelBody,
} from '../../shared/components';
import {
  IconRefresh,
  IconDevices,
  IconCheck,
  IconShield,
  IconCopy,
  IconCustomers,
  IconClock,
} from '../../shared/components/icons';

export interface RepairOrderDetailProps {
  orderId: string;
  api: RepairOrderApi;
  onBack: () => void;
  previewMode?: boolean;
}

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function formatCredentialStatus(status?: string | null): { label: string; tone: string } {
  switch (status) {
    case 'not_required':
      return { label: 'Không yêu cầu mật khẩu thiết bị', tone: 'neutral' };
    case 'customer_unlocked_device':
      return { label: 'Khách hàng đã trực tiếp mở khóa máy tại quầy', tone: 'success' };
    case 'passcode_provided':
      return { label: 'Khách hàng đã cung cấp mã PIN / Mật khẩu', tone: 'success' };
    case 'pattern_provided':
      return { label: 'Khách hàng đã cung cấp hình vẽ mở khóa', tone: 'success' };
    case 'encrypted_stored':
      return { label: 'Mật khẩu đã được mã hóa an toàn (Chỉ KTV được giao mới mở)', tone: 'info' };
    case 'destroyed':
      return { label: 'Mật khẩu đã được hủy an toàn sau khi hoàn tất', tone: 'muted' };
    case 'none':
      return { label: 'Không có mật khẩu', tone: 'neutral' };
    case 'customer_refused':
      return { label: 'Khách từ chối cung cấp mật khẩu', tone: 'warning' };
    case 'device_locked':
      return { label: 'Máy bị vô hiệu hóa / Treo máy', tone: 'danger' };
    default:
      return { label: status || 'Chưa ghi nhận', tone: 'neutral' };
  }
}

export function RepairOrderDetail({
  orderId,
  api,
  onBack,
}: RepairOrderDetailProps): ReactNode {
  const [order, setOrder] = useState<RepairOrderDetailDto | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order?.customer?.phone) return;
    navigator.clipboard.writeText(order.customer.phone).then(() => {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }).catch(() => {
      // Fallback if clipboard API is restricted
    });
  };

  const fetchDetail = () => {
    setIsLoading(true);
    setError(null);

    api
      .getOrder(orderId)
      .then((data) => {
        setOrder(data);
        if (data.repairItems && data.repairItems.length > 0) {
          setSelectedItemIndex(data.repairItems[0].itemIndex);
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'Không thể tải chi tiết phiếu sửa chữa.',
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [orderId, api]);

  if (isLoading) {
    return (
      <div className="rf-order-detail-loading" aria-busy="true" aria-label="Đang nạp chi tiết phiếu...">
        <div style={{ marginBottom: '1.5rem' }}>
          <SkeletonLoader width="140px" height="20px" style={{ marginBottom: '0.75rem' }} />
          <SkeletonLoader width="320px" height="36px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <SkeletonLoader height="160px" />
          <SkeletonLoader height="160px" />
        </div>
        <SkeletonLoader height="280px" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rf-order-detail-error">
        <Alert variant="danger" title="Không tìm thấy phiếu sửa chữa">
          <p style={{ margin: '0 0 1rem 0' }}>{error || 'Phiếu sửa chữa không tồn tại hoặc bạn không có quyền truy cập.'}</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="rf-btn rf-btn--secondary rf-btn--sm" onClick={fetchDetail}>
              <IconRefresh size={14} aria-hidden="true" />
              <span>Thử lại</span>
            </button>
            <button type="button" className="rf-btn rf-btn--primary rf-btn--sm" onClick={onBack}>
              ← Quay lại danh sách phiếu
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  const statusInfo = getOrderStatusInfo(order.status);
  const items = order.repairItems || [];
  const selectedItem: RepairOrderItemDto | undefined =
    items.find((it) => it.itemIndex === selectedItemIndex) || items[0];

  return (
    <div className="rf-order-detail-view">
      {/* Detail Navigation & Header */}
      <div className="rf-order-detail-nav">
        <button
          type="button"
          className="rf-order-back-btn"
          onClick={onBack}
          aria-label="Quay lại danh sách phiếu sửa chữa"
        >
          ← Quay lại danh sách
        </button>
      </div>

      <header className="rf-order-detail-header">
        <div className="rf-order-detail-header__main">
          <div className="rf-order-detail-header__title-row">
            <h1 className="rf-order-detail-heading">
              Phiếu <OrderCode code={order.orderCode} />
            </h1>
            <StatusBadge status={statusInfo.status} label={statusInfo.label} />
          </div>

          <div className="rf-order-detail-meta" role="region" aria-label="Thông tin nhanh đơn hàng">
            <div className="rf-order-meta-flow">
              <span className="rf-meta-item rf-meta-item--customer">
                <IconCustomers size={16} className="rf-meta-icon" aria-hidden="true" />
                <span className="rf-meta-label">Khách hàng:</span>
                <strong className="rf-meta-value">{order.customer?.name || 'Khách vãng lai'}</strong>
              </span>

              {order.customer?.phone && (
                <span className="rf-meta-item rf-meta-item--phone">
                  <span className="rf-meta-phone-num rf-font-mono">{order.customer.phone}</span>
                  <button
                    type="button"
                    className={`rf-meta-copy-icon-btn ${copiedPhone ? 'is-copied' : ''}`}
                    onClick={handleCopyPhone}
                    title={copiedPhone ? 'Đã sao chép vào bộ nhớ tạm' : 'Sao chép số điện thoại'}
                    aria-label={copiedPhone ? 'Đã sao chép' : 'Sao chép số điện thoại'}
                  >
                    {copiedPhone ? (
                      <IconCheck size={14} aria-hidden="true" />
                    ) : (
                      <IconCopy size={14} aria-hidden="true" />
                    )}
                  </button>
                  {copiedPhone && <span className="rf-meta-copied-toast">Đã chép</span>}
                </span>
              )}

              <span className="rf-meta-sep" aria-hidden="true">•</span>

              <span className="rf-meta-item">
                <IconClock size={15} className="rf-meta-icon" aria-hidden="true" />
                <span className="rf-meta-label">Tiếp nhận:</span>
                <span className="rf-meta-value rf-font-mono">{formatDateTime(order.receivedAt)}</span>
              </span>

              {order.updatedAt && (
                <>
                  <span className="rf-meta-sep" aria-hidden="true">•</span>
                  <span className="rf-meta-item">
                    <IconRefresh size={15} className="rf-meta-icon" aria-hidden="true" />
                    <span className="rf-meta-label">Cập nhật:</span>
                    <span className="rf-meta-value rf-font-mono">{formatDateTime(order.updatedAt)}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Top 2-Column Summary Grid: Customer Info & Intake Summary */}
      <div className="rf-order-summary-grid">
        {/* Customer Information Panel */}
        <CardPanel>
          <CardPanelHeader title="Thông tin khách hàng" />
          <CardPanelBody>
            <dl className="rf-summary-list">
              <div className="rf-summary-list__row">
                <dt className="rf-summary-list__key">Họ và tên</dt>
                <dd className="rf-summary-list__value">{order.customer?.name || '—'}</dd>
              </div>
              <div className="rf-summary-list__row">
                <dt className="rf-summary-list__key">Số điện thoại</dt>
                <dd className="rf-summary-list__value rf-font-mono">
                  {order.customer?.phone || '—'}
                </dd>
              </div>
              <div className="rf-summary-list__row">
                <dt className="rf-summary-list__key">Email</dt>
                <dd className="rf-summary-list__value">{order.customer?.email || '—'}</dd>
              </div>
              <div className="rf-summary-list__row">
                <dt className="rf-summary-list__key">Ghi chú khách</dt>
                <dd className="rf-summary-list__value">{order.customer?.note || 'Không có'}</dd>
              </div>
            </dl>
          </CardPanelBody>
        </CardPanel>

        {/* Intake Summary Panel */}
        <CardPanel>
          <CardPanelHeader title="Tóm tắt tiếp nhận" />
          <CardPanelBody>
            <dl className="rf-summary-list">
              <div className="rf-summary-list__row">
                <dt className="rf-summary-list__key">Mô tả tổng quát</dt>
                <dd className="rf-summary-list__value">
                  {order.customerDescription || 'Không có mô tả bổ sung'}
                </dd>
              </div>
              <div className="rf-summary-list__row">
                <dt className="rf-summary-list__key">Nhân sự phụ trách</dt>
                <dd className="rf-summary-list__value">
                  {order.assignments && order.assignments.length > 0 ? (
                    <ul className="rf-order-assignment-list">
                      {order.assignments.map((asg) => (
                        <li key={asg.id}>
                          <strong>{asg.staffProfileName}</strong> ({formatStaffResponsibility(asg.responsibility)})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'Chưa phân công'
                  )}
                </dd>
              </div>
              <div className="rf-summary-list__row">
                <dt className="rf-summary-list__key">Hẹn hoàn thành</dt>
                <dd className="rf-summary-list__value">
                  {order.expectedCompletedAt ? formatDateTime(order.expectedCompletedAt) : 'Chưa thiết lập'}
                </dd>
              </div>
              <div className="rf-summary-list__row">
                <dt className="rf-summary-list__key">Tổng số thiết bị</dt>
                <dd className="rf-summary-list__value">
                  <strong>{items.length}</strong> thiết bị
                </dd>
              </div>
            </dl>
          </CardPanelBody>
        </CardPanel>
      </div>

      {/* Multi-Device Items Section */}
      <section className="rf-order-items-section" aria-label="Danh sách thiết bị tiếp nhận">
        <div className="rf-order-items-section__header">
          <h2 className="rf-order-items-section__title">
            <IconDevices size={18} aria-hidden="true" />
            <span>Thiết bị tiếp nhận & Bàn giao ({items.length})</span>
          </h2>
        </div>

        {/* Multi-device Tab Strip / Switcher */}
        {items.length > 1 && (
          <div className="rf-device-tab-bar" role="tablist" aria-label="Chọn thiết bị để xem chi tiết">
            {items.map((it) => {
              const isSelected = it.itemIndex === selectedItem?.itemIndex;
              return (
                <button
                  key={it.id}
                  type="button"
                  role="tab"
                  id={`tab-device-${it.itemIndex}`}
                  aria-controls={`panel-device-${it.itemIndex}`}
                  aria-selected={isSelected}
                  className={`rf-device-tab-btn ${isSelected ? 'rf-device-tab-btn--active' : ''}`}
                  onClick={() => setSelectedItemIndex(it.itemIndex)}
                >
                  <span className="rf-device-tab-index">#{it.itemIndex}</span>
                  <span className="rf-device-tab-name">{it.brand} {it.model}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Device Details Card */}
        {selectedItem ? (
          <div
            id={`panel-device-${selectedItem.itemIndex}`}
            role="tabpanel"
            aria-labelledby={`tab-device-${selectedItem.itemIndex}`}
            className="rf-device-detail-card"
          >
            <div className="rf-device-detail-card__top">
              <div className="rf-device-detail-title-block">
                <span className="rf-device-detail-badge">Thiết bị #{selectedItem.itemIndex}</span>
                <h3 className="rf-device-detail-heading">
                  {selectedItem.brand} {selectedItem.model}
                </h3>
                <span className="rf-device-detail-type">({formatDeviceType(selectedItem.deviceType)})</span>
              </div>
            </div>

            <div className="rf-device-detail-grid">
              {/* Device Identifiers */}
              <div className="rf-device-detail-block">
                <h4 className="rf-device-detail-block__title">Định danh thiết bị</h4>
                <dl className="rf-summary-list rf-summary-list--compact">
                  <div className="rf-summary-list__row">
                    <dt className="rf-summary-list__key">Số Serial / IMEI</dt>
                    <dd className="rf-summary-list__value rf-font-mono">
                      {selectedItem.serialNumber || '—'}
                    </dd>
                  </div>
                  {selectedItem.identifier && (
                    <div className="rf-summary-list__row">
                      <dt className="rf-summary-list__key">Mã định danh phụ</dt>
                      <dd className="rf-summary-list__value rf-font-mono">
                        {selectedItem.identifier}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Security & Passcode Status */}
              <div className="rf-device-detail-block">
                <h4 className="rf-device-detail-block__title">Bảo mật thiết bị</h4>
                <div className="rf-device-security-box">
                  <IconShield size={16} aria-hidden="true" />
                  <div>
                    <span className="rf-device-security-box__label">
                      {formatCredentialStatus(selectedItem.credentialStatus).label}
                    </span>
                    {selectedItem.credentialConsent && (
                      <span className="rf-device-security-box__consent">
                        <IconCheck size={12} aria-hidden="true" /> Khách hàng đã đồng ý cung cấp cho mục đích sửa chữa
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reported Issue Callout Box (Primary Intake Evidence) */}
            <div className="rf-reported-issue-box">
              <div className="rf-reported-issue-box__header">
                <span className="rf-reported-issue-box__badge">LỖI KHÁCH MÔ TẢ KHI TIẾP NHẬN</span>
              </div>
              <p className="rf-reported-issue-box__content">{selectedItem.reportedIssue}</p>
            </div>

            {/* Handover Conditions, Accessories, Technical Notes */}
            <div className="rf-device-handover-grid">
              <div className="rf-device-handover-cell">
                <span className="rf-device-handover-label">Tình trạng ban đầu khi nhận:</span>
                <p className="rf-device-handover-value">
                  {formatPresetValue(selectedItem.handoverCondition, 'Không ghi nhận trầy xước bất thường')}
                </p>
              </div>

              <div className="rf-device-handover-cell">
                <span className="rf-device-handover-label">Phụ kiện kèm theo:</span>
                <p className="rf-device-handover-value">
                  {formatPresetValue(selectedItem.accessories, 'Không có phụ kiện kèm theo')}
                </p>
              </div>

              {selectedItem.itemNotes && (
                <div className="rf-device-handover-cell rf-device-handover-cell--full">
                  <span className="rf-device-handover-label">Ghi chú tiếp nhận kỹ thuật:</span>
                  <p className="rf-device-handover-value">{selectedItem.itemNotes}</p>
                </div>
              )}
            </div>

            {/* Slot for C2-006 Tagging & C2-008 Evidence */}
            <div className="rf-order-slots-container">
              <div
                className="rf-slot-placeholder rf-slot-placeholder--tags"
                aria-label="Khu vực nhãn thẻ thiết bị (dành cho C2-006)"
              >
                <span className="rf-slot-placeholder__hint">
                  [Nhãn thẻ phân loại & ưu tiên thiết bị — Sẽ được kết nối trong kế hoạch C2-006]
                </span>
              </div>

              <div
                className="rf-slot-placeholder rf-slot-placeholder--evidence"
                aria-label="Khu vực ảnh chụp hiện trạng bàn giao (dành cho C2-008)"
              >
                <span className="rf-slot-placeholder__hint">
                  [Hồ sơ ảnh hiện trạng bàn giao tiếp nhận — Sẽ được kết nối trong kế hoạch C2-008]
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rf-order-no-device-item">
            <p>Không có thông tin thiết bị cho phiếu sửa chữa này.</p>
          </div>
        )}
      </section>

      {/* Next Workflow Steps Guidance Panel */}
      <div className="rf-next-steps-banner" role="region" aria-label="Định hướng quy trình">
        <div className="rf-next-steps-banner__icon" aria-hidden="true">
          <IconDevices size={20} />
        </div>
        <div className="rf-next-steps-banner__content">
          <h4 className="rf-next-steps-banner__title">Bước tiếp theo của quy trình</h4>
          <p className="rf-next-steps-banner__desc">
            Phiếu sửa chữa đã hoàn tất tiếp nhận thành công. Các công đoạn chẩn đoán chuyên sâu,
            lập báo giá chi tiết và điều phối kỹ thuật viên sẽ được kích hoạt tại khu vực điều hành theo quy trình xưởng.
          </p>
        </div>
      </div>

      {/* Status History Timeline */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <CardPanel style={{ marginTop: '1.5rem' }}>
          <CardPanelHeader title="Lịch sử trạng thái phiếu" />
          <CardPanelBody>
            <ol className="rf-order-timeline">
              {order.statusHistory.map((hist) => {
                const toStatusInfo = getOrderStatusInfo(hist.toStatus);
                return (
                  <li key={hist.id} className="rf-order-timeline-item">
                    <div className="rf-order-timeline-point" aria-hidden="true" />
                    <div className="rf-order-timeline-content">
                      <div className="rf-order-timeline-header">
                        <span className="rf-order-timeline-status">
                          Chuyển sang: <strong>{toStatusInfo.label}</strong>
                        </span>
                        <time className="rf-order-timeline-time rf-font-mono">
                          {formatDateTime(hist.createdAt)}
                        </time>
                      </div>
                      {hist.reason && (
                        <p className="rf-order-timeline-reason">{formatStatusReason(hist.reason)}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardPanelBody>
        </CardPanel>
      )}
    </div>
  );
}
