import { useState } from 'react';
import {
  CustomerFooter,
  CustomerHeader,
  IconShield,
  PrimaryButton,
  SecondaryButton,
} from '../../shared/components';

interface CustomerProgressViewProps {
  orderId?: string;
}

export function CustomerProgressView({ orderId = 'RF-2026-0891' }: CustomerProgressViewProps) {
  const [decision, setDecision] = useState<'pending' | 'approved' | 'rejected'>('pending');

  return (
    <div className="customer-layout">
      <CustomerHeader storeName="Minh Tâm Store" />

      <main className="customer-content">
        {/* Device & Status Lockup */}
        <div className="customer-lockup">
          <span className="eyebrow">Theo dõi tiến độ sửa chữa</span>
          <h1 className="customer-title">iPhone 13 Pro (256GB, Xanh)</h1>
          <p className="customer-meta">
            Mã phiếu: <strong className="rf-font-mono">{orderId}</strong>
          </p>
        </div>

        {/* Status Stepper - Flat structured block */}
        <div className="customer-status-block">
          <div className="customer-status-row">
            <span className="status-check" aria-hidden="true">✓</span>
            <div>
              <strong>Đang chờ bạn xem và duyệt báo giá</strong>
              <span>Kỹ thuật viên đã hoàn thành kiểm tra và lên phương án xử lý.</span>
            </div>
          </div>

          <div className="customer-progress">
            <span className="is-complete" />
            <span className="is-complete" />
            <span className="is-active" />
            <span />
            <span />
          </div>

          <div className="customer-progress-labels">
            <span>Tiếp nhận</span>
            <span>Chẩn đoán</span>
            <strong>Báo giá</strong>
            <span>Sửa chữa</span>
            <span>Bàn giao</span>
          </div>
        </div>

        {/* Diagnosis & Condition Summary */}
        <div className="customer-section">
          <span className="section-eyebrow">Kết quả chẩn đoán lỗi</span>
          <p className="diagnosis-summary">
            Màn hình bị sọc sáng dọc và nứt vỡ góc phải do va đập, liệt cảm ứng một phần.
            Các linh kiện khác (Camera, Pin, FaceID, Loa/Mic) hoạt động bình thường.
          </p>
        </div>

        {/* Quotation Breakdown */}
        <div className="customer-section">
          <span className="section-eyebrow">Chi tiết báo giá sửa chữa</span>
          <div className="quote-table">
            <div className="quote-row">
              <div>
                <strong>Thay cụm màn hình OLED chính hãng</strong>
                <span>Bảo hành linh kiện 6 tháng</span>
              </div>
              <strong className="rf-font-mono">4.500.000 ₫</strong>
            </div>

            <div className="quote-row">
              <div>
                <strong>Vệ sinh máy & dán keo chống bụi</strong>
                <span>Miễn phí dịch vụ đi kèm</span>
              </div>
              <strong className="rf-font-mono quote-free">0 ₫</strong>
            </div>

            <div className="quote-total-row">
              <span>Tổng chi phí cần thanh toán:</span>
              <strong className="rf-font-mono quote-total-amount">4.500.000 ₫</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons or Decision Feedback */}
        {decision === 'pending' ? (
          <div className="customer-actions">
            <PrimaryButton
              fullWidth
              onClick={() => setDecision('approved')}
            >
              ✓ Đồng ý tiến hành sửa chữa
            </PrimaryButton>
            <SecondaryButton
              className="btn-reject"
              onClick={() => setDecision('rejected')}
            >
              Trao đổi thêm hoặc Từ chối sửa
            </SecondaryButton>
          </div>
        ) : decision === 'approved' ? (
          <div className="decision-alert decision-alert--approved">
            <strong>✓ Bạn đã đồng ý sửa chữa!</strong>
            <p>Cửa hàng đã nhận được xác nhận. Kỹ thuật viên sẽ bắt đầu sửa ngay và thông báo khi hoàn tất.</p>
          </div>
        ) : (
          <div className="decision-alert decision-alert--rejected">
            <strong>Đã ghi nhận yêu cầu trao đổi thêm</strong>
            <p>Lễ tân sẽ liên hệ lại với bạn qua số điện thoại đăng ký trong ít phút.</p>
          </div>
        )}

        <p className="customer-security-note">
          <IconShield size={14} aria-hidden="true" />
          <span>Liên kết này được bảo mật riêng cho thiết bị của bạn.</span>
        </p>
      </main>

      <CustomerFooter
        storeName="Minh Tâm Store"
        hotline="0988-xxx-xxx"
        address="Hà Nội, Việt Nam"
      />
    </div>
  );
}
