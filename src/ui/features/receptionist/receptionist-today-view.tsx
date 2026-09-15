import { useState } from 'react';
import {
  OrderCode,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  IconLookup,
} from '../../shared/components';

interface LookupResult {
  orderId: string;
  customerName: string;
  customerPhone: string;
  device: string;
  serial: string;
  currentStage: string;
  statusTone: string;
  nextStep: string;
  waitingParty: string;
  customerSafeDiagnosis: string;
  quotedAmount: string;
  expectedCompletion: string;
  lastUpdated: string;
}

const DEMO_LOOKUP_DATA: LookupResult = {
  orderId: 'RF-2026-0891',
  customerName: 'Nguyễn Văn Hùng',
  customerPhone: '0912 345 678',
  device: 'iPhone 13 Pro (256GB, Xanh)',
  serial: 'F2LLD0XXXXXX',
  currentStage: 'Đang sửa chữa linh kiện',
  statusTone: 'violet',
  nextStep: 'KTV thay thế cụm màn hình OLED và kiểm tra cảm ứng',
  waitingParty: 'Kỹ thuật viên (Quốc Bảo)',
  customerSafeDiagnosis: 'Màn hình bị sọc sáng và vỡ kính góc phải, liệt cảm ứng một phần. Đã được khách duyệt thay thế màn hình chính hãng.',
  quotedAmount: '4.500.000 ₫',
  expectedCompletion: 'Hôm nay, 16:30',
  lastUpdated: '15 phút trước',
};

export function ReceptionistTodayView() {
  const [searchTerm, setSearchTerm] = useState('0912 345 678');
  const [lookupOrder, setLookupOrder] = useState<LookupResult | null>(DEMO_LOOKUP_DATA);
  const [activeTab, setActiveTab] = useState<'today' | 'lookup'>('today');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLookupOrder(DEMO_LOOKUP_DATA);
      setActiveTab('lookup');
    }
  };

  return (
    <div className="view-container">
      {/* Page Heading */}
      <section className="page-heading">
        <div>
          <span className="eyebrow">Quầy Lễ Tân • Tổng quan hôm nay</span>
          <h1>Tiếp nhận & Tra cứu tiến độ</h1>
          <p>Hỗ trợ khách gửi máy, trả lời tiến độ và bàn giao thiết bị.</p>
        </div>
        <PrimaryButton>
          <span aria-hidden="true">＋</span> Tiếp nhận phiếu mới
        </PrimaryButton>
      </section>

      {/* Receptionist Quick Nav Tabs */}
      <div className="receptionist-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'today' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Tổng quan hôm nay (5 việc cần xử lý)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'lookup' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('lookup')}
        >
          Tra cứu tiến độ (Chế độ đọc an toàn)
        </button>
      </div>

      {activeTab === 'today' ? (
        <>
          {/* Flat Strip for Receptionist Daily Highlights */}
          <section className="metric-strip" aria-label="Thống kê tiếp nhận hôm nay">
            <div className="metric-strip__item">
              <span className="metric-label">Đã tiếp nhận hôm nay</span>
              <div className="metric-value-row">
                <strong className="metric-value">12</strong>
                <span className="metric-hint">3 phiếu mới trong 1h qua</span>
              </div>
            </div>
            <div className="metric-strip__item">
              <span className="metric-label">Chờ khách duyệt giá</span>
              <div className="metric-value-row">
                <strong className="metric-value">05</strong>
                <span className="metric-hint">Cần gọi nhắc 2 khách</span>
              </div>
            </div>
            <div className="metric-strip__item">
              <span className="metric-label">Sẵn sàng trả máy</span>
              <div className="metric-value-row">
                <strong className="metric-value">08</strong>
                <span className="metric-hint">Đã QC đạt chuẩn</span>
              </div>
            </div>
            <div className="metric-strip__item">
              <span className="metric-label">Phiếu nháp chưa gửi</span>
              <div className="metric-value-row">
                <strong className="metric-value">02</strong>
                <span className="metric-hint">Cần bổ sung ảnh hiện trạng</span>
              </div>
            </div>
          </section>

          {/* Quick Search Action Bar */}
          <section className="panel search-lookup-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Trả lời nhanh cho khách hàng</span>
                <h2>Tra cứu tiến độ thiết bị tức thì</h2>
              </div>
            </div>
            <form onSubmit={handleSearch} className="lookup-search-form">
              <input
                type="search"
                className="form-input lookup-input"
                placeholder="Nhập số điện thoại khách, mã phiếu (RF-...), hoặc số serial/IMEI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <PrimaryButton type="submit">
                <IconLookup size={14} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: '6px' }} />
                Tra cứu ngay
              </PrimaryButton>
            </form>
          </section>

          {/* Handover Ready List */}
          <section className="panel orders-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Bàn giao máy</span>
                <h2>Thiết bị đã sửa xong — Chờ khách tới nhận</h2>
              </div>
              <SecondaryButton>Xem toàn bộ danh sách trả máy</SecondaryButton>
            </div>
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Mã phiếu</th>
                    <th>Khách hàng</th>
                    <th>Số điện thoại</th>
                    <th>Thiết bị</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><OrderCode code="RF-2026-0885" /></td>
                    <td><strong className="customer-name">Phạm Hoàng Nam</strong></td>
                    <td className="rf-font-mono">0903 112 334</td>
                    <td>iPad Air 5 M1</td>
                    <td><StatusBadge label="Sẵn sàng bàn giao" tone="green" /></td>
                    <td>
                      <button type="button" className="text-button">
                        Bắt đầu trả máy →
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td><OrderCode code="RF-2026-0887" /></td>
                    <td><strong className="customer-name">Đặng Mỹ Linh</strong></td>
                    <td className="rf-font-mono">0982 554 123</td>
                    <td>Apple Watch Series 8</td>
                    <td><StatusBadge label="Sẵn sàng bàn giao" tone="green" /></td>
                    <td>
                      <button type="button" className="text-button">
                        Bắt đầu trả máy →
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        /* Read-Only Operational Lookup View (UI-B02) */
        <section className="panel lookup-detail-panel">
          <div className="lookup-header-strip">
            <div>
              <span className="eyebrow">Chế độ xem an toàn cho Lễ tân (Read-only)</span>
              <h2 className="lookup-order-title">
                Tiến độ phiếu: <OrderCode code={lookupOrder?.orderId || 'RF-2026-0891'} />
              </h2>
            </div>
            <div className="lookup-notice-badge">
              <span>🔒 Màn hình đọc thông tin • Không có quyền sửa giá/kỹ thuật</span>
            </div>
          </div>

          {lookupOrder && (
            <div className="lookup-content-grid">
              {/* Left Column: Essential Info & Customer Safe Summary */}
              <div className="lookup-main-info">
                <div className="info-block">
                  <span className="info-label">Khách hàng & Thiết bị</span>
                  <p className="info-value">
                    <strong>{lookupOrder.customerName}</strong> • {lookupOrder.customerPhone}
                  </p>
                  <p className="info-subvalue">
                    {lookupOrder.device} (Serial: <span className="rf-font-mono">{lookupOrder.serial}</span>)
                  </p>
                </div>

                <div className="info-block info-block--highlight">
                  <span className="info-label">Giai đoạn hiện tại</span>
                  <div className="stage-status-row">
                    <StatusBadge label={lookupOrder.currentStage} tone={lookupOrder.statusTone} />
                    <span className="waiting-pill">Đang chờ: <strong>{lookupOrder.waitingParty}</strong></span>
                  </div>
                  <p className="stage-next-step">
                    <strong>Bước tiếp theo:</strong> {lookupOrder.nextStep}
                  </p>
                </div>

                <div className="info-block">
                  <span className="info-label">Nội dung tóm tắt để trao đổi với khách</span>
                  <div className="customer-safe-box">
                    <p>{lookupOrder.customerSafeDiagnosis}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Key Metas */}
              <div className="lookup-side-info">
                <div className="meta-card">
                  <span className="info-label">Chi phí đã duyệt</span>
                  <strong className="meta-amount rf-font-mono">{lookupOrder.quotedAmount}</strong>
                  <span className="meta-sub">Đã gồm linh kiện & công sửa</span>
                </div>

                <div className="meta-card">
                  <span className="info-label">Thời gian dự kiến hoàn thành</span>
                  <strong className="meta-time">{lookupOrder.expectedCompletion}</strong>
                  <span className="meta-sub">Cập nhật: {lookupOrder.lastUpdated}</span>
                </div>

                <div className="lookup-actions-box">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigator.clipboard.writeText(lookupOrder.customerSafeDiagnosis)}
                  >
                    Sao chép nội dung gửi khách
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
